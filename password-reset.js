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

// iOS Compatibility System for Password Reset Page
const iOSCompatibilityPasswordReset = {
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
  
  init: function() {
    console.log('🍎 iOS Compatibility System initializing for Password Reset...');
    console.log('Device detection:', {
      isIOS: this.isIOS,
      isSafari: this.isSafari,
      userAgent: navigator.userAgent,
      screenSize: `${screen.width}x${screen.height}`,
      devicePixelRatio: window.devicePixelRatio,
      networkStatus: navigator.onLine ? 'online' : 'offline'
    });
    
    if (this.isIOS) {
      console.log('✅ iOS device detected, applying iOS fixes...');
      this.applyIOSFixes();
    }
    
    this.setupErrorHandling();
    
    // Wait for Firebase to be initialized before testing connection
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      console.log('🔥 Firebase already initialized, testing connection...');
      this.scheduleFirebaseConnectionTest();
    } else {
      console.log('🔥 Waiting for Firebase initialization...');
      this.waitForFirebaseInitialization();
    }
  },
  
  waitForFirebaseInitialization: function() {
    const checkFirebase = () => {
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        console.log('🔥 Firebase now initialized, testing connection...');
        this.scheduleFirebaseConnectionTest();
      } else {
        console.log('🔥 Still waiting for Firebase...');
        setTimeout(checkFirebase, 200);
      }
    };
    checkFirebase();
  },
  
  scheduleFirebaseConnectionTest: function() {
    // Delay Firebase connection test for iOS to ensure proper initialization
    if (this.isIOS) {
      console.log('iOS: Scheduling Firebase connection test with delay...');
      setTimeout(() => {
        this.testFirebaseConnection();
      }, 2000);
    } else {
      console.log('Non-iOS: Testing Firebase connection immediately...');
      setTimeout(() => {
        this.testFirebaseConnection();
      }, 500);
    }
  },
  
  applyIOSFixes: function() {
    this.fixViewport();
    this.addIOSStyles();
    this.fixFormInputs();
    this.fixFirebaseForIOS();
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
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
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
        font-size: 16px !important;
      }
      
      .form-container {
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
      body {
        -webkit-overflow-scrolling: touch;
      }
      
      /* iOS button fixes */
      button, .btn {
        -webkit-appearance: none;
        border-radius: 8px;
        border: none;
        cursor: pointer;
      }
      
      /* iOS progress bar */
      .progress-bar {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
    `;
    document.head.appendChild(style);
  },
  
  fixFormInputs: function() {
    console.log('📝 Fixing form inputs for iOS...');
    
    // Fix iOS input zoom issues
    const style = document.createElement('style');
    style.textContent = `
      input[type="email"], input[type="password"], input[type="text"] {
        font-size: 16px !important;
        -webkit-appearance: none;
        border-radius: 8px;
      }
      
      input:focus {
        outline: none;
        border: 2px solid #6c4fc1;
      }
    `;
    document.head.appendChild(style);
    
    // Enhanced form validation for iOS
    document.addEventListener('DOMContentLoaded', () => {
      const emailInput = document.getElementById('reset-email');
      if (emailInput) {
        emailInput.addEventListener('touchstart', function() {
          this.style.borderColor = '#6c4fc1';
        }, { passive: true });
        
        emailInput.addEventListener('blur', function() {
          this.style.borderColor = '#ddd';
        });
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
    
    const testRef = firebase.database().ref('.info/connected');
    testRef.on('value', (snapshot) => {
      if (snapshot.val() === true) {
        console.log('✅ Firebase connected successfully');
      } else {
        console.log('❌ Firebase connection lost');
        this.showIOSError('Connection lost. Please check your internet connection.');
      }
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
        .form-container {
          padding: 16px;
        }
        
        input {
          padding: 12px;
          font-size: 16px;
        }
        
        button {
          padding: 12px 24px;
          font-size: 16px;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Enhanced touch feedback
    document.addEventListener('touchstart', function(e) {
      const target = e.target;
      if (target.tagName === 'BUTTON') {
        target.style.opacity = '0.7';
      }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
      const target = e.target;
      if (target.tagName === 'BUTTON') {
        target.style.opacity = '1';
      }
    }, { passive: true });
  }
};

// Initialize iOS compatibility when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  iOSCompatibilityPasswordReset.init();
});

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

// Initialize iOS compatibility system BEFORE Firebase initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing iOS compatibility for Password Reset first...');
  iOSCompatibilityPasswordReset.init();
  
  // Initialize Firebase after iOS compatibility is set up
  setTimeout(() => {
    console.log('🔥 Initializing Firebase after iOS compatibility setup...');
    firebase.initializeApp(firebaseConfig);
  }, 100);
});
