// Use the same Firebase config as your main app
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

function register() {
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const token = document.getElementById("register-token").value.trim();
  const deviceId = getDeviceId();

  if (!email || !password || !token) {
    showToast("Please fill all the fields");
    return;
  }

  showProgress(true);

  const usersRef = db.ref('users');
  const tokensRef = db.ref('tokens');

  // Check if email exists in users
  usersRef.orderByChild('email').equalTo(email).once('value')
    .then(snapshot => {
      if (snapshot.exists()) {
        showProgress(false);
        showToast("User already exists");
      } else {
        // Check if token exists and is valid
        tokensRef.child(token).once('value')
          .then(tokenSnap => {
            if (tokenSnap.exists()) {
              const tokenData = tokenSnap.val();
              const duration = parseInt(tokenData.duration);
              const used = tokenData.used === true;
              if (!duration || isNaN(duration)) {
                showProgress(false);
                showToast("Invalid token duration");
                return;
              }
              if (used) {
                showProgress(false);
                showToast("Token already used");
                return;
              }
              // Mark token as used
              tokensRef.child(token).child("used").set(true);

              // Create user in Firebase Auth
              firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                  // Calculate expiration date (duration in days)
                  const expirationDate = Date.now() + duration * 24 * 60 * 60 * 1000;
                  const id = usersRef.push().key;
                  const type = "student";

                  // Save user in Realtime Database
                  usersRef.child(id).set({
                    id: id,
                    email: email,
                    password: password,
                    deviceId: deviceId,
                    token: token,
                    type: type,
                    expirationDate: expirationDate
                  }, (error) => {
                    if (error) {
                      showProgress(false);
                      showToast("Registration failed: " + error.message);
                    } else {
                      // Mark token as used ONLY after successful registration
                      tokensRef.child(token).child("used").set(true);
                      showProgress(false);
                      showToast("Register Successful");
                      setTimeout(() => { window.location.href = "index.html"; }, 1200);
                    }
                  });
                })
                .catch(error => {
                  showProgress(false);
                  showToast("Registration failed: " + error.message);
                });
            } else {
              showProgress(false);
              showToast("Invalid token");
            }
          });
      }
    })
    .catch(err => {
      showProgress(false);
      showToast("Database error: " + err.message);
    });
}

function goToLogin() {
  window.location.href = "index.html";
}

document.getElementById('register-email').addEventListener('input', function() {
  const email = this.value.trim();
  const errorSpan = document.getElementById('register-email-error');
  const registerBtn = document.getElementById('register-btn');
  // PHP's FILTER_VALIDATE_EMAIL equivalent regex
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    errorSpan.textContent = "Please enter a valid email address.";
    errorSpan.style.display = "block";
    registerBtn.disabled = true;
  } else {
    errorSpan.textContent = "";
    errorSpan.style.display = "none";
    registerBtn.disabled = false;
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