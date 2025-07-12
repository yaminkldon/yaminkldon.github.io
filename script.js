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
    showToast("Make sure all fields are filled");
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

              if (!user.deviceId) {
                userRef.update({ deviceId: deviceId });
                user.deviceId = deviceId;
              }

              if (user.deviceId === deviceId) {
                if (!user.expirationDate || Date.now() <= user.expirationDate) {
                  valid = true;
                } else {
                  showToast("Account expired");
                }
              } else {
                showToast("Login Failed (DO NOT TRY TO SHARE YOUR ACCOUNT)");
              }
            });
            if (valid) {
              showToast("Login Successful");
              setTimeout(() => { window.location.href = "mainpage.html"; }, 1200);
            }
          } else {
            showToast("User not found");
          }
        });
    })
    .catch(error => {
      showProgress(false);
      showToast("Login failed: " + error.message);
    });
}

function goToRegister() {
  window.location.href = "register.html";
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

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.visibility = 'visible';
  toast.style.opacity = '1';
  // Hide after 4 seconds or on click
  const hide = () => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.visibility = 'hidden'; }, 500);
    toast.removeEventListener('click', hide);
  };
  toast.addEventListener('click', hide);
  setTimeout(hide, 4000);
}

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    window.location.href = "mainpage.html";
  }
  // Do NOT redirect to index.html again if not logged in
  // Just stay on the login page
});