// Firebase Configuration with updated initialization order
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

// Global variables - will be initialized after iOS compatibility setup
let db;

// iOS Compatibility System for Settings Page
const iOSCompatibilitySettings = {
  isInitialized: false,
  isIOS: false,
  isIPad: false,
  isIPhone: false,
  deviceInfo: {
    userAgent: '',
    isIOS: false,
    isSafari: false,
    isStandalone: false,
    screenDimensions: ''
  },
  
  init: function() {
    console.log('🍎 Initializing iOS compatibility for Settings...');
    
    // Detect iOS devices
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    this.deviceInfo.userAgent = userAgent;
    this.deviceInfo.isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    this.deviceInfo.isIPad = /iPad/.test(userAgent) && !window.MSStream;
    this.deviceInfo.isIPhone = /iPhone/.test(userAgent) && !window.MSStream;
    this.deviceInfo.isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    this.deviceInfo.isStandalone = window.navigator.standalone === true;
    this.deviceInfo.screenDimensions = `${window.screen.width}x${window.screen.height}`;
    
    // Legacy support
    this.isIOS = this.deviceInfo.isIOS;
    this.isIPad = this.deviceInfo.isIPad;
    this.isIPhone = this.deviceInfo.isIPhone;
    
    console.log('iOS Detection:', this.deviceInfo);
    console.log('iOS Detection:', {
      isIOS: this.isIOS,
      isIPad: this.isIPad,
      isIPhone: this.isIPhone,
      userAgent: userAgent
    });
    
    if (this.isIOS) {
      console.log('🎯 iOS device detected, applying compatibility fixes...');
      this.applyIOSFixes();
    }
    
    // Apply universal mobile enhancements
    this.applyMobileEnhancements();
    
    console.log('✅ iOS compatibility initialization complete for Settings');
  },
  
  applyIOSFixes: function() {
    this.fixViewport();
    this.addIOSStyles();
    this.fixTouchEvents();
    this.fixFirebaseForIOS();
    this.fixToggleButtons();
    this.setupErrorHandling();
  },
  
  fixViewport: function() {
    console.log('🔧 Fixing viewport for iOS...');
    
    // Enhanced viewport meta tag for iOS
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }
    
    // iOS-specific CSS for safe areas
    const style = document.createElement('style');
    style.textContent = `
      @supports(padding: max(0px)) {
        body {
          padding-top: max(56px, env(safe-area-inset-top));
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        .appbar {
          padding-top: env(safe-area-inset-top);
          height: calc(56px + env(safe-area-inset-top));
        }
      }
    `;
    document.head.appendChild(style);
  },
  
  addIOSStyles: function() {
    console.log('🎨 Adding iOS-specific styles...');
    
    const style = document.createElement('style');
    style.textContent = `
      /* iOS-specific enhancements */
      * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
      }
      
      input, textarea, select {
        -webkit-user-select: text;
        -webkit-appearance: none;
        border-radius: 8px;
      }
      
      .settings-card {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
      
      /* iOS loading animations */
      @-webkit-keyframes spin {
        0% { -webkit-transform: rotate(0deg); }
        100% { -webkit-transform: rotate(360deg); }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .ios-loading {
        -webkit-animation: spin 1s linear infinite;
        animation: spin 1s linear infinite;
      }
      
      /* iOS scroll momentum */
      .container {
        -webkit-overflow-scrolling: touch;
      }
      
      /* iOS button fixes */
      button, .btn {
        -webkit-appearance: none;
        border-radius: 8px;
      }
      
      /* iOS toggle switches */
      .toggle-switch {
        -webkit-appearance: none;
        appearance: none;
        width: 50px;
        height: 28px;
        background: #ccc;
        border-radius: 14px;
        position: relative;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      .toggle-switch:checked {
        background: #6c4fc1;
      }
      
      .toggle-switch::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s;
      }
      
      .toggle-switch:checked::before {
        transform: translateX(22px);
      }
    `;
    document.head.appendChild(style);
  },
  
  fixTouchEvents: function() {
    console.log('👆 Fixing touch events for iOS...');
    
    // Enhanced touch handling for settings items
    document.addEventListener('DOMContentLoaded', () => {
      const addTouchSupport = () => {
        const items = document.querySelectorAll('.settings-item, .settings-card, button');
        items.forEach(item => {
          item.addEventListener('touchstart', function(e) {
            if (!this.classList.contains('toggle-switch')) {
              this.style.opacity = '0.7';
            }
          }, { passive: true });
          
          item.addEventListener('touchend', function(e) {
            if (!this.classList.contains('toggle-switch')) {
              this.style.opacity = '1';
            }
          }, { passive: true });
        });
      };
      
      // Apply touch support initially
      addTouchSupport();
      
      // Observer for dynamically added content
      const observer = new MutationObserver(addTouchSupport);
      const targetNode = document.querySelector('.container');
      if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
      }
    });
  },
  
  fixFirebaseForIOS: function() {
    console.log('🔥 Optimizing Firebase for iOS...');
    
    // Enhanced Firebase configuration for iOS
    if (firebase.auth && firebase.auth()) {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          console.log('✅ Firebase persistence set for iOS');
        })
        .catch(error => {
          console.error('Firebase persistence error:', error);
        });
    }
    
    // Test Firebase connection
    this.testFirebaseConnection();
  },
  
  testFirebaseConnection: function() {
    console.log('🧪 Testing Firebase connection...');
    
    // Check if we have the global db variable
    if (typeof window.db === 'undefined' || !window.db) {
      console.log('Global db not yet available, retrying in 1 second...');
      setTimeout(() => this.testFirebaseConnection(), 1000);
      return;
    }
    
    const testRef = window.db.ref('.info/connected');
    testRef.on('value', (snapshot) => {
      if (snapshot.val() === true) {
        console.log('✅ Firebase connected successfully');
      } else {
        console.log('❌ Firebase connection lost');
        this.showIOSError('Connection lost. Please check your internet connection.');
      }
    });
  },
  
  fixToggleButtons: function() {
    console.log('🔘 Fixing toggle buttons for iOS...');
    
    // Enhanced toggle button functionality
    document.addEventListener('DOMContentLoaded', () => {
      const toggles = document.querySelectorAll('.toggle-switch');
      toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
          // Add haptic feedback for iOS
          if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
          }
          
          // Visual feedback
          this.style.transform = 'scale(0.95)';
          setTimeout(() => {
            this.style.transform = 'scale(1)';
          }, 100);
        });
      });
    });
  },
  
  setupErrorHandling: function() {
    console.log('⚠️ Setting up iOS error handling...');
    
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('🚫 Global error caught:', event.error);
      this.showIOSError('An unexpected error occurred. Please refresh the page.');
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚫 Unhandled promise rejection:', event.reason);
      this.showIOSError('A network error occurred. Please check your connection.');
    });
  },
  
  showIOSError: function(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 90%;
      text-align: center;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  },
  
  applyMobileEnhancements: function() {
    console.log('📱 Applying mobile enhancements...');
    
    // Add loading indicators
    const style = document.createElement('style');
    style.textContent = `
      .mobile-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        font-size: 14px;
        color: #666;
      }
      
      .mobile-loading::before {
        content: '';
        width: 20px;
        height: 20px;
        border: 2px solid #ddd;
        border-top: 2px solid #6c4fc1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 10px;
      }
      
      /* Enhanced mobile responsiveness */
      @media (max-width: 768px) {
        .settings-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .settings-card {
          padding: 16px;
        }
        
        .settings-item {
          padding: 12px;
        }
      }
      
      @media (max-width: 480px) {
        .container {
          padding: 16px;
        }
        
        .settings-card {
          padding: 12px;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Enhanced touch feedback
    document.addEventListener('touchstart', function(e) {
      const target = e.target;
      if (target.classList.contains('settings-item') || 
          target.classList.contains('settings-card') || 
          target.tagName === 'BUTTON') {
        target.style.opacity = '0.7';
      }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
      const target = e.target;
      if (target.classList.contains('settings-item') || 
          target.classList.contains('settings-card') || 
          target.tagName === 'BUTTON') {
        target.style.opacity = '1';
      }
    }, { passive: true });
  },

  shareError: function(errorDetails) {
    if (this.deviceInfo.isIOS && navigator.share) {
      const errorText = `Settings Error Report:\n\n${errorDetails}\n\nDevice: ${this.deviceInfo.userAgent}\nScreen: ${this.deviceInfo.screenDimensions}\nStandalone: ${this.deviceInfo.isStandalone}`;
      
      navigator.share({
        title: 'Settings Error Report',
        text: errorText
      }).catch(err => {
        console.log('📤 Share failed, using WhatsApp fallback:', err);
        this.shareViaWhatsApp(errorText);
      });
    } else {
      this.shareViaWhatsApp(errorDetails);
    }
  },

  shareViaWhatsApp: function(errorText) {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(errorText)}`;
    window.open(whatsappUrl, '_blank');
  }
};

// Initialize iOS compatibility system BEFORE Firebase initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing iOS compatibility for Settings first...');
  iOSCompatibilitySettings.init();
  
  // Initialize Firebase after iOS compatibility is set up
  setTimeout(() => {
    console.log('🔥 Initializing Firebase after iOS compatibility setup...');
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.database();
    
    // Set global variables
    db = window.db;
  }, 100);
});

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
  window.db.ref('users').orderByChild('email').equalTo(currentUser.email).once('value')
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
  window.db.ref('users').orderByChild('email').equalTo(currentUser.email).once('value')
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
