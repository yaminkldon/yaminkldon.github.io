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
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'web-' + Math.random().toString(36).substr(2, 16);
    localStorage.setItem('device_id', id);
  }
  return id;
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

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const deviceId = getDeviceId();

  if (!email || !password) {
    NotificationManager.showToast("Make sure all fields are filled");
    return;
  }

  showProgress(true);

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      db.ref('users').orderByChild('email').equalTo(email).once('value')
        .then(snapshot => {
          showProgress(false);
          if (snapshot.exists()) {
            let valid = false;
            snapshot.forEach(child => {
              const user = child.val();
              const userRef = db.ref('users/' + child.key);

              // Students must log in from the mobile app (UA-based check).
              if ((user.type === 'student') && !isFromApp()) {
                NotificationManager.showToast("Login allowed only from the official app");
                valid = false;
                // Ensure sign out so token isn't kept
                try { firebase.auth().signOut(); } catch (_) {}
                return; // skip further checks for this record
              }

              if (!user.deviceId) {
                userRef.update({ deviceId: deviceId });
                user.deviceId = deviceId;
              }

              if (user.deviceId === deviceId) {
                if (!user.expirationDate || Date.now() <= user.expirationDate) {
                  valid = true;
                } else {
                  NotificationManager.showToast("Account expired");
                }
              } else {
                NotificationManager.showToast("Login Failed (DO NOT TRY TO SHARE YOUR ACCOUNT)");
              }
            });
            if (valid) {
              NotificationManager.showToast("Login Successful");
              setTimeout(() => { Navigation.goToMainPage(); }, 1200);
            }
          } else {
            NotificationManager.showToast("User not found");
          }
        });
    })
    .catch(error => {
      showProgress(false);
      NotificationManager.showToast("Login failed: " + error.message);
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
    // Double-check user record to enforce student app-only rule even if token is present
    const email = user.email || '';
    db.ref('users').orderByChild('email').equalTo(email).once('value').then(snapshot => {
      if (!snapshot.exists()) {
        return Navigation.goToMainPage();
      }
      let allowed = true;
      let deviceAllowed = true;
      const localDeviceId = localStorage.getItem('device_id') || '';
      snapshot.forEach(child => {
        const u = child.val();
        if ((u.type === 'student') && !isFromApp()) {
          allowed = false;
        }
        if (u.deviceId && localDeviceId && u.deviceId !== localDeviceId) {
          deviceAllowed = false;
        }
      });
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
      Navigation.goToMainPage();
    }).catch(() => Navigation.goToMainPage());
  }
  // Do NOT redirect to index.html again if not logged in; stay on login page
});