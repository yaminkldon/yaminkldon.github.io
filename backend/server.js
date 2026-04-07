const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));

const PORT = Number(process.env.PORT || 3001);
const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'yaminkldon_app';

const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  connectionLimit: 10
});

function nowPlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function randomKey(prefix = 'k') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePath(path) {
  return String(path || '').replace(/^\/+|\/+$/g, '');
}

function getPath(obj, path) {
  if (!path) return obj;
  const parts = String(path).split('/').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object' || !(p in cur)) return null;
    cur = cur[p];
  }
  return cur;
}

function setPath(obj, path, value) {
  const parts = String(path).split('/').filter(Boolean);
  if (!parts.length) return value;
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  return obj;
}

function removePath(obj, path) {
  const parts = String(path).split('/').filter(Boolean);
  if (!parts.length) return;
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== 'object') return;
    cur = cur[p];
  }
  delete cur[parts[parts.length - 1]];
}

function queryByChild(node, orderByChild, equalTo) {
  const out = {};
  if (!node || typeof node !== 'object') return out;
  Object.keys(node).forEach((k) => {
    const item = node[k];
    if (item && typeof item === 'object' && item[orderByChild] === equalTo) out[k] = item;
  });
  return out;
}

async function ensureDatabaseExists() {
  const conn = await mysql.createConnection({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD
  });
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await conn.end();
  }
}

async function initDb() {
  await ensureDatabaseExists();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      uid VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      display_name VARCHAR(255) NULL,
      device_id VARCHAR(255) NULL,
      user_type VARCHAR(32) NOT NULL DEFAULT 'student',
      plan VARCHAR(32) NOT NULL DEFAULT 'Monthly',
      subscription_status VARCHAR(32) NOT NULL DEFAULT 'active',
      started_at BIGINT NULL,
      expiration_date BIGINT NULL,
      register_token VARCHAR(128) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS register_tokens (
      token VARCHAR(128) PRIMARY KEY,
      duration_days INT NOT NULL,
      plan VARCHAR(32) NOT NULL,
      is_used TINYINT(1) NOT NULL DEFAULT 0,
      used_by_uid VARCHAR(64) NULL,
      used_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token VARCHAR(128) PRIMARY KEY,
      uid VARCHAR(64) NOT NULL,
      email VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_auth_sessions_uid(uid),
      INDEX idx_auth_sessions_email(email)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_kv (
      path VARCHAR(512) PRIMARY KEY,
      value_json JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS storage_objects (
      path VARCHAR(512) PRIMARY KEY,
      data_url LONGTEXT NOT NULL,
      mime_type VARCHAR(128) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    INSERT INTO register_tokens(token, duration_days, plan, is_used)
    VALUES
      ('DEMO30', 30, 'Monthly', 0),
      ('DEMO90', 90, 'Quarterly', 0),
      ('DEMO365', 365, 'Yearly', 0)
    ON DUPLICATE KEY UPDATE token = token
  `);

  const [kvRows] = await pool.query('SELECT COUNT(*) AS c FROM app_kv');
  if (!kvRows[0].c) {
    await pool.query(
      `INSERT INTO app_kv(path, value_json)
       VALUES
         ('units', JSON_OBJECT()),
         ('progress', JSON_OBJECT()),
         ('assignments', JSON_OBJECT()),
         ('submissions', JSON_OBJECT()),
         ('quizzes', JSON_OBJECT()),
         ('quizSubmissions', JSON_OBJECT()),
         ('security_violations', JSON_OBJECT())`
    );
  }
}

function userRowToObject(row) {
  if (!row) return null;
  return {
    uid: row.uid,
    email: row.email,
    password: row.password,
    displayName: row.display_name || null,
    deviceId: row.device_id || null,
    type: row.user_type || 'student',
    plan: row.plan || 'Monthly',
    subscriptionStatus: row.subscription_status || 'active',
    startedAt: row.started_at || null,
    expirationDate: row.expiration_date || null,
    token: row.register_token || null
  };
}

async function getUsersMap() {
  const [rows] = await pool.query('SELECT * FROM users');
  const out = {};
  rows.forEach((r) => {
    out[r.uid] = userRowToObject(r);
  });
  return out;
}

async function getTokensMap() {
  const [rows] = await pool.query('SELECT token, duration_days, plan, is_used FROM register_tokens');
  const out = {};
  rows.forEach((r) => {
    out[r.token] = {
      duration: Number(r.duration_days),
      plan: r.plan,
      used: !!r.is_used
    };
  });
  return out;
}

async function loadAppTree() {
  const [rows] = await pool.query('SELECT path, value_json FROM app_kv');
  const tree = {};
  for (const row of rows) {
    const p = normalizePath(row.path);
    let value = row.value_json;
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        value = null;
      }
    }
    if (!p) continue;
    setPath(tree, p, value);
  }
  return tree;
}

async function persistAppTree(tree) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM app_kv');

    const entries = Object.keys(tree || {}).map((k) => [k, JSON.stringify(tree[k])]);
    if (entries.length) {
      await conn.query('INSERT INTO app_kv(path, value_json) VALUES ?', [entries]);
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function getSession(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.headers['x-session-token'] || null);
  if (!token) return null;
  const [rows] = await pool.query('SELECT token, uid, email, expires_at FROM auth_sessions WHERE token = ? LIMIT 1', [token]);
  if (!rows.length) return null;
  const row = rows[0];
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await pool.query('DELETE FROM auth_sessions WHERE token = ?', [token]);
    return null;
  }
  return { token: row.token, uid: row.uid, email: row.email };
}

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, db: MYSQL_DATABASE });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, token, deviceId } = req.body || {};
  if (!email || !password || !token) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existingUsers] = await conn.query('SELECT uid FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUsers.length) {
      await conn.rollback();
      return res.status(409).json({ code: 'auth/email-already-in-use', message: 'Email already in use' });
    }

    const [tokenRows] = await conn.query('SELECT token, duration_days, plan, is_used FROM register_tokens WHERE token = ? LIMIT 1 FOR UPDATE', [token]);
    if (!tokenRows.length) {
      await conn.rollback();
      return res.status(400).json({ message: 'Invalid token' });
    }

    const tk = tokenRows[0];
    if (Number(tk.is_used) === 1) {
      await conn.rollback();
      return res.status(400).json({ message: 'Token already used' });
    }

    const uid = randomKey('u');
    const duration = Number(tk.duration_days || 30);
    const plan = tk.plan || (duration >= 365 ? 'Yearly' : (duration >= 90 ? 'Quarterly' : 'Monthly'));
    const expirationDate = Date.now() + (duration * 24 * 60 * 60 * 1000);

    await conn.query(
      `INSERT INTO users(uid, email, password, display_name, device_id, user_type, plan, subscription_status, started_at, expiration_date, register_token)
       VALUES(?, ?, ?, NULL, ?, 'student', ?, 'active', ?, ?, ?)`,
      [uid, email, password, deviceId || null, plan, Date.now(), expirationDate, token]
    );

    await conn.query(
      'UPDATE register_tokens SET is_used = 1, used_by_uid = ?, used_at = NOW() WHERE token = ?',
      [uid, token]
    );

    const sessionToken = randomKey('sess');
    const expiresAt = nowPlusDays(30);
    await conn.query('REPLACE INTO auth_sessions(token, uid, email, expires_at) VALUES(?, ?, ?, ?)', [sessionToken, uid, email, expiresAt]);

    await conn.commit();
    return res.status(200).json({ user: { uid, email }, sessionToken });
  } catch (e) {
    await conn.rollback();
    return res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const [rows] = await pool.query('SELECT uid, email, password FROM users WHERE email = ? LIMIT 1', [email]);
    if (!rows.length) return res.status(404).json({ code: 'auth/user-not-found', message: 'User not found' });

    const user = rows[0];
    if (user.password !== password) return res.status(401).json({ code: 'auth/wrong-password', message: 'Wrong password' });

    const sessionToken = randomKey('sess');
    const expiresAt = nowPlusDays(30);
    await pool.query('REPLACE INTO auth_sessions(token, uid, email, expires_at) VALUES(?, ?, ?, ?)', [sessionToken, user.uid, email, expiresAt]);
    return res.status(200).json({ user: { uid: user.uid, email: user.email }, sessionToken });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/session', async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, user: { uid: session.uid, email: session.email } });
});

app.post('/api/auth/logout', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.body?.sessionToken;
  if (token) await pool.query('DELETE FROM auth_sessions WHERE token = ?', [token]);
  res.json({ ok: true });
});

app.post('/api/auth/password-reset', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });
  const [rows] = await pool.query('SELECT uid FROM users WHERE email = ? LIMIT 1', [email]);
  if (!rows.length) return res.status(404).json({ code: 'auth/user-not-found', message: 'User not found' });
  return res.json({ ok: true });
});

app.post('/api/auth/reauth', async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const { password } = req.body || {};
  const [rows] = await pool.query('SELECT password FROM users WHERE uid = ? LIMIT 1', [session.uid]);
  if (!rows.length || rows[0].password !== password) {
    return res.status(401).json({ code: 'auth/wrong-password', message: 'Wrong password' });
  }
  return res.json({ ok: true });
});

app.post('/api/auth/update-password', async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const { newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ code: 'auth/weak-password', message: 'Password too short' });
  }

  await pool.query('UPDATE users SET password = ? WHERE uid = ?', [newPassword, session.uid]);
  return res.json({ ok: true });
});

app.post('/api/auth/delete-account', async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  await pool.query('DELETE FROM users WHERE uid = ?', [session.uid]);
  await pool.query('DELETE FROM auth_sessions WHERE uid = ? OR email = ?', [session.uid, session.email]);
  return res.json({ ok: true });
});

app.post('/api/db/read', async (req, res) => {
  const { path = '', query = null } = req.body || {};
  const normalized = normalizePath(path);

  if (normalized === '.info/serverTimeOffset') {
    return res.json({ value: 0 });
  }

  try {
    let value = null;

    if (!normalized || normalized === 'users' || normalized.startsWith('users/')) {
      const usersMap = await getUsersMap();
      value = normalized ? getPath({ users: usersMap }, normalized) : usersMap;
      if (query && query.orderByChild) value = queryByChild(value, query.orderByChild, query.equalTo);
      return res.json({ value: value ?? null });
    }

    if (normalized === 'tokens' || normalized.startsWith('tokens/')) {
      const tokensMap = await getTokensMap();
      value = getPath({ tokens: tokensMap }, normalized);
      if (query && query.orderByChild) value = queryByChild(value, query.orderByChild, query.equalTo);
      return res.json({ value: value ?? null });
    }

    const tree = await loadAppTree();
    value = getPath(tree, normalized);
    if (query && query.orderByChild) value = queryByChild(value, query.orderByChild, query.equalTo);

    return res.json({ value: value ?? null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/db/write', async (req, res) => {
  const { path = '', mode, value = null } = req.body || {};
  const normalized = normalizePath(path);
  if (!mode) return res.status(400).json({ error: 'mode is required' });

  try {
    if (normalized === 'users' || normalized.startsWith('users/')) {
      const parts = normalized.split('/').filter(Boolean);
      const targetUid = parts[1] || null;

      if (mode === 'remove' && targetUid) {
        await pool.query('DELETE FROM users WHERE uid = ?', [targetUid]);
        return res.json({ value: null });
      }

      if ((mode === 'set' || mode === 'update') && targetUid) {
        const [rows] = await pool.query('SELECT * FROM users WHERE uid = ? LIMIT 1', [targetUid]);
        const existing = rows.length ? userRowToObject(rows[0]) : { uid: targetUid };
        const next = mode === 'set' ? Object.assign({ uid: targetUid }, value || {}) : Object.assign({}, existing, value || {});

        await pool.query(
          `INSERT INTO users(uid, email, password, display_name, device_id, user_type, plan, subscription_status, started_at, expiration_date, register_token)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             email = VALUES(email),
             password = VALUES(password),
             display_name = VALUES(display_name),
             device_id = VALUES(device_id),
             user_type = VALUES(user_type),
             plan = VALUES(plan),
             subscription_status = VALUES(subscription_status),
             started_at = VALUES(started_at),
             expiration_date = VALUES(expiration_date),
             register_token = VALUES(register_token)`,
          [
            targetUid,
            next.email || null,
            next.password || '',
            next.displayName || null,
            next.deviceId || null,
            next.type || 'student',
            next.plan || 'Monthly',
            next.subscriptionStatus || 'active',
            next.startedAt || null,
            next.expirationDate || null,
            next.token || null
          ]
        );

        return res.json({ value: next });
      }

      if (mode === 'push' && normalized === 'users') {
        const uid = randomKey('u');
        const next = Object.assign({ uid }, value || {});
        await pool.query(
          `INSERT INTO users(uid, email, password, display_name, device_id, user_type, plan, subscription_status, started_at, expiration_date, register_token)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uid,
            next.email || null,
            next.password || '',
            next.displayName || null,
            next.deviceId || null,
            next.type || 'student',
            next.plan || 'Monthly',
            next.subscriptionStatus || 'active',
            next.startedAt || null,
            next.expirationDate || null,
            next.token || null
          ]
        );
        return res.json({ key: uid, path: `users/${uid}`, value: next });
      }

      return res.status(400).json({ error: 'Unsupported users write operation' });
    }

    if (normalized === 'tokens' || normalized.startsWith('tokens/')) {
      const parts = normalized.split('/').filter(Boolean);
      const token = parts[1] || null;

      if (mode === 'remove' && token) {
        await pool.query('DELETE FROM register_tokens WHERE token = ?', [token]);
        return res.json({ value: null });
      }

      if ((mode === 'set' || mode === 'update') && token) {
        const [rows] = await pool.query('SELECT token, duration_days, plan, is_used FROM register_tokens WHERE token = ? LIMIT 1', [token]);
        const existing = rows.length ? {
          duration: Number(rows[0].duration_days),
          plan: rows[0].plan,
          used: !!rows[0].is_used
        } : {};
        const next = mode === 'set' ? Object.assign({}, value || {}) : Object.assign({}, existing, value || {});

        await pool.query(
          `INSERT INTO register_tokens(token, duration_days, plan, is_used)
           VALUES(?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE duration_days = VALUES(duration_days), plan = VALUES(plan), is_used = VALUES(is_used)`,
          [token, Number(next.duration || 30), next.plan || 'Monthly', next.used ? 1 : 0]
        );

        return res.json({ value: next });
      }

      if (mode === 'push' && normalized === 'tokens') {
        const newToken = randomKey('tk').toUpperCase();
        const next = Object.assign({ duration: 30, plan: 'Monthly', used: false }, value || {});
        await pool.query(
          'INSERT INTO register_tokens(token, duration_days, plan, is_used) VALUES(?, ?, ?, ?)',
          [newToken, Number(next.duration || 30), next.plan || 'Monthly', next.used ? 1 : 0]
        );
        return res.json({ key: newToken, path: `tokens/${newToken}`, value: next });
      }

      return res.status(400).json({ error: 'Unsupported tokens write operation' });
    }

    const tree = await loadAppTree();

    if (mode === 'set') {
      if (!normalized) return res.json({ value });
      setPath(tree, normalized, value);
      await persistAppTree(tree);
      return res.json({ value });
    }

    if (mode === 'update') {
      const existing = getPath(tree, normalized) || {};
      setPath(tree, normalized, Object.assign({}, existing, value || {}));
      await persistAppTree(tree);
      return res.json({ value: getPath(tree, normalized) });
    }

    if (mode === 'remove') {
      if (!normalized) return res.json({ value: null });
      removePath(tree, normalized);
      await persistAppTree(tree);
      return res.json({ value: null });
    }

    if (mode === 'push') {
      const key = randomKey('k');
      const fullPath = normalized ? `${normalized}/${key}` : key;
      setPath(tree, fullPath, value);
      await persistAppTree(tree);
      return res.json({ key, path: fullPath, value });
    }

    return res.status(400).json({ error: 'Unsupported mode' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/storage/upload', async (req, res) => {
  const { path, dataUrl, mimeType } = req.body || {};
  if (!path || !dataUrl) return res.status(400).json({ error: 'path and dataUrl required' });
  await pool.query(
    'REPLACE INTO storage_objects(path, data_url, mime_type) VALUES(?, ?, ?)',
    [path, dataUrl, mimeType || null]
  );
  res.json({ ok: true });
});

app.get('/api/storage/get', async (req, res) => {
  const path = req.query.path;
  if (!path) return res.status(400).json({ error: 'path required' });
  const [rows] = await pool.query('SELECT data_url FROM storage_objects WHERE path = ? LIMIT 1', [path]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ dataUrl: rows[0].data_url });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MySQL API running on http://localhost:${PORT}`);
      console.log(`Using MySQL: ${MYSQL_USER}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize DB:', err.message);
    process.exit(1);
  });
