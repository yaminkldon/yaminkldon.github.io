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
  getDeviceId();

  if (!email || !password || !token) {
    NotificationManager.showToast("Please fill all the fields");
    return;
  }

  showProgress(true);

  // The MySQL API reads this token in /api/auth/register.
  localStorage.setItem('pendingRegisterToken', token);

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      localStorage.removeItem('pendingRegisterToken');
      showProgress(false);
      NotificationManager.showToast("Register Successful");
      setTimeout(() => { Navigation.goToLogin(); }, 1200);
    })
    .catch(error => {
      localStorage.removeItem('pendingRegisterToken');
      showProgress(false);
      NotificationManager.showToast("Registration failed: " + error.message);
    });
}

function goToLogin() {
  Navigation.goToLogin();
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