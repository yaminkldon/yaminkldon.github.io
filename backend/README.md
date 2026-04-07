# MySQL Backend (HeidiSQL friendly)

This backend replaces Firebase with MySQL + REST API.

## 1) Create DB in MySQL

Run `backend/schema.sql` in HeidiSQL query tab.

Default database: `yaminkldon_app`

## 2) Configure

Copy `.env.example` to `.env` and set values.

## 3) Install + run

```bash
cd backend
npm install
npm start
```

Server URL: `http://localhost:3001`

## 4) Frontend

The frontend uses `local-firebase-compat.js`, now configured to call:
- `http://localhost:3001/api`

You can change endpoint in browser console:
```js
localStorage.setItem('mysqlApiBase', 'http://YOUR_SERVER:3001/api');
```

## 5) Edit manually in HeidiSQL

Users are in table:
- `users`

Registration tokens are in table:
- `register_tokens`

Main app data tree is in table:
- `app_kv` (top-level keys like `units`, `progress`, `assignments`, etc.)

Sessions:
- `auth_sessions`

Uploaded storage blobs (data URLs):
- `storage_objects`

## Notes

Default registration tokens are seeded in `register_tokens`:
- `DEMO30`
- `DEMO90`
- `DEMO365`
