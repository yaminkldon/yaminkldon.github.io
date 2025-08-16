// --- Firebase SDKs (add these in your HTML before this script) ---
// <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>

// --- Firebase Config (replace with your own) ---
const firebaseConfig = {
  apiKey: "AIzaSyCVoy2aBaQO1RDpoGGPIBqriFnGdKeNqHk",
  authDomain: "raednusairat-68b52.firebaseapp.com",
  databaseURL: "https://raednusairat-68b52-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "raednusairat-68b52",
  storageBucket: "raednusairat-68b52.appspot.com",
  messagingSenderId: "852022576722",
  appId: "1:852022576722:web:8546d7cd4d3f6b0f8fc18b",
  measurementId: "G-HDLMYVXH5T"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Lightweight auth debug helper
const AuthDebug = {
  enabled: false,
  enable() { this.enabled = true; console.info('[AuthDebug] enabled'); },
  disable() { this.enabled = false; console.info('[AuthDebug] disabled'); },
  log(...args) { if (this.enabled) console.log('[AuthDebug]', ...args); },
  async checkBindingNow() {
    const user = firebase.auth().currentUser;
    if (!user) { console.warn('[AuthDebug] No current user'); return null; }
    const email = user.email || '';
  const localId = (typeof window.ensureDeviceId === 'function') ? window.ensureDeviceId() : getDeviceId();
    const ua = navigator.userAgent || '';
    const snap = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    const records = [];
    if (snap.exists()) {
      snap.forEach(ch => { records.push({ key: ch.key, ...ch.val() }); });
    }
    const deviceIds = records.map(r => r.deviceId || null);
    const types = records.map(r => r.type || 'unknown');
    const anyMismatch = records.some(r => r.deviceId && r.deviceId !== localId);
    const allEmpty = records.every(r => !r.deviceId);
    const result = { email, localId, deviceIds, types, ua, anyMismatch, allEmpty, fromApp: isFromApp() };
    console.table(result);
    return result;
  }
};
// Expose for console use
window.AuthDebug = AuthDebug;

// Detect if request is coming from the official app (stand-in for server header check)
function isFromApp() {
  try {
    const ua = navigator.userAgent || '';
    // Match your app’s custom UA segment (e.g., set by Capacitor/Android WebView)
    // Example expected: 'RaedApp/1.0'
    return ua.includes('RaedApp/1.0');
  } catch (_) {
    return false;
  }
}

function getDeviceId() {
  if (typeof window.ensureDeviceId === 'function') {
    return window.ensureDeviceId();
  }
  // Fallback to stored value or UA-hash
  let id = localStorage.getItem('device_id');
  if (id) return id;
  try {
    const ua = navigator.userAgent || 'unknown';
    let x = 0; for (let i = 0; i < ua.length; i++) { x = (x * 31 + ua.charCodeAt(i)) >>> 0; }
    id = 'browser-fallback-' + x.toString(16);
    localStorage.setItem('device_id', id);
    return id;
  } catch {
    return 'browser-fallback-unknown';
  }
}

function showProgress(show) {
  const bar = document.getElementById('progressBar');
  if (show) {
    bar.style.display = 'block';
    bar.style.width = '50%';
  } else {
    bar.style.display = 'none';
    bar.style.width = '0%';
  }
}

// Trigger login only on Enter/Go keypress in email/password fields
(function initLoginEnterOnly(){
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginEnterOnly);
    return;
  }
  const emailEl = document.getElementById('email');
  const pwdEl = document.getElementById('password');
  const btn = document.getElementById('login-btn');
  if (!emailEl || !pwdEl || !btn) return;

  function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function ready(){ return isValidEmail(emailEl.value.trim()) && !!pwdEl.value.trim(); }
  function onKey(e){
    if (e.key === 'Enter') {
      e.preventDefault();
      if (ready()) {
        btn.disabled = false;
        login();
      }
    }
  }
  emailEl.addEventListener('keydown', onKey);
  pwdEl.addEventListener('keydown', onKey);
})();

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const deviceId = getDeviceId();

  AuthDebug.log('Login attempt', { email, deviceId, ua: navigator.userAgent, fromApp: isFromApp() });

  if (!email || !password) {
    NotificationManager.showToast("Make sure all fields are filled");
    return;
  }

  // Preflight: try to check expiration with server time before signing in
  const preflight = (async () => {
    try {
      const snap = await db.ref('users').orderByChild('email').equalTo(email).once('value');
      if (snap.exists()) {
        const now = (window.getServerNow && typeof window.getServerNow === 'function') ? window.getServerNow() : Date.now();
        let allowedByExpiry = false;
        snap.forEach(child => {
          const u = child.val();
          if (!u.expirationDate || now <= u.expirationDate) allowedByExpiry = true;
        });
        return allowedByExpiry;
      }
      // No matching DB record; allow auth to proceed so we can handle normally
      return true;
    } catch (e) {
      // Likely permission denied for unauth reads; proceed to auth and handle post-check
      return null;
    }
  })();

  preflight.then((allowedByExpiry) => {
    if (allowedByExpiry === false) {
      NotificationManager.showToast('Account expired');
      return; // Block signing in at all
    }

    showProgress(true);

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      db.ref('users').orderByChild('email').equalTo(email).once('value')
        .then(snapshot => {
          showProgress(false);
          if (snapshot.exists()) {
            const records = [];
            snapshot.forEach(child => { records.push({ key: child.key, ref: child.ref, data: child.val() }); });
            AuthDebug.log('User records', records.map(r => ({ key: r.key, deviceId: r.data.deviceId || null, type: r.data.type, exp: r.data.expirationDate || null })));

            // App-only rule for students
            const anyStudent = records.some(r => (r.data.type === 'student'));
            if (anyStudent && !isFromApp()) {
              NotificationManager.showToast("Login allowed only from the official app");
              AuthDebug.log('Denied: student not from app');
              try { firebase.auth().signOut(); } catch (_) {}
              return;
            }

            const localId = deviceId;
            const anyMismatch = records.some(r => r.data.deviceId && r.data.deviceId !== localId);
            const allEmpty = records.every(r => !r.data.deviceId);

            if (anyMismatch) {
              NotificationManager.showToast("Login failed: account bound to another device");
              AuthDebug.log('Denied: device mismatch', { localId, deviceIds: records.map(r => r.data.deviceId || null) });
              try { firebase.auth().signOut(); } catch (_) {}
              return;
            }

            // If ALL records are empty deviceId, bind the first record to this device
            if (allEmpty && records.length > 0) {
              AuthDebug.log('Binding deviceId to first record', { key: records[0].key, localId });
              records[0].ref.update({ deviceId: localId });
            }

            // Check expiration using server time and block login before completion
            const now = (window.getServerNow && typeof window.getServerNow === 'function') ? window.getServerNow() : Date.now();
            const allowedByExpiry = records.some(r => !r.data.expirationDate || now <= r.data.expirationDate);
            if (!allowedByExpiry) {
              NotificationManager.showToast('Account expired');
              AuthDebug.log('Denied: expired');
              // Cancel this login by signing out immediately and staying on login page
              try { firebase.auth().signOut(); } catch (_) {}
              return;
            }

            NotificationManager.showToast("Login Successful");
            setTimeout(() => { Navigation.goToMainPage(); }, 800);
          } else {
            NotificationManager.showToast("User not found");
          }
        });
    })
    .catch(error => {
      showProgress(false);
      NotificationManager.showToast("Login failed: " + error.message);
    });
  });
}

function goToRegister() {
  Navigation.goToRegister();
}

document.getElementById('email').addEventListener('input', function() {
  const email = this.value.trim();
  const errorSpan = document.getElementById('email-error');
  const loginBtn = document.getElementById('login-btn');
  // PHP's FILTER_VALIDATE_EMAIL equivalent regex
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    errorSpan.textContent = "Please enter a valid email address.";
    errorSpan.style.display = "block";
    loginBtn.disabled = true;
  } else {
    errorSpan.textContent = "";
    errorSpan.style.display = "none";
    loginBtn.disabled = false;
  }
});

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    AuthDebug.log('Auth state changed: user present');
    // Double-check user record to enforce student app-only rule even if token is present
    const email = user.email || '';
    db.ref('users').orderByChild('email').equalTo(email).once('value').then(snapshot => {
      if (!snapshot.exists()) {
        AuthDebug.log('No DB record found for email');
        return Navigation.goToMainPage();
      }
      let allowed = true;
      let deviceAllowed = true;
      let allowedByExpiry = false;
      const now = (window.getServerNow && typeof window.getServerNow === 'function') ? window.getServerNow() : Date.now();
      const localDeviceId = ensureDeviceId();
      const deviceIds = [];
      snapshot.forEach(child => {
        const u = child.val();
        if ((u.type === 'student') && !isFromApp()) {
          allowed = false;
        }
        if (u.deviceId && localDeviceId && u.deviceId !== localDeviceId) {
          deviceAllowed = false;
        }
        if (!u.expirationDate || now <= u.expirationDate) {
          allowedByExpiry = true;
        }
        deviceIds.push(u.deviceId || null);
      });
      AuthDebug.log('Post-login check', { localDeviceId, deviceIds, fromApp: isFromApp(), allowed, deviceAllowed, allowedByExpiry });
      if (!allowed) {
        NotificationManager.showToast('Access allowed only from the official app');
        try { firebase.auth().signOut(); } catch (_) {}
        return;
      }
      if (!deviceAllowed) {
        NotificationManager.showToast('This account is already bound to another device');
        try { firebase.auth().signOut(); } catch (_) {}
        return;
      }
      if (!allowedByExpiry) {
        NotificationManager.showToast('Account expired');
        try { firebase.auth().signOut(); } catch (_) {}
        return;
      }
      Navigation.goToMainPage();
    }).catch(() => Navigation.goToMainPage());
  }
  // Do NOT redirect to index.html again if not logged in; stay on login page
});