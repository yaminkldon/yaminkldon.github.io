// Firebase Config (same as in script.js)
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

function resetPassword() {
  const email = document.getElementById("reset-email").value.trim();

  if (!email) {
    NotificationManager.showToast("Please enter your email address");
    return;
  }

  showProgress(true);

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      showProgress(false);
      NotificationManager.showToast("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        Navigation.goToLogin();
      }, 3000);
    })
    .catch((error) => {
      showProgress(false);
      let errorMessage = "Failed to send reset email";
      
      switch(error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many attempts. Please try again later";
          break;
        default:
          errorMessage = error.message;
      }
      
      NotificationManager.showToast(errorMessage);
    });
}

function goToLogin() {
  Navigation.goToLogin();
}

// Email validation
document.getElementById('reset-email').addEventListener('input', function() {
  const email = this.value.trim();
  const errorSpan = document.getElementById('reset-email-error');
  const resetBtn = document.getElementById('reset-btn');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(email) && email.length > 0) {
    errorSpan.textContent = "Please enter a valid email address.";
    errorSpan.style.display = "block";
    resetBtn.disabled = true;
  } else if (email.length > 0) {
    errorSpan.textContent = "";
    errorSpan.style.display = "none";
    resetBtn.disabled = false;
  } else {
    resetBtn.disabled = true;
  }
});
