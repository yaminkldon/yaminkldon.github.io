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

// Declare global variables that will be set after Firebase initialization
let db;

// iOS Compatibility System for Register Page
const iOSCompatibilityRegister = {
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
  
  init: function() {
    console.log('🍎 iOS Compatibility System initializing for Register...');
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
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        input.addEventListener('touchstart', function() {
          this.style.borderColor = '#6c4fc1';
        }, { passive: true });
        
        input.addEventListener('blur', function() {
          this.style.borderColor = '#ddd';
        });
      });
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
  iOSCompatibilityRegister.init();
});

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
    NotificationManager.showToast("Please fill all the fields");
    return;
  }

  showProgress(true);

  const usersRef = window.db.ref('users');
  const tokensRef = window.db.ref('tokens');

  // Check if email exists in users
  usersRef.orderByChild('email').equalTo(email).once('value')
    .then(snapshot => {
      if (snapshot.exists()) {
        showProgress(false);
        NotificationManager.showToast("User already exists");
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
                NotificationManager.showToast("Invalid token duration");
                return;
              }
              if (used) {
                showProgress(false);
                NotificationManager.showToast("Token already used");
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
                      NotificationManager.showToast("Registration failed: " + error.message);
                    } else {
                      // Mark token as used ONLY after successful registration
                      tokensRef.child(token).child("used").set(true);
                      showProgress(false);
                      NotificationManager.showToast("Register Successful");
                      setTimeout(() => { Navigation.goToLogin(); }, 1200);
                    }
                  });
                })
                .catch(error => {
                  showProgress(false);
                  NotificationManager.showToast("Registration failed: " + error.message);
                });
            } else {
              showProgress(false);
              NotificationManager.showToast("Invalid token");
            }
          });
      }
    })
    .catch(err => {
      showProgress(false);
      NotificationManager.showToast("Database error: " + err.message);
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

// Initialize iOS compatibility system BEFORE Firebase initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing iOS compatibility for Register first...');
  iOSCompatibilityRegister.init();
  
  // Initialize Firebase after iOS compatibility is set up
  setTimeout(() => {
    console.log('🔥 Initializing Firebase after iOS compatibility setup...');
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.database();
  }, 100);
});