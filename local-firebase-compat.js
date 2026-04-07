(function () {
  const APPS = [];
  const AUTH_TOKEN_KEY = 'mysql_session_token';
  const API_BASE = localStorage.getItem('mysqlApiBase') || 'http://localhost:3001/api';

  let currentUser = null;
  const authListeners = [];
  const dbPollers = [];

  function randomKey(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  async function api(path, method = 'GET', body = null, includeAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (includeAuth && token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const err = new Error(data.message || data.error || 'Request failed');
      Object.assign(err, data);
      throw err;
    }
    return data;
  }

  function makeCredential(email, password) {
    return { email, password };
  }

  function makeUser(user) {
    if (!user) return null;
    const email = user.email;
    return {
      uid: user.uid,
      email,
      displayName: user.displayName || null,
      reauthenticateWithCredential: async function (cred) {
        if (!cred || cred.email !== email) {
          const e = new Error('Wrong credential');
          e.code = 'auth/wrong-password';
          throw e;
        }
        await api('/auth/reauth', 'POST', { password: cred.password });
      },
      updatePassword: async function (newPassword) {
        await api('/auth/update-password', 'POST', { newPassword });
      },
      delete: async function () {
        await api('/auth/delete-account', 'POST', {});
        localStorage.removeItem(AUTH_TOKEN_KEY);
        currentUser = null;
        notifyAuth();
      }
    };
  }

  function notifyAuth() {
    authListeners.forEach((cb) => {
      try { cb(currentUser); } catch (_) {}
    });
  }

  function makeSnapshot(path, value) {
    return {
      key: (path || '').split('/').filter(Boolean).pop() || null,
      ref: makeRef(path || ''),
      exists: function () {
        if (value === null || value === undefined) return false;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
      },
      val: function () { return value; },
      forEach: function (cb) {
        if (!value || typeof value !== 'object') return false;
        return Object.keys(value).some((k) => cb(makeSnapshot((path ? path + '/' : '') + k, value[k])) === true);
      }
    };
  }

  function normalizeAuthError(err) {
    if (err.code) return err;
    const e = new Error(err.message || 'Auth failed');
    e.code = err.code || 'auth/internal-error';
    return e;
  }

  function makeRef(path) {
    return {
      path,
      key: (path || '').split('/').filter(Boolean).pop() || null,
      child: function (sub) { return makeRef((path ? `${path}/` : '') + sub); },
      set: function (value, cb) {
        return api('/db/write', 'POST', { path, mode: 'set', value })
          .then(() => { if (cb) cb(null); })
          .catch((e) => { if (cb) cb(e); throw e; });
      },
      update: function (value) {
        return api('/db/write', 'POST', { path, mode: 'update', value });
      },
      remove: function () {
        return api('/db/write', 'POST', { path, mode: 'remove' });
      },
      once: function (event) {
        if (event !== 'value') return Promise.reject(new Error('Only value event is supported'));
        return api('/db/read', 'POST', { path }).then((r) => makeSnapshot(path, r.value));
      },
      on: function (event, cb) {
        if (event !== 'value') return;
        let last = '__init__';
        const tick = async () => {
          try {
            const r = await api('/db/read', 'POST', { path });
            const next = JSON.stringify(r.value);
            if (next !== last) {
              last = next;
              cb(makeSnapshot(path, r.value));
            }
          } catch (_) {}
        };
        tick();
        const id = setInterval(tick, 2500);
        dbPollers.push(id);
      },
      orderByChild: function (childKey) {
        return {
          equalTo: function (equalToValue) {
            return {
              once: function (event) {
                if (event !== 'value') return Promise.reject(new Error('Only value event is supported'));
                return api('/db/read', 'POST', { path, query: { orderByChild: childKey, equalTo: equalToValue } })
                  .then((r) => makeSnapshot(path, r.value));
              }
            };
          },
          once: function (event) {
            if (event !== 'value') return Promise.reject(new Error('Only value event is supported'));
            return api('/db/read', 'POST', { path }).then((r) => makeSnapshot(path, r.value));
          }
        };
      },
      push: function (value) {
        const key = randomKey('k');
        const child = makeRef((path ? `${path}/` : '') + key);
        if (typeof value !== 'undefined') child.set(value);
        return child;
      }
    };
  }

  const authApi = {
    get currentUser() {
      return currentUser;
    },
    createUserWithEmailAndPassword: async function (email, password) {
      try {
        const token = localStorage.getItem('pendingRegisterToken') || null;
        const deviceId = localStorage.getItem('device_id') || null;
        const r = await api('/auth/register', 'POST', { email, password, token, deviceId }, false);
        if (r.sessionToken) localStorage.setItem(AUTH_TOKEN_KEY, r.sessionToken);
        currentUser = makeUser(r.user);
        notifyAuth();
        return { user: currentUser };
      } catch (e) {
        throw normalizeAuthError(e);
      }
    },
    signInWithEmailAndPassword: async function (email, password) {
      try {
        const r = await api('/auth/login', 'POST', { email, password }, false);
        if (r.sessionToken) localStorage.setItem(AUTH_TOKEN_KEY, r.sessionToken);
        currentUser = makeUser(r.user);
        notifyAuth();
        return { user: currentUser };
      } catch (e) {
        throw normalizeAuthError(e);
      }
    },
    signOut: async function () {
      try { await api('/auth/logout', 'POST', { sessionToken: localStorage.getItem(AUTH_TOKEN_KEY) || null }); } catch (_) {}
      localStorage.removeItem(AUTH_TOKEN_KEY);
      currentUser = null;
      notifyAuth();
    },
    onAuthStateChanged: function (cb) {
      authListeners.push(cb);
      cb(currentUser);
      return function () {
        const idx = authListeners.indexOf(cb);
        if (idx >= 0) authListeners.splice(idx, 1);
      };
    },
    sendPasswordResetEmail: function (email) {
      return api('/auth/password-reset', 'POST', { email }, false).then(() => undefined);
    }
  };

  authApi.EmailAuthProvider = { credential: makeCredential };

  const storageApi = {
    ref: function (path) {
      return {
        getDownloadURL: async function () {
          const r = await api(`/storage/get?path=${encodeURIComponent(path)}`, 'GET', null, false);
          return r.dataUrl;
        },
        put: function (file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function () {
              try {
                await api('/storage/upload', 'POST', {
                  path,
                  dataUrl: reader.result,
                  mimeType: file.type || 'application/octet-stream'
                });
                resolve({ ref: storageApi.ref(path) });
              } catch (e) {
                reject(e);
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        },
        putString: async function (dataUrl) {
          await api('/storage/upload', 'POST', { path, dataUrl, mimeType: 'text/plain' });
          return { ref: storageApi.ref(path) };
        }
      };
    }
  };

  const messagingApi = {
    onMessage: function () {},
    getToken: function () { return Promise.resolve('mysql-local-token'); }
  };

  async function restoreSession() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      currentUser = null;
      notifyAuth();
      return;
    }
    try {
      const r = await api('/auth/session', 'GET', null, true);
      currentUser = makeUser(r.user);
      notifyAuth();
    } catch (_) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      currentUser = null;
      notifyAuth();
    }
  }

  window.firebase = {
    apps: APPS,
    initializeApp: function (config) {
      if (!APPS.length) APPS.push({ config });
      restoreSession();
      return APPS[0];
    },
    auth: function () { return authApi; },
    database: function () { return { ref: function (path) { return makeRef(path || ''); } }; },
    storage: function () { return storageApi; },
    messaging: function () { return messagingApi; }
  };

  window.firebase.auth.EmailAuthProvider = authApi.EmailAuthProvider;
})();
