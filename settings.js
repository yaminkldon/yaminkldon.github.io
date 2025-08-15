// Firebase Config (same as in script.js)
const firebaseConfig = {
  apiKey: "AIzaSyCVoy2aBaQO1RDpoGGPIBqriFnGdKeNqHk",
  authDomain: "raednusairat-68b52.firebaseapp.com",
  databaseURL: "https://raednusairat-68b52-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "raednusairat-68b52",
  storageBucket: "raednusairat-68b52.appStorage.com",
  messagingSenderId: "852022576722",
  appId: "1:852022576722:web:8546d7cd4d3f6b0f8fc18b",
  measurementId: "G-HDLMYVXH5T"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = null;
let userDeviceId = null;

// Initialize settings page
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    userDeviceId = getDeviceId();
    loadUserInfo();
    loadSettings();
  } else {
    Navigation.goToLogin();
  }
});

// Initialize advanced features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (typeof AdvancedFeatures !== 'undefined') {
    window.advancedFeatures = new AdvancedFeatures();
    window.advancedFeatures.applyFeatures();
  }
});

// Register Pull-to-Refresh callback (refresh user info and settings)
(function registerPTR(){
  const setup = () => {
    if (window.pullToRefresh) {
      window.pullToRefresh.setCallback(() => {
        try {
          if (currentUser) {
            loadUserInfo();
            loadSettings();
            if (window.advancedFeatures) {
              window.advancedFeatures.applyFeatures();
            }
          }
        } catch (e) {
          setTimeout(()=>window.location.reload(), 150);
        }
      });
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();

function getDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'web-' + Math.random().toString(36).substr(2, 16);
    localStorage.setItem('device_id', id);
  }
  return id;
}

function loadUserInfo() {
  document.getElementById('user-email').textContent = currentUser.email;
  document.getElementById('device-id').textContent = userDeviceId;

  // Load user data from database
  db.ref('users').orderByChild('email').equalTo(currentUser.email).once('value')
    .then(snapshot => {
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const userData = child.val();
          if (userData.expirationDate) {
            const expDate = new Date(userData.expirationDate);
            document.getElementById('expiration-date').textContent = expDate.toLocaleDateString();
          } else {
            document.getElementById('expiration-date').textContent = 'Never';
          }
        });
      }
    })
    .catch(error => {
      console.error('Error loading user data:', error);
      document.getElementById('expiration-date').textContent = 'Unknown';
    });
}

function loadSettings() {
  // Load dark mode preference using global theme manager
  const darkMode = window.themeManager.isDarkMode();
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkMode) {
    darkModeToggle.classList.add('active');
  }

  // Load notifications preference
  const notifications = localStorage.getItem('notifications') !== 'false'; // default true
  const notificationsToggle = document.getElementById('notifications-toggle');
  if (notifications) {
    notificationsToggle.classList.add('active');
  }
}

function toggleDarkMode() {
  const toggle = document.getElementById('dark-mode-toggle');
  const newState = window.themeManager.toggleDarkMode();
  
  if (newState) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

function toggleNotifications() {
  const toggle = document.getElementById('notifications-toggle');
  const isActive = toggle.classList.contains('active');
  
  if (isActive) {
    toggle.classList.remove('active');
    localStorage.setItem('notifications', 'false');
    NotificationManager.showToast('Notifications disabled');
  } else {
    toggle.classList.add('active');
    localStorage.setItem('notifications', 'true');
    NotificationManager.showToast('Notifications enabled');
  }
}

function openChangePasswordModal() {
  document.getElementById('change-password-modal').style.display = 'flex';
}

function closeChangePasswordModal() {
  document.getElementById('change-password-modal').style.display = 'none';
  // Clear form
  document.getElementById('current-password').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
}

function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    NotificationManager.showToast('Please fill in all fields');
    return;
  }

  if (newPassword !== confirmPassword) {
    NotificationManager.showToast('New passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    NotificationManager.showToast('Password must be at least 6 characters');
    return;
  }

  showProgress(true);

  // Re-authenticate user before changing password
  const credential = firebase.auth.EmailAuthProvider.credential(
    currentUser.email,
    currentPassword
  );

  currentUser.reauthenticateWithCredential(credential)
    .then(() => {
      return currentUser.updatePassword(newPassword);
    })
    .then(() => {
      showProgress(false);
      NotificationManager.showToast('Password updated successfully');
      closeChangePasswordModal();
    })
    .catch((error) => {
      showProgress(false);
      let errorMessage = 'Failed to update password';
      
      switch(error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak';
          break;
        default:
          errorMessage = error.message;
      }
      
      NotificationManager.showToast(errorMessage);
    });
}

function confirmDeleteAccount() {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    deleteAccount();
  }
}

function deleteAccount() {
  showProgress(true);

  // Delete user data from database first
  db.ref('users').orderByChild('email').equalTo(currentUser.email).once('value')
    .then(snapshot => {
      const promises = [];
      snapshot.forEach(child => {
        promises.push(child.ref.remove());
      });
      return Promise.all(promises);
    })
    .then(() => {
      // Delete Firebase Auth user
      return currentUser.delete();
    })
    .then(() => {
      showProgress(false);
      NotificationManager.showToast('Account deleted successfully');
      localStorage.clear();
      setTimeout(() => {
        Navigation.goToLogin();
      }, 2000);
    })
    .catch((error) => {
      showProgress(false);
      let errorMessage = 'Failed to delete account';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log back in before deleting your account';
      }
      
      NotificationManager.showToast(errorMessage);
    });
}

function logout() {
  AuthManager.logout();
}

function goBack() {
  Navigation.goToMainPage();
}

function showProgress(show) {
  const bar = document.getElementById('progress-bar');
  if (show) {
    bar.style.display = 'block';
    bar.style.width = '50%';
  } else {
    bar.style.display = 'none';
    bar.style.width = '0%';
  }
}
