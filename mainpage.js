// Firebase Configuration with updated initialization order
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

// Initialize Firebase immediately - BEFORE other code runs
console.log('🔥 Initializing Firebase immediately...');
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.database();
    window.storage = firebase.storage();
    
    // Set up messaging if available
    if (typeof firebase.messaging !== 'undefined') {
      window.messaging = firebase.messaging();
    }
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
} else {
  console.log('🔥 Firebase not yet loaded, will retry...');
}

// iOS Compatibility and Debugging System
const iOSCompatibility = {
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
  
  init: function() {
    console.log('🍎 iOS Compatibility System initializing...');
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
    console.log('Applying iOS-specific fixes...');
    
    // Fix viewport for iOS
    this.fixViewport();
    
    // Fix CSS for iOS
    this.addIOSStyles();
    
    // Fix touch events for iOS
    this.fixTouchEvents();
    
    // Fix Firebase for iOS
    this.fixFirebaseForIOS();
    
    // Fix video playback for iOS
    this.fixVideoPlayback();
    
    // Fix modal and fullscreen for iOS
    this.fixModalsForIOS();
    
    console.log('iOS fixes applied successfully');
  },
  
  fixViewport: function() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
    
    // Add iOS-specific viewport meta tags
    const statusBarMeta = document.createElement('meta');
    statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
    statusBarMeta.content = 'default';
    document.head.appendChild(statusBarMeta);
    
    const webAppMeta = document.createElement('meta');
    webAppMeta.name = 'apple-mobile-web-app-capable';
    webAppMeta.content = 'yes';
    document.head.appendChild(webAppMeta);
  },
  
  addIOSStyles: function() {
    const iosStyles = document.createElement('style');
    iosStyles.id = 'ios-compatibility-styles';
    iosStyles.textContent = `
      /* iOS Safari fixes */
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
      
      body {
        -webkit-overflow-scrolling: touch;
        -webkit-transform: translate3d(0, 0, 0);
        -webkit-backface-visibility: hidden;
        -webkit-perspective: 1000;
        overflow-x: hidden;
      }
      
      .main-content {
        -webkit-overflow-scrolling: touch;
        -webkit-transform: translate3d(0, 0, 0);
        transform: translate3d(0, 0, 0);
      }
      
      /* Fix iOS keyboard issues */
      input, textarea, select {
        -webkit-user-select: text;
        user-select: text;
        -webkit-appearance: none;
        border-radius: 0;
        font-size: 16px; /* Prevents zoom on iOS */
      }
      
      /* Fix iOS button styles */
      button {
        -webkit-appearance: none;
        border-radius: 0;
        cursor: pointer;
      }
      
      /* Fix iOS modal and fullscreen */
      .modal {
        -webkit-overflow-scrolling: touch;
        -webkit-transform: translate3d(0, 0, 0);
      }
      
      /* Fix iOS video playback */
      video {
        -webkit-playsinline: true;
        playsinline: true;
        -webkit-transform: translate3d(0, 0, 0);
      }
      
      /* Fix iOS iframe issues */
      iframe {
        -webkit-transform: translate3d(0, 0, 0);
        transform: translate3d(0, 0, 0);
        -webkit-backface-visibility: hidden;
      }
      
      /* Fix iOS touch zoom */
      .touch-zoom-container {
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Fix iOS safe area */
      @supports(padding: max(0px)) {
        .appbar {
          padding-top: max(12px, env(safe-area-inset-top));
        }
        
        .main-content {
          padding-bottom: max(20px, env(safe-area-inset-bottom));
        }
      }
      
      /* Fix iOS drawer */
      .drawer {
        -webkit-overflow-scrolling: touch;
        -webkit-transform: translate3d(0, 0, 0);
      }
      
      /* Fix iOS lesson grid */
      .lesson-grid {
        -webkit-overflow-scrolling: touch;
        -webkit-transform: translate3d(0, 0, 0);
      }
      
      /* Prevent iOS bounce effect where needed */
      .no-bounce {
        -webkit-overflow-scrolling: auto;
        overscroll-behavior: none;
      }
      
      /* iOS loading animation */
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @-webkit-keyframes spin {
        0% { -webkit-transform: rotate(0deg); }
        100% { -webkit-transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(iosStyles);
  },
  
  fixTouchEvents: function() {
    // Fix touch events for iOS
    document.addEventListener('touchstart', function(e) {
      // Prevent default only for multi-touch
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Fix iOS touch delay
    document.addEventListener('touchend', function(e) {
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.onclick) {
        target.click();
      }
    }, { passive: true });
  },
  
  fixFirebaseForIOS: function() {
    // Set Firebase Auth persistence for iOS
    if (typeof firebase !== 'undefined' && firebase.auth && window.db) {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          console.log('Firebase Auth persistence set for iOS');
        })
        .catch((error) => {
          console.error('Failed to set Firebase Auth persistence:', error);
          this.showIOSError('Authentication setup failed. Please try refreshing the page.', {
            error: error.message,
            type: 'auth_persistence_error',
            code: error.code,
            stack: error.stack,
            location: 'fixFirebaseForIOS'
          });
        });
    }
  },
  
  fixVideoPlayback: function() {
    // Override video playback for iOS
    const originalPlayVideo = window.playLessonVideo;
    window.playLessonVideo = function(videoURL) {
      if (iOSCompatibility.isIOS) {
        console.log('iOS video playback initiated');
        
        // Add iOS-specific video attributes
        const originalFunction = originalPlayVideo;
        originalFunction.call(this, videoURL);
        
        // Additional iOS video fixes
        setTimeout(() => {
          const video = document.getElementById('fullscreen-video');
          if (video) {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.style.webkitTransform = 'translate3d(0, 0, 0)';
            
            // Force play on iOS
            video.play().catch(e => {
              console.log('iOS video autoplay blocked:', e);
            });
          }
        }, 500);
      } else {
        originalPlayVideo.call(this, videoURL);
      }
    };
  },
  
  fixModalsForIOS: function() {
    // Fix modal display for iOS
    const style = document.createElement('style');
    style.textContent = `
      @media screen and (max-width: 768px) {
        .modal {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          padding: 0 !important;
          -webkit-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
        }
      }
    `;
    document.head.appendChild(style);
  },
  
  setupErrorHandling: function() {
    // Enhanced error handling for iOS with detailed error information
    window.addEventListener('error', (e) => {
      console.error('iOS Global Error:', e);
      if (this.isIOS) {
        this.showIOSError('App Error: ' + e.message, {
          error: e.message,
          type: 'javascript_error',
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          stack: e.error ? e.error.stack : null,
          location: 'window.error'
        });
      }
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      console.error('iOS Promise Rejection:', e);
      if (this.isIOS) {
        const reason = e.reason;
        this.showIOSError('Connection Error: ' + (reason.message || reason), {
          error: reason.message || String(reason),
          type: 'promise_rejection',
          stack: reason.stack,
          name: reason.name,
          location: 'unhandledrejection'
        });
      }
    });
    
    // Network error handling
    window.addEventListener('offline', () => {
      if (this.isIOS) {
        this.showIOSError('Network connection lost. Please check your internet connection.', {
          error: 'Network offline',
          type: 'network_offline',
          location: 'offline_event'
        });
      }
    });
    
    // Firebase Auth error handling
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged((user) => {
        if (!user && this.isIOS) {
          // Only show auth error if we're not already on login page
          if (!window.location.href.includes('index.html')) {
            this.showIOSError('Authentication session expired. Redirecting to login.', {
              error: 'Auth session expired',
              type: 'auth_expired',
              location: 'onAuthStateChanged'
            });
          }
        }
      });
    }
  },
  
  testFirebaseConnection: function() {
    console.log('🔥 Testing Firebase connection...');
    
    // Wait for Firebase to be fully loaded
    if (typeof firebase === 'undefined') {
      console.log('Firebase not yet loaded, retrying in 1 second...');
      setTimeout(() => this.testFirebaseConnection(), 1000);
      return;
    }
    
    // Check if database is available
    if (!firebase.database) {
      console.log('Firebase database not yet available, retrying in 1 second...');
      setTimeout(() => this.testFirebaseConnection(), 1000);
      return;
    }

    // Check if we have the global db variable
    if (typeof window.db === 'undefined' || !window.db) {
      console.log('Global db not yet available, retrying in 1 second...');
      setTimeout(() => this.testFirebaseConnection(), 1000);
      return;
    }
    
    try {
      console.log('Attempting to connect to Firebase...');
      const testRef = window.db.ref('.info/connected');
      
      // Set up connection monitoring with timeout
      const connectionTimeout = setTimeout(() => {
        console.log('🚨 Connection test timed out');
        if (this.isIOS) {
          this.showIOSError('Connection test timed out. Please check your internet connection and try refreshing the page.', {
            error: 'Connection timeout',
            type: 'connection_timeout',
            location: 'testFirebaseConnection_timeout',
            timestamp: new Date().toISOString()
          });
        }
      }, 10000); // 10 second timeout
      
      testRef.on('value', (snapshot) => {
        clearTimeout(connectionTimeout);
        const connected = snapshot.val();
        console.log('🔥 Firebase connection status:', connected);
        
        if (connected) {
          console.log('✅ Firebase connection successful');
          // Remove any existing connection error messages
          const existingError = document.querySelector('[data-error-type="connection_failed"]');
          if (existingError) {
            existingError.remove();
          }
        } else {
          console.log('❌ Firebase connection failed');
          if (this.isIOS) {
            // More specific error message for iOS
            this.showIOSError('Unable to establish connection to server. This might be due to:\n\n• Network connectivity issues\n• iOS Safari restrictions\n• Firewall or content blocker\n\nPlease try:\n• Switching to cellular data or different WiFi\n• Refreshing the page\n• Disabling content blockers', {
              error: 'Firebase connection failed',
              type: 'connection_failed',
              connected: connected,
              location: 'testFirebaseConnection',
              timestamp: new Date().toISOString(),
              networkInfo: {
                onLine: navigator.onLine,
                connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
                downlink: navigator.connection ? navigator.connection.downlink : 'unknown'
              }
            });
          }
        }
      });
      
      // Test basic database read to ensure permissions are working
      testRef.once('value').then((snapshot) => {
        console.log('Database read test successful');
      }).catch((error) => {
        console.error('Database read test failed:', error);
        if (this.isIOS) {
          this.showIOSError('Database access failed. Please check your permissions and try again.', {
            error: error.message,
            type: 'database_access_failed',
            code: error.code,
            location: 'testFirebaseConnection_read_test',
            timestamp: new Date().toISOString()
          });
        }
      });
      
    } catch (error) {
      console.error('Firebase connection test error:', error);
      if (this.isIOS) {
        this.showIOSError('Failed to initialize server connection: ' + error.message, {
          error: error.message,
          type: 'firebase_init_error',
          stack: error.stack,
          name: error.name,
          location: 'testFirebaseConnection_catch',
          timestamp: new Date().toISOString()
        });
      }
    }
  },
  
  showIOSError: function(message, errorDetails = null) {
    const timestamp = new Date().toISOString();
    const deviceInfo = this.getDeviceInfo();
    
    // Create detailed error object
    const errorData = {
      timestamp: timestamp,
      message: message,
      errorDetails: errorDetails,
      deviceInfo: deviceInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
      onlineStatus: navigator.onLine
    };
    
    // Log to console for debugging
    console.error('🚨 iOS Error Details:', errorData);
    
    // Create shareable error text
    const shareableError = this.createShareableError(errorData);
    
    // Remove existing error with same type
    const existingError = document.querySelector(`[data-error-type="${errorDetails?.type}"]`);
    if (existingError) {
      existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('data-error-type', errorDetails?.type || 'unknown');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 16px;
      border-radius: 12px;
      z-index: 99999;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      max-height: 80vh;
      overflow-y: auto;
      animation: slideInDown 0.3s ease-out;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInDown {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 8px;">🚨</span>
        <strong>iOS Connection Error</strong>
      </div>
      
      <div style="margin-bottom: 12px;">
        ${message}
      </div>
      
      ${errorDetails ? `
        <details style="margin-bottom: 12px;">
          <summary style="cursor: pointer; font-weight: bold; margin-bottom: 8px;">Technical Details</summary>
          <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; font-size: 12px; font-family: monospace; white-space: pre-wrap;">
${this.formatErrorDetails(errorDetails)}
          </div>
        </details>
      ` : ''}
      
      <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; font-size: 12px;">
        <strong>Device Info:</strong><br>
        ${deviceInfo.device} • ${deviceInfo.browser}<br>
        Screen: ${deviceInfo.screenSize} • Network: ${navigator.onLine ? 'Online' : 'Offline'}<br>
        Time: ${new Date().toLocaleString()}
      </div>
      
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <button onclick="location.reload()" 
                style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: bold;">
          🔄 Retry
        </button>
        <button onclick="iOSCompatibility.shareError('${encodeURIComponent(shareableError)}')" 
                style="flex: 1; padding: 10px; background: #25d366; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: bold;">
          📱 Share Error
        </button>
      </div>
      
      <div style="display: flex; gap: 8px;">
        <button onclick="iOSCompatibility.copyError('${encodeURIComponent(shareableError)}')" 
                style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
          📋 Copy
        </button>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="padding: 8px 12px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
          ✕ Dismiss
        </button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 45 seconds (longer for connection errors)
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.animation = 'slideInDown 0.3s ease-out reverse';
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
          }
        }, 300);
      }
    }, 45000);
  },
  
  getDeviceInfo: function() {
    return {
      device: this.getDeviceType(),
      browser: this.getBrowserInfo(),
      screenSize: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio || 1,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };
  },
  
  getDeviceType: function() {
    const ua = navigator.userAgent;
    if (/iPad/.test(ua)) return 'iPad';
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPod/.test(ua)) return 'iPod';
    return 'Unknown iOS Device';
  },
  
  getBrowserInfo: function() {
    const ua = navigator.userAgent;
    if (/CriOS/.test(ua)) return 'Chrome iOS';
    if (/FxiOS/.test(ua)) return 'Firefox iOS';
    if (/EdgiOS/.test(ua)) return 'Edge iOS';
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    return 'Unknown Browser';
  },
  
  formatErrorDetails: function(error) {
    if (typeof error === 'string') return error;
    if (error instanceof Error) {
      return `${error.name}: ${error.message}${error.stack ? '\n' + error.stack.substring(0, 200) + '...' : ''}`;
    }
    if (typeof error === 'object') {
      return JSON.stringify(error, null, 2).substring(0, 300) + '...';
    }
    return String(error);
  },
  
  createShareableError: function(errorData) {
    const text = `🚨 iOS App Error Report 🚨

📱 Device: ${errorData.deviceInfo.device}
🌐 Browser: ${errorData.deviceInfo.browser}
📏 Screen: ${errorData.deviceInfo.screenSize}
🔗 Connection: ${errorData.onlineStatus ? 'Online' : 'Offline'} (${errorData.connectionType})
🕒 Time: ${new Date(errorData.timestamp).toLocaleString()}

❌ Error Message:
${errorData.message}

${errorData.errorDetails ? `🔍 Technical Details:
${this.formatErrorDetails(errorData.errorDetails)}

` : ''}📄 Page: ${errorData.url}

🔧 User Agent:
${errorData.userAgent}

---
This error was automatically generated by the iOS compatibility system.`;
    
    return text;
  },
  
  shareError: function(encodedError) {
    const errorText = decodeURIComponent(encodedError);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(errorText)}`;
    
    // Try to open WhatsApp
    window.open(whatsappUrl, '_blank');
  },
  
  copyError: function(encodedError) {
    const errorText = decodeURIComponent(encodedError);
    
    // Try to copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(errorText).then(() => {
        this.showCopySuccess();
      }).catch(() => {
        this.fallbackCopy(errorText);
      });
    } else {
      this.fallbackCopy(errorText);
    }
  },
  
  fallbackCopy: function(text) {
    // Fallback copy method for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopySuccess();
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Copy failed. Please manually copy the error text.');
    }
    
    document.body.removeChild(textArea);
  },
  
  showCopySuccess: function() {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 99999;
      font-size: 14px;
      font-weight: bold;
    `;
    successDiv.textContent = '✅ Error copied to clipboard!';
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 2000);
  },
  
  // Fix units loading for iOS
  fixUnitsLoading: function() {
    const originalLoadUnits = window.loadUnits;
    window.loadUnits = function() {
      if (iOSCompatibility.isIOS) {
        console.log('iOS: Loading units with iOS-specific handling');
        
        // Add timeout for iOS network issues
        const loadingTimeout = setTimeout(() => {
          iOSCompatibility.showIOSError('Loading is taking longer than expected. Please check your connection.');
        }, 10000);
        
        // Override the original function
        const result = originalLoadUnits.call(this);
        
        // Clear timeout if loading completes
        if (result && result.then) {
          result.then(() => {
            clearTimeout(loadingTimeout);
          }).catch(() => {
            clearTimeout(loadingTimeout);
          });
        } else {
          clearTimeout(loadingTimeout);
        }
        
        return result;
      } else {
        return originalLoadUnits.call(this);
      }
    };
  }
};

// Initialize iOS compatibility system BEFORE Firebase initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing iOS compatibility...');
  iOSCompatibility.init();
  
  // If Firebase wasn't initialized in the initial attempt, try again
  if (!firebase.apps || firebase.apps.length === 0) {
    console.log('🔥 Firebase not initialized yet, initializing now...');
    try {
      firebase.initializeApp(firebaseConfig);
      window.db = firebase.database();
      window.storage = firebase.storage();
      
      // Set up messaging if available
      if (typeof firebase.messaging !== 'undefined') {
        window.messaging = firebase.messaging();
        setupFirebaseMessaging();
      }
    } catch (error) {
      console.error('❌ Firebase initialization error in DOMContentLoaded:', error);
    }
  } else {
    console.log('✅ Firebase already initialized, setting up messaging...');
    if (typeof firebase.messaging !== 'undefined' && !window.messaging) {
      window.messaging = firebase.messaging();
      setupFirebaseMessaging();
    }
  }
  
  // Set up authentication handler
  setupAuthHandler();
});

// Declare global variables that will be set after Firebase initialization
let db, storage, messaging;

// Firebase messaging setup function
function setupFirebaseMessaging() {
  if (!messaging) return;
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('firebase-messaging-sw.js')
      .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch(function(err) {
        console.log('Service Worker registration failed:', err);
      });
  }

  function requestNotificationPermission() {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        messaging.getToken({ vapidKey: 'BOrHxEJA2I5f7r9PkZ63GNG5mkRZIk3USWLz-ELZoSICdTKFfsjiOHdHuao5kAwwsp7FKBuiZPKRVaMFF7lb3gI' })
          .then((token) => {
            console.log('FCM Token:', token);
            // Save this token to your database for the user, so you can send them notifications
          })
          .catch((err) => {
            console.log('Unable to get FCM token.', err);
          });
      } else {
        console.log('Notification permission not granted.');
      }
    });
  }

  // Call this after user login or on page load
  requestNotificationPermission();

  // Listen for foreground messages
  messaging.onMessage((payload) => {
    // Show notification in-app
    alert(payload.notification.title + "\n" + payload.notification.body);
  });
}

let currentUnit = null;
let lessons = [];
let openedLessonKey = null; // Add this at the top with your other globals
let plyrPlayer = null;

// Cache management
const CacheManager = {
  // Cache duration in milliseconds (24 hours)
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  
  // Cache keys
  CACHE_KEYS: {
    UNITS: 'cached_units',
    LESSONS: 'cached_lessons',
    PROGRESS: 'cached_progress',
    ASSIGNMENTS: 'cached_assignments',
    QUIZZES: 'cached_quizzes',
    UNITS_HASH: 'cached_units_hash'
  },
  
  // Set cache with timestamp and data hash
  setCache: function(key, data) {
    const cacheData = {
      timestamp: Date.now(),
      data: data,
      hash: this.generateDataHash(data)
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  },
  
  // Generate a simple hash of the data structure
  generateDataHash: function(data) {
    if (!data) return '';
    
    // Create a hash based on the structure keys and basic properties
    const keys = Object.keys(data).sort();
    let hashString = keys.join('|');
    
    // Add lesson counts for each unit to detect structural changes
    keys.forEach(key => {
      if (typeof data[key] === 'object' && data[key] !== null) {
        const subKeys = Object.keys(data[key]).filter(subKey => {
          const item = data[key][subKey];
          return typeof item === 'object' && item !== null && (item.videoURL || item.videoFile);
        });
        hashString += `|${key}:${subKeys.length}`;
      }
    });
    
    return hashString;
  },
  
  // Get cache if not expired and structure hasn't changed
  getCache: function(key) {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;
    
    try {
      const parsedItem = JSON.parse(cachedItem);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - parsedItem.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsedItem.data;
    } catch (error) {
      console.error('Error parsing cache:', error);
      localStorage.removeItem(key);
      return null;
    }
  },
  
  // Check if cached data is still valid by comparing structure
  isCacheValid: function(key, currentData) {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return false;
    
    try {
      const parsedItem = JSON.parse(cachedItem);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - parsedItem.timestamp > this.CACHE_DURATION) {
        return false;
      }
      
      // Check if structure has changed
      const currentHash = this.generateDataHash(currentData);
      const cachedHash = parsedItem.hash;
      
      if (currentHash !== cachedHash) {
        console.log('Cache invalidated: structure changed');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating cache:', error);
      return false;
    }
  },
  
  // Clear specific cache
  clearCache: function(key) {
    localStorage.removeItem(key);
  },
  
  // Clear all cache
  clearAllCache: function() {
    Object.values(this.CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
  
  // Force refresh cache
  forceRefresh: function(key, fetchFunction) {
    this.clearCache(key);
    return fetchFunction();
  }
};

// Load units into drawer with smart caching
function loadUnits() {
  console.log('Loading units with smart cache validation');
  
  // iOS-specific loading indicator
  if (iOSCompatibility.isIOS) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'ios-loading-indicator';
    loadingIndicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 9999;
      text-align: center;
    `;
    loadingIndicator.innerHTML = `
      <div style="font-size: 14px; margin-bottom: 10px;">Loading units...</div>
      <div style="width: 20px; height: 20px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
    `;
    document.body.appendChild(loadingIndicator);
    
    // Remove loading indicator after timeout
    setTimeout(() => {
      const indicator = document.getElementById('ios-loading-indicator');
      if (indicator) indicator.remove();
    }, 10000);
  }
  
  // First, check if we have cached data
  const cachedUnits = CacheManager.getCache(CacheManager.CACHE_KEYS.UNITS);
  const cachedProgress = CacheManager.getCache(CacheManager.CACHE_KEYS.PROGRESS);
  
  if (cachedUnits && cachedProgress) {
    // We have cached data, but let's validate it against current database structure
    console.log('Found cached data, validating against database...');
    
    // Load just the keys from database to check for structural changes
    window.db.ref('units').once('value').then(snapshot => {
      const currentUnitsData = snapshot.val();
      
      // Remove iOS loading indicator
      const loadingIndicator = document.getElementById('ios-loading-indicator');
      if (loadingIndicator) loadingIndicator.remove();
      
      // Check if cache is still valid
      if (CacheManager.isCacheValid(CacheManager.CACHE_KEYS.UNITS, currentUnitsData)) {
        console.log('Cache is valid, using cached data');
        displayUnits(cachedUnits, cachedProgress);
      } else {
        console.log('Cache is invalid, loading fresh data');
        // Show notification about new content
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('📚 New content detected! Loading latest units...', 'success');
        }
        loadFreshUnitsData();
      }
    }).catch(error => {
      console.error('Error validating cache:', error);
      
      // Remove iOS loading indicator
      const loadingIndicator = document.getElementById('ios-loading-indicator');
      if (loadingIndicator) loadingIndicator.remove();
      
      // iOS-specific error handling
      if (iOSCompatibility.isIOS) {
        iOSCompatibility.showIOSError('Unable to load units. Please check your internet connection and try again.', {
          error: error.message,
          type: 'units_loading_error',
          code: error.code,
          stack: error.stack,
          location: 'loadUnits_cache_validation'
        });
      }
      
      // If validation fails, use cached data anyway
      displayUnits(cachedUnits, cachedProgress);
    });
  } else {
    console.log('No cached data found, loading fresh data');
    loadFreshUnitsData();
  }
}

// Load fresh units data from database
function loadFreshUnitsData() {
  // Load user progress first, then units
  ProgressTracker.getUserProgress()
    .then(userProgress => {
      // Cache progress
      CacheManager.setCache(CacheManager.CACHE_KEYS.PROGRESS, userProgress);
      
      return window.db.ref('units').once('value').then(snapshot => {
        const unitsData = snapshot.val();
        
        // Cache units data with new hash validation
        CacheManager.setCache(CacheManager.CACHE_KEYS.UNITS, unitsData);
        
        displayUnits(unitsData, userProgress);
      });
    })
    .catch(error => {
      console.error('Error loading units with progress:', error);
      // Fallback to loading units without progress
      loadUnitsWithoutProgress();
    });
}

// Display units in the drawer
function displayUnits(unitsData, userProgress) {
  const unitsList = document.getElementById('units-list');
  
  // Clear the units list
  unitsList.innerHTML = '';
  
  // Add Teacher Dashboard for teachers
  addTeacherDashboardIfApplicable();
  
  if (unitsData) {
    Object.keys(unitsData).forEach(unitName => {
      const unitData = unitsData[unitName];
      
      // Calculate progress for this unit
      const progress = calculateUnitProgress(unitName, unitData, userProgress);
      
      const li = document.createElement('li');
      li.onclick = () => goToUnit(unitName);
      li.innerHTML = `
        <div class="unit-item">
          <div class="unit-info">
            <div class="unit-name">${unitName}</div>
            <div class="unit-progress">
              ${progress.completed}/${progress.total} lessons
              ${progress.percentage > 0 ? `(${progress.percentage}%)` : ''}
            </div>
          </div>
          <button class="unit-files-btn" onclick="event.stopPropagation(); openStudentFileViewer('${unitName}', null)" style="margin: 0%; width: 50%;">
            <span class="material-icons">folder</span>
            Files
          </button>
        </div>
      `;
      
      unitsList.appendChild(li);
    });
  }
}

function goToUnit(unitName) {
  console.log('Navigating to unit:', unitName); // Debug log
  // Navigate to unit detail page
  localStorage.setItem('selectedUnit', unitName);
  const url = `unitdetail.html?unit=${encodeURIComponent(unitName)}`;
  console.log('Navigation URL:', url); // Debug log
  window.location.href = url;
}

function loadUnitsWithoutProgress() {
  console.log('Loading units without progress with smart cache validation');
  
  // Check if we have cached data
  const cachedUnits = CacheManager.getCache(CacheManager.CACHE_KEYS.UNITS);
  
  if (cachedUnits) {
    // We have cached data, but let's validate it against current database structure
    console.log('Found cached units data, validating against database...');
    
    // Load just the keys from database to check for structural changes
    window.db.ref('units').once('value').then(snapshot => {
      const currentUnitsData = snapshot.val();
      
      // Check if cache is still valid
      if (CacheManager.isCacheValid(CacheManager.CACHE_KEYS.UNITS, currentUnitsData)) {
        console.log('Cache is valid, using cached data');
        displayUnitsWithoutProgress(cachedUnits);
      } else {
        console.log('Cache is invalid, loading fresh data');
        // Show notification about new content
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('📚 New content detected! Loading latest units...', 'success');
        }
        loadFreshUnitsWithoutProgress(currentUnitsData);
      }
    }).catch(error => {
      console.error('Error validating cache:', error);
      // If validation fails, use cached data anyway
      displayUnitsWithoutProgress(cachedUnits);
    });
  } else {
    console.log('No cached data found, loading fresh data');
    loadFreshUnitsWithoutProgress();
  }
}

// Load fresh units data without progress
function loadFreshUnitsWithoutProgress(unitsData = null) {
  if (unitsData) {
    // We already have the data from validation
    CacheManager.setCache(CacheManager.CACHE_KEYS.UNITS, unitsData);
    displayUnitsWithoutProgress(unitsData);
  } else {
    // Load from database
    window.db.ref('units').once('value').then(snapshot => {
      const unitsData = snapshot.val();
      
      // Cache units data with new hash validation
      CacheManager.setCache(CacheManager.CACHE_KEYS.UNITS, unitsData);
      
      displayUnitsWithoutProgress(unitsData);
    }).catch(error => {
      console.error('Error loading units without progress:', error);
    });
  }
}

function displayUnitsWithoutProgress(unitsData) {
  const unitsList = document.getElementById('units-list');
  
  // Clear the units list
  unitsList.innerHTML = '';
  
  // Add Teacher Dashboard for teachers
  addTeacherDashboardIfApplicable();
  
  if (unitsData) {
    Object.keys(unitsData).forEach(unitName => {
      const li = document.createElement('li');
      li.onclick = () => goToUnit(unitName);
      li.innerHTML = `
        <div class="unit-item">
          <div class="unit-info">
            <div class="unit-name">${unitName}</div>
          </div>
          <button class="unit-files-btn" onclick="event.stopPropagation(); openStudentFileViewer('${unitName}', null)" style="margin: 0%; width: 50%;">
            <span class="material-icons">folder</span>
            Files
          </button>
        </div>
      `;
      unitsList.appendChild(li);
    });
  }
}

function calculateUnitProgress(unitName, unitData, userProgress) {
  let totalLessons = 0;
  let completedLessons = 0;
  
  // Count lessons in this unit
  Object.keys(unitData).forEach(key => {
    const item = unitData[key];
    if (item && typeof item === 'object' && (item.videoURL || item.videoFile)) {
      totalLessons++;
      
      // Check if this lesson is completed
      if (userProgress[unitName] && userProgress[unitName][key] && userProgress[unitName][key].completed) {
        completedLessons++;
      }
    }
  });
  
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  return {
    total: totalLessons,
    completed: completedLessons,
    percentage: percentage
  };
}

// Load lessons for a unit
function loadLessons(unitName, unitSnap) {
  currentUnit = unitName;
  lessons = [];
  document.getElementById('main-content').scrollTo(0, 0);
  document.getElementById('unit-title')?.remove();

  // Remove the home fragment message if present
  const homeMsg = document.getElementById('home-fragment-msg');
  if (homeMsg) homeMsg.remove();

  // Add or update the unit title
  let unitTitle = document.getElementById('unit-title');
  if (!unitTitle) {
    unitTitle = document.createElement('h2');
    unitTitle.id = 'unit-title';
    document.getElementById('main-content').prepend(unitTitle);
  }
  unitTitle.textContent = unitName;

  const lessonGrid = document.getElementById('lesson-grid');
  lessonGrid.innerHTML = '';
  document.getElementById('lesson-details').style.display = 'none';

  // Get the unit ID from the current unit name for progress tracking
  const unitId = currentUnit;

  // Loop through all lessons in the unit
  unitSnap.forEach(lessonSnap => {
    const lessonKey = lessonSnap.key;
    const lessonData = lessonSnap.val();
    lessons.push({ ...lessonData, key: lessonKey, unitId: unitId });

    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.innerHTML = `
      <img src="${lessonData.thumbnailURL || ''}" alt="Thumbnail" class="lesson-thumbnail" style="width:80px;height:80px;object-fit:cover;margin-bottom:8px;">
      <div style="margin-bottom: 8px;">${lessonKey}</div>
      <div class="lesson-actions" style="display: flex; gap: 6px;">
        <button class="lesson-action-btn" onclick="event.stopPropagation(); showLessonDetails('${lessonKey}')" style="flex: 1; padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
          <span class="material-icons" style="font-size: 14px;">play_arrow</span>
          View
        </button>
        <button class="lesson-action-btn files-btn" onclick="event.stopPropagation(); openStudentFileViewer('${currentUnit}', '${lessonKey}')" style="flex: 1; padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
          <span class="material-icons" style="font-size: 14px;">folder</span>
          Files
        </button>
      </div>
    `;
    // Remove the onclick from the card since we now have specific buttons
    // card.onclick = () => showLessonDetails(lessonKey);
    lessonGrid.appendChild(card);
  });
}

// Show lesson details with thumbnail and description
function showLessonDetails(lessonKey) {
  const details = document.getElementById('lesson-details');
  if (openedLessonKey === lessonKey && details.style.display === 'block') {
    details.style.display = 'none';
    openedLessonKey = null;
    return;
  }
  openedLessonKey = lessonKey;

  const lesson = lessons.find(l => l.key === lessonKey);
  if (!lesson) return;
  
  // Store current lesson info for progress tracking
  window.currentUnitId = lesson.unitId;
  window.currentLessonId = lesson.key;
  
  details.style.display = 'block';

  const thumbnail = lesson.thumbnailURL || "";
  const description = lesson.description || "No description.";
  const videoFile = lesson.videoFile || lesson.videoURL || "";

  // Show thumbnail and description immediately
  details.innerHTML = `
    <img class="lesson-thumbnail" src="${thumbnail}" alt="Thumbnail" />
    <div style="margin:12px 0 8px 0; font-size:1.2em; font-weight:bold;">${lessonKey}</div>
    <div style="margin-bottom:16px;">${description}</div>
    <div id="video-btn-area"><span style="color:#888;">Loading video...</span></div>
  `;

  if (!videoFile) {
    document.getElementById('video-btn-area').innerHTML = "<div>No video available.</div>";
    return;
  }

  storage.ref('videos/' + videoFile).getDownloadURL().then(function(url) {
    document.getElementById('video-btn-area').innerHTML = `
      <button class="play-btn" onclick="playLessonVideo('${url.replace(/'/g, "\\'")}')">Play Video</button>
    `;
  }).catch(function(error) {
    document.getElementById('video-btn-area').innerHTML = "<div>Could not load video.</div>";
  });
}

// Play video in fullscreen modal
let vjsPlayer = null;

window.playLessonVideo = function(videoURL) {
  console.log('Playing video on device:', iOSCompatibility.isIOS ? 'iOS' : 'Other');
  
  const modal = document.getElementById('video-modal');

  // Remove old video element if exists
  let oldVideo = document.getElementById('fullscreen-video');
  if (oldVideo) oldVideo.remove();

  // Create a new video element
  const videoContainer = modal.querySelector('div'); // assuming your modal has a single div wrapper
  const newVideo = document.createElement('video');
  newVideo.id = 'fullscreen-video';
  newVideo.className = 'video-js vjs-default-skin';
  
  // iOS-specific video attributes
  if (iOSCompatibility.isIOS) {
    newVideo.setAttribute('playsinline', 'true');
    newVideo.setAttribute('webkit-playsinline', 'true');
    newVideo.setAttribute('x5-video-player-type', 'h5');
    newVideo.setAttribute('x5-video-player-fullscreen', 'true');
  } else {
    newVideo.setAttribute('playsinline', '');
  }
  
  newVideo.setAttribute('controls', '');
  newVideo.setAttribute('preload', 'auto');
  newVideo.style.webkitTransform = 'translate3d(0, 0, 0)';
  newVideo.style.transform = 'translate3d(0, 0, 0)';
  
  videoContainer.appendChild(newVideo);

  modal.style.display = 'flex';

  // Destroy previous player if exists
  if (vjsPlayer) {
    vjsPlayer.dispose();
    vjsPlayer = null;
  }

  // Set up Video.js player with iOS-specific options
  const playerOptions = {
    controls: true,
    autoplay: !iOSCompatibility.isIOS, // Don't autoplay on iOS initially
    preload: 'auto',
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    controlBar: {
      volumePanel: {inline: false}
    },
    // iOS-specific options
    html5: {
      nativeVideoTracks: false,
      nativeAudioTracks: false,
      nativeTextTracks: false
    }
  };

  vjsPlayer = videojs(newVideo, playerOptions);

  vjsPlayer.src({ type: 'video/mp4', src: videoURL });

  // Enable mobile UI (double-tap seek, better fullscreen, etc.)
  vjsPlayer.mobileUi();

  // Add moving watermark with user email
  vjsPlayer.ready(function() {
    addVideoWatermark();
    
    // iOS-specific play handling
    if (iOSCompatibility.isIOS) {
      // Don't auto-play on iOS, let user tap to play
      console.log('iOS: Video ready, waiting for user interaction');
      
      // Add iOS-specific play button
      const playButton = document.createElement('button');
      playButton.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.7);
        color: white;
        border: none;
        padding: 20px;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        z-index: 1000;
      `;
      playButton.innerHTML = '▶';
      playButton.onclick = function() {
        vjsPlayer.play().then(() => {
          playButton.style.display = 'none';
          
          // Try to go fullscreen after play starts
          setTimeout(() => {
            if (vjsPlayer.requestFullscreen) {
              vjsPlayer.requestFullscreen();
            }
          }, 1000);
        }).catch(e => {
          console.log('iOS play failed:', e);
          iOSCompatibility.showIOSError('Unable to play video. Please try again.', {
            error: e.message,
            type: 'video_play_error',
            name: e.name,
            location: 'iOS_video_play_button'
          });
        });
      };
      
      newVideo.parentNode.appendChild(playButton);
      
      // Remove play button when video starts
      vjsPlayer.on('play', function() {
        if (playButton.parentNode) {
          playButton.parentNode.removeChild(playButton);
        }
      });
    } else {
      // Non-iOS devices - auto-play and fullscreen
      vjsPlayer.play();
      if (vjsPlayer.requestFullscreen) {
        vjsPlayer.requestFullscreen();
        // Try to lock orientation to landscape
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      }
    }
  });

  // Track video completion for progress
  vjsPlayer.on('ended', function() {
    // Mark lesson as completed when video ends
    if (window.currentUnitId && window.currentLessonId) {
      ProgressTracker.markLessonCompleted(window.currentUnitId, window.currentLessonId);
      NotificationManager.showToast('Lesson completed! 🎉');
    }
  });

  // iOS-specific error handling
  vjsPlayer.on('error', function() {
    const error = vjsPlayer.error();
    console.error('Video error:', error);
    
    if (iOSCompatibility.isIOS) {
      iOSCompatibility.showIOSError('Video playback error. Please try refreshing the page.', {
        error: error.message,
        type: 'videojs_playback_error',
        code: error.code,
        metadata: error.metadata,
        location: 'vjsPlayer_error'
      });
    }
  });

  // Prevent right-click and drag
  newVideo.oncontextmenu = e => e.preventDefault();
  newVideo.ondragstart = e => e.preventDefault();
};

// Close video modal
window.closeVideoModal = function() {
  const modal = document.getElementById('video-modal');
  modal.style.display = 'none';
  if (vjsPlayer) {
    vjsPlayer.pause();
    vjsPlayer.dispose();
    vjsPlayer = null;
  }
  // Unlock orientation if needed
  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
};

// Add moving watermark to video player
function addVideoWatermark() {
  if (!vjsPlayer) return;
  
  const currentUser = firebase.auth().currentUser;
  const userEmail = currentUser ? currentUser.email : 'Unknown User';
  
  // Remove existing watermark if any
  const existingWatermark = document.querySelector('.video-watermark-overlay');
  if (existingWatermark) {
    existingWatermark.remove();
  }
  
  // Create watermark overlay
  const watermarkOverlay = document.createElement('div');
  watermarkOverlay.className = 'video-watermark-overlay';
  watermarkOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `;
  
  // Create moving watermark element
  const watermark = document.createElement('div');
  watermark.className = 'moving-watermark';
  watermark.textContent = userEmail;
  watermark.style.cssText = `
    position: absolute;
    color: rgba(255, 255, 255, 0.6);
    font-size: 16px;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    white-space: nowrap;
    user-select: none;
    animation: moveWatermark 15s linear infinite;
  `;
  
  // Add CSS animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes moveWatermark {
      0% { 
        top: 10%; 
        left: 10%; 
        transform: rotate(0deg); 
      }
      25% { 
        top: 20%; 
        left: 80%; 
        transform: rotate(-15deg); 
      }
      50% { 
        top: 70%; 
        left: 70%; 
        transform: rotate(15deg); 
      }
      75% { 
        top: 80%; 
        left: 20%; 
        transform: rotate(-10deg); 
      }
      100% { 
        top: 10%; 
        left: 10%; 
        transform: rotate(0deg); 
      }
    }
  `;
  
  document.head.appendChild(style);
  watermarkOverlay.appendChild(watermark);
  document.body.appendChild(watermarkOverlay);
  
  // Clean up watermark when video ends or is closed
  vjsPlayer.on('dispose', function() {
    if (watermarkOverlay && watermarkOverlay.parentNode) {
      watermarkOverlay.parentNode.removeChild(watermarkOverlay);
    }
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
  });
  
  // Handle fullscreen changes
  const handleFullscreenChange = () => {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    if (isFullscreen) {
      watermarkOverlay.style.position = 'fixed';
      watermarkOverlay.style.zIndex = '9999';
    } else {
      watermarkOverlay.style.position = 'fixed';
      watermarkOverlay.style.zIndex = '9999';
    }
  };
  
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
}

// Drawer open/close logic (matches HTML)
window.openDrawer = function() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-backdrop').style.display = 'block';
};
window.closeDrawer = function() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-backdrop').style.display = 'none';
};

window.onload = function() {
  // Only load units if Firebase is ready and user is authenticated
  if (firebase.apps && firebase.apps.length > 0 && firebase.auth().currentUser) {
    console.log('🎯 Page loaded, user authenticated, loading units...');
    loadUnits();
  } else {
    console.log('🎯 Page loaded, waiting for authentication before loading units...');
  }
};

// Load user preferences
function loadUserPreferences() {
  // Theme is now handled by global.js ThemeManager
}

// Initialize preferences on page load
document.addEventListener('DOMContentLoaded', loadUserPreferences);

// Attempt to deter screen recording (not foolproof)
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden') {
    const video = document.getElementById('fullscreen-video');
    if (video && !video.paused) video.pause();
  }
});

// Optional: FAB click logic
window.onFabClick = function() {
  // Example: open mail or show a message
  alert("FAB clicked!");
};

window.logout = function() {
  AuthManager.logout();
};

window.openSettings = function() {
  Navigation.goToSettings();
};

window.openAdvancedSettings = function() {
  window.location.href = "advanced-settings.html";
};

window.openProgress = function() {
  Navigation.goToProgress();
};

// Enhanced authentication state change handler for mainpage
function setupAuthHandler() {
  if (typeof firebase === 'undefined' || !firebase.auth || !window.db) {
    console.log('Firebase not ready for auth handler, retrying...');
    setTimeout(setupAuthHandler, 500);
    return;
  }
  
  firebase.auth().onAuthStateChanged(function(user) {
    console.log('🔐 Auth state changed:', user ? 'User logged in' : 'User not logged in');
    
    if (!user) {
      console.log('No user authenticated, redirecting to login');
      
      // iOS-specific delay for smoother transition
      if (iOSCompatibility.isIOS) {
        setTimeout(() => {
          console.log('iOS: Redirecting to login page');
          window.location.href = "index.html";
        }, 500);
      } else {
        window.location.href = "index.html";
      }
      return;
    }
  
  console.log('✅ User authenticated:', user.email);
  
  // iOS-specific user verification with enhanced error handling
  if (iOSCompatibility.isIOS) {
    console.log('iOS device detected, performing enhanced user verification...');
    
    // First, verify the user token
    user.getIdToken(true).then(function(idToken) {
      console.log('iOS: User token verified successfully');
      
      // Test database connectivity before proceeding
      console.log('iOS: Testing database connectivity...');
      if (window.db) {
        window.db.ref('users').limitToFirst(1).once('value').then(() => {
          console.log('iOS: Database connectivity confirmed');
          initializeApp();
        }).catch(function(dbError) {
          console.error('iOS: Database connectivity test failed:', dbError);
          iOSCompatibility.showIOSError('Unable to access database. Please check your internet connection and try again.', {
            error: dbError.message,
            type: 'database_connectivity_error',
            code: dbError.code,
            location: 'iOS_database_test',
            timestamp: new Date().toISOString()
          });
        });
      } else {
        console.log('iOS: Database not ready, waiting...');
        setTimeout(() => initializeApp(), 1000);
      }
      
    }).catch(function(error) {
      console.error('iOS: User token verification failed:', error);
      iOSCompatibility.showIOSError('Authentication verification failed. Please try logging out and back in.', {
        error: error.message,
        type: 'auth_token_verification_error',
        code: error.code,
        location: 'iOS_token_verification',
        timestamp: new Date().toISOString()
      });
    });
  } else {
    initializeApp();
  }
  });
}

// iOS-enhanced app initialization
function initializeApp() {
  console.log('Initializing app...');
  
  // Apply iOS fixes for units loading
  if (iOSCompatibility.isIOS) {
    iOSCompatibility.fixUnitsLoading();
  }
  
  // Initialize Advanced Features
  if (typeof AdvancedFeatures !== 'undefined') {
    window.advancedFeatures = new AdvancedFeatures();
    window.advancedFeatures.applyFeatures();
  }
  
  // Load units with progress
  loadUnits();
}

// Apply advanced features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (typeof AdvancedFeatures !== 'undefined') {
    setTimeout(() => {
      if (window.advancedFeatures) {
        window.advancedFeatures.applyFeatures();
      }
    }, 100);
  }
});

// Refresh progress when page becomes visible (user returns from other pages)
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && firebase.auth().currentUser) {
    console.log('Page became visible, refreshing units with progress');
    loadUnits();
  }
});

document.getElementById('fullscreen-video').addEventListener('contextmenu', e => e.preventDefault());
document.getElementById('fullscreen-video').addEventListener('dragstart', e => e.preventDefault());

// Search functionality
let allLessonsCache = null;

// Initialize search functionality
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearButton = document.getElementById('clearSearch');
  
  if (searchInput) {
    searchInput.addEventListener('input', performSearch);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
  
  if (clearButton) {
    clearButton.addEventListener('click', clearSearch);
  }
}

// Cache all lessons for faster searching
function cacheAllLessons() {
  if (allLessonsCache) return Promise.resolve(allLessonsCache);
  
  return window.db.ref('units').once('value')
    .then(snapshot => {
      const lessons = [];
      snapshot.forEach(unitSnap => {
        const unitName = unitSnap.key;
        const unitData = unitSnap.val();
        
        Object.keys(unitData).forEach(lessonKey => {
          const lesson = unitData[lessonKey];
          if (lesson && typeof lesson === 'object') {
            lessons.push({
              unitName,
              lessonKey,
              title: lesson.title || lessonKey,
              description: lesson.description || '',
              videoURL: lesson.videoURL || '',
              thumbnailURL: lesson.thumbnailURL || ''
            });
          }
        });
      });
      
      allLessonsCache = lessons;
      return lessons;
    })
    .catch(error => {
      console.error('Error caching lessons:', error);
      return [];
    });
}

// Perform search across all lessons
function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) {
    clearSearch();
    return;
  }
  
  cacheAllLessons().then(lessons => {
    const results = lessons.filter(lesson => {
      return lesson.title.toLowerCase().includes(query) ||
             lesson.description.toLowerCase().includes(query) ||
             lesson.unitName.toLowerCase().includes(query);
    });
    
    displaySearchResults(results);
  });
}

// Display search results
function displaySearchResults(results) {
  const resultsContainer = document.getElementById('searchResults');
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 24px;">No lessons found</div>';
    return;
  }
  
  resultsContainer.innerHTML = results.map(lesson => `
    <div class="search-result-item" onclick="openLesson('${lesson.unitName}', '${lesson.lessonKey}')">
      <div class="search-result-unit">${lesson.unitName}</div>
      <div class="search-result-title">${lesson.title}</div>
      <div class="search-result-description">${lesson.description}</div>
    </div>
  `).join('');
}

// Clear search results
function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');
  
  searchInput.value = '';
  resultsContainer.innerHTML = '';
}

// Open lesson from search results
window.openLesson = function(unitName, lessonKey) {
  // Store the selected unit and lesson
  localStorage.setItem('selectedUnit', unitName);
  localStorage.setItem('selectedLesson', lessonKey);
  
  // Navigate to the unit detail page with the lesson
  window.location.href = `unitdetail.html?unit=${encodeURIComponent(unitName)}&lesson=${encodeURIComponent(lessonKey)}`;
};

// Show search section
window.showSearchSection = function() {
  const mainContent = document.querySelector('.main-content');
  const searchSection = document.getElementById('searchSection');
  
  // Hide main content, show search
  if (mainContent) {
    mainContent.style.display = 'none';
  }
  if (searchSection) {
    searchSection.style.display = 'block';
    document.getElementById('searchInput').focus();
  }
  
  // Cache lessons for faster search
  cacheAllLessons();
  
  // Close drawer
  closeDrawer();
};

// Hide search section and return to main content
window.hideSearchSection = function() {
  const mainContent = document.querySelector('.main-content');
  const searchSection = document.getElementById('searchSection');
  
  // Show main content, hide search
  if (mainContent) {
    mainContent.style.display = 'flex';
  }
  if (searchSection) {
    searchSection.style.display = 'none';
  }
  
  // Clear search results
  clearSearch();
};

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initSearch();
  
  // Add click handler for search menu item
  const searchMenuItem = document.getElementById('searchMenuItem');
  if (searchMenuItem) {
    searchMenuItem.addEventListener('click', showSearchSection);
  }
  
  // Initialize security measures for file viewing (removed for simplified implementation)
});

function addTeacherDashboardIfApplicable() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  // Check if teacher dashboard already exists
  const unitsList = document.getElementById('units-list');
  const existingTeacherDashboard = unitsList.querySelector('li[data-teacher-dashboard="true"]');
  if (existingTeacherDashboard) {
    return; // Already exists, don't add another one
  }
  
  // Check if we're already processing this (prevent race conditions)
  if (window.processingTeacherDashboard) {
    return;
  }
  window.processingTeacherDashboard = true;
  
  // ALWAYS make a fresh database query - no caching for teacher dashboard
  console.log('Loading teacher dashboard status directly from database (no cache)');
  
  // Search for user by email in database - force fresh query
  window.db.ref('users').orderByChild('email').equalTo(user.email).once('value').then(snapshot => {
    // Double check if teacher dashboard was added while we were waiting
    const existingTeacherDashboardCheck = unitsList.querySelector('li[data-teacher-dashboard="true"]');
    if (existingTeacherDashboardCheck) {
      window.processingTeacherDashboard = false;
      return; // Already exists, don't add another one
    }
    
    if (!snapshot.exists()) {
      console.log('User not found in database, no teacher dashboard');
      window.processingTeacherDashboard = false;
      return;
    }
    
    // Get the first (and should be only) matching user
    const userData = Object.values(snapshot.val())[0];
    console.log('User data loaded from database:', userData);
    
    if (userData && userData.type === 'teacher') {
      console.log('User is confirmed as teacher, adding teacher dashboard');
      
      // Add Teacher Dashboard link
      const teacherDashboardItem = document.createElement('li');
      teacherDashboardItem.setAttribute('data-static', 'true');
      teacherDashboardItem.setAttribute('data-teacher-dashboard', 'true');
      teacherDashboardItem.style.borderBottom = '1px solid #eee';
      teacherDashboardItem.style.backgroundColor = 'transparent';
      teacherDashboardItem.innerHTML = `
        <span class="material-icons" style="vertical-align: middle; margin-right: 12px;">dashboard</span>
        <span data-translate="teacherDashboard">Teacher Dashboard</span>
      `;
      teacherDashboardItem.onclick = () => {
        window.location.href = 'teacher-dashboard.html';
      };
      
      // Insert after the settings items but before units
      const lastStaticItem = unitsList.querySelector('li[data-static="true"]:last-of-type');
      if (lastStaticItem) {
        lastStaticItem.parentNode.insertBefore(teacherDashboardItem, lastStaticItem.nextSibling);
      } else {
        unitsList.appendChild(teacherDashboardItem);
      }
      
      // Update translations if advanced features are available
      if (typeof advancedFeatures !== 'undefined' && advancedFeatures) {
        advancedFeatures.updateUITexts();
      }
    } else {
      console.log('User is not a teacher, no teacher dashboard added');
    }
    
    window.processingTeacherDashboard = false;
  }).catch(error => {
    console.error('Error checking user type from database:', error);
    window.processingTeacherDashboard = false;
  });
}

// Student file viewer functions
function openStudentFileViewer(unitKey, lessonKey) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'studentFileViewerModal';
  modal.style.display = 'flex';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  modal.style.zIndex = '10000';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.padding = '20px';
  modal.style.boxSizing = 'border-box';
  
  const targetName = lessonKey ? `Lesson: ${lessonKey}` : `Unit: ${unitKey}`;
  
  modal.innerHTML = `
    <div class="modal-content" style="background: white; border-radius: 12px; max-width: 900px; max-height: 90vh; width: 100%; overflow-y: auto; position: relative;">
      <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: #6c4fc1; font-size: 20px;">📁 Files - ${targetName}</h3>
        <button onclick="closeStudentFileViewer()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div id="studentFilesList" style="min-height: 200px;">
          <div style="text-align: center; padding: 40px; color: #666;">
            <span class="material-icons" style="font-size: 48px; color: #ddd; margin-bottom: 16px;">folder_open</span>
            <div>Loading files...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load files
  loadStudentFiles(unitKey, lessonKey);
}

function closeStudentFileViewer() {
  const modal = document.getElementById('studentFileViewerModal');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
}

function loadStudentFiles(unitKey, lessonKey) {
  const filesList = document.getElementById('studentFilesList');
  
  if (lessonKey) {
    // Load lesson files
    loadStudentLessonFiles(unitKey, lessonKey);
  } else {
    // Load unit files
    loadStudentUnitFiles(unitKey);
  }
}

function loadStudentUnitFiles(unitKey) {
  const filesList = document.getElementById('studentFilesList');
  const dbPath = `units/${unitKey}/files`;
  
  console.log('Loading student unit files from path:', dbPath);
  
  window.db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      console.log('No unit files found at path:', dbPath);
      filesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; color: #ddd; margin-bottom: 16px;">folder_open</span>
          <div>No unit files available</div>
          <div style="font-size: 12px; color: #999; margin-top: 8px;">Unit files will appear here once uploaded by your teacher</div>
        </div>
      `;
      return;
    }
    
    const files = [];
    snapshot.forEach(child => {
      const fileData = child.val();
      fileData.id = child.key;
      console.log('Found student unit file:', child.key, fileData);
      
      // Only show files that students can access (not restricted)
      if (fileData.access !== 'restricted') {
        files.push(fileData);
      }
    });
    
    if (files.length === 0) {
      filesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; color: #ddd; margin-bottom: 16px;">folder_open</span>
          <div>No unit files available for students</div>
        </div>
      `;
      return;
    }
    
    // Sort files by upload date (newest first)
    files.sort((a, b) => b.uploadedAt - a.uploadedAt);
    
    displayStudentUnitFiles(files, unitKey);
  }).catch(error => {
    console.error('Error loading student unit files:', error);
    filesList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">error</span>
        <div>Error loading unit files</div>
      </div>
    `;
  });
}

function displayStudentUnitFiles(files, unitKey) {
  const filesList = document.getElementById('studentFilesList');
  
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">';
  
  files.forEach(file => {
    const fileIcon = getStudentFileIcon(file.extension);
    const fileSize = formatStudentFileSize(file.size);
    const uploadDate = new Date(file.uploadedAt).toLocaleDateString();
    const canDownload = file.access === 'downloadable';
    const canPreview = canStudentPreviewFile(file.extension);
    
    html += `
      <div class="student-file-card" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; transition: all 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span class="material-icons" style="font-size: 32px; color: #6c4fc1;">${fileIcon}</span>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: bold; font-size: 14px; color: #333; margin-bottom: 4px; word-break: break-word;">${file.name}</div>
            <div style="font-size: 12px; color: #666;">${file.type} • ${fileSize}</div>
          </div>
        </div>
        
        ${file.description ? `<div style="font-size: 12px; color: #666; margin-bottom: 12px; line-height: 1.4;">${file.description}</div>` : ''}
        
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #888; margin-bottom: 12px;">
          <span>Uploaded: ${uploadDate}</span>
          <span class="student-access-badge ${file.access}">${file.access === 'view-only' ? 'View Only' : 'Downloadable'}</span>
        </div>
        
        <div style="display: flex; gap: 8px;">
          ${canPreview ? `<button onclick="previewStudentFile('${file.id}', '${unitKey}', null)" style="flex: 1; padding: 6px 12px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;">
            <span class="material-icons" style="font-size: 14px;">visibility</span>
            Preview
          </button>` : ''}
          
          ${canDownload ? `<button onclick="downloadStudentFile('${file.url}', '${file.name}')" style="flex: 1; padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;">
            <span class="material-icons" style="font-size: 14px;">download</span>
            Download
          </button>` : `<button disabled style="flex: 1; padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span class="material-icons" style="font-size: 14px;">block</span>
            No Download
          </button>`}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  filesList.innerHTML = html;
}

function previewStudentFile(fileId, unitKey, lessonKey) {
  const dbPath = lessonKey ? 
    `units/${unitKey}/lesson${lessonKey}/files/${fileId}` : 
    `units/${unitKey}/files/${fileId}`;
  
  console.log('Loading student file for preview from path:', dbPath);
  
  window.db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      console.log('File not found at path:', dbPath);
      alert('File not found');
      return;
    }
    
    const file = snapshot.val();
    showStudentFilePreview(file);
  }).catch(error => {
    console.error('Error loading student file:', error);
    alert('Error loading file preview');
  });
}

function getStudentFileIcon(extension) {
  const iconMap = {
    'pdf': 'picture_as_pdf',
    'doc': 'description',
    'docx': 'description',
    'txt': 'description',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'mp4': 'video_file',
    'mp3': 'audio_file',
    'ppt': 'slideshow',
    'pptx': 'slideshow',
    'xls': 'table_chart',
    'xlsx': 'table_chart'
  };
  
  return iconMap[extension.toLowerCase()] || 'insert_drive_file';
}

function formatStudentFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function canStudentPreviewFile(extension) {
  const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'txt'];
  return previewableTypes.includes(extension.toLowerCase());
}

function downloadStudentFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function createSecureProxy(originalUrl) {
  // Create a secure proxy to hide the original URL
  const proxyData = {
    url: originalUrl,
    timestamp: Date.now(),
    user: firebase.auth().currentUser?.email || 'anonymous'
  };
  
  // Store in session storage with encrypted key
  const proxyKey = btoa(Date.now().toString()).replace(/[^a-zA-Z0-9]/g, '');
  sessionStorage.setItem('proxy_' + proxyKey, btoa(JSON.stringify(proxyData)));
  
  // Return obfuscated URL
  return `viewer_readonly.html?p=${proxyKey}&t=${Date.now()}`;
}

function showStudentFilePreview(file) {
  console.log('Showing file preview on device:', iOSCompatibility.isIOS ? 'iOS' : 'Other');
  
  const modal = document.createElement('div');
  modal.id = 'studentFilePreviewModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 15000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  `;
  
  // iOS-specific modal adjustments
  if (iOSCompatibility.isIOS) {
    modal.style.padding = '0';
    modal.style.paddingTop = 'env(safe-area-inset-top, 0)';
    modal.style.paddingBottom = 'env(safe-area-inset-bottom, 0)';
  }

  // Only handle PDF files with the readonly viewer
  if (file.extension.toLowerCase() === 'pdf') {
    // Use secure proxy to hide original URL
    const secureViewerUrl = createSecureProxy(file.url);
    
    modal.innerHTML = `
      <div id="studentFileContainer" style="background: #333; border-radius: ${iOSCompatibility.isIOS ? '0' : '12px'}; max-width: 95vw; max-height: 95vh; width: 100%; height: 100%; position: relative; overflow: hidden; -webkit-transform: translate3d(0, 0, 0); transform: translate3d(0, 0, 0);">
        <div style="background: #444; padding: 16px; display: flex; justify-content: space-between; align-items: center; border-radius: ${iOSCompatibility.isIOS ? '0' : '12px 12px 0 0'};">
          <h3 style="margin: 0; color: white; font-size: 18px;">📄 ${file.name}</h3>
          <div style="display: flex; gap: 10px;">
            <button onclick="toggleStudentFilePreviewFullscreen()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; -webkit-tap-highlight-color: transparent;" title="Toggle Fullscreen">⛶</button>
            <button onclick="closeStudentFilePreview()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; -webkit-tap-highlight-color: transparent;">&times;</button>
          </div>
        </div>
        <div id="studentFileViewport" style="width: 100%; height: 85%; position: relative; overflow: hidden; -webkit-overflow-scrolling: touch;">
          <iframe id="studentFileFrame" src="${secureViewerUrl}" style="width: 100%; height: 100%; border: none; background: white; transform-origin: 0 0; transition: transform 0.3s ease; -webkit-transform: translate3d(0, 0, 0); transform: translate3d(0, 0, 0);" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>
        </div>
      </div>
    `;
  } else {
    // For non-PDF files, show a simple preview or download option
    modal.innerHTML = `
      <div style="background: #333; border-radius: ${iOSCompatibility.isIOS ? '0' : '12px'}; max-width: 90vw; max-height: 90vh; width: 100%; position: relative; overflow: hidden; -webkit-transform: translate3d(0, 0, 0); transform: translate3d(0, 0, 0);">
        <div style="background: #444; padding: 16px; display: flex; justify-content: space-between; align-items: center; border-radius: ${iOSCompatibility.isIOS ? '0' : '12px 12px 0 0'};">
          <h3 style="margin: 0; color: white; font-size: 18px;">📄 ${file.name}</h3>
          <button onclick="closeStudentFilePreview()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; -webkit-tap-highlight-color: transparent;">&times;</button>
        </div>
        <div style="padding: 40px; text-align: center; color: white;">
          <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">insert_drive_file</span>
          <div style="margin-bottom: 20px;">Preview not available for this file type</div>
          ${file.access === 'downloadable' ? `
            <button onclick="downloadStudentFile('${file.url}', '${file.name}')" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; -webkit-tap-highlight-color: transparent;">
              <span class="material-icons" style="font-size: 18px;">download</span>
              Download File
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // iOS-specific body fixes
  if (iOSCompatibility.isIOS) {
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  }

  // Add touch zoom functionality for mobile devices
  if (file.extension.toLowerCase() === 'pdf') {
    initializeStudentFileZoom();
    
    // iOS-specific iframe loading handler
    if (iOSCompatibility.isIOS) {
      const iframe = document.getElementById('studentFileFrame');
      iframe.onload = function() {
        console.log('iOS: PDF iframe loaded successfully');
      };
      
      iframe.onerror = function() {
        console.error('iOS: PDF iframe failed to load');
        iOSCompatibility.showIOSError('Unable to load PDF. Please try again.');
      };
    }
  }
}

// Touch zoom functionality for student file preview (mobile only)
let studentFileZoomState = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  lastPanX: 0,
  lastPanY: 0,
  initialDistance: 0,
  isZooming: false,
  isDragging: false,
  isScrolling: false,
  minScale: 0.5,
  maxScale: 3,
  zoomCenterX: 0,
  zoomCenterY: 0
};

function initializeStudentFileZoom() {
  const viewport = document.getElementById('studentFileViewport');
  const frame = document.getElementById('studentFileFrame');
  
  if (!viewport || !frame) return;

  // Reset zoom state
  studentFileZoomState = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    lastPanX: 0,
    lastPanY: 0,
    initialDistance: 0,
    isZooming: false,
    isDragging: false,
    isScrolling: false,
    minScale: 0.5,
    maxScale: 3,
    zoomCenterX: 0,
    zoomCenterY: 0
  };

  // Touch event handlers (mobile only)
  viewport.addEventListener('touchstart', handleStudentFileZoomStart, { passive: false });
  viewport.addEventListener('touchmove', handleStudentFileZoomMove, { passive: false });
  viewport.addEventListener('touchend', handleStudentFileZoomEnd, { passive: false });

  // Prevent default touch behaviors
  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
}

function handleStudentFileZoomStart(e) {
  const touches = e.touches;
  
  if (touches.length === 2) {
    // Two fingers - start zoom
    studentFileZoomState.isZooming = true;
    studentFileZoomState.isDragging = false;
    studentFileZoomState.isScrolling = false;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    studentFileZoomState.initialDistance = Math.sqrt(
      Math.pow(touch1.clientX - touch2.clientX, 2) + 
      Math.pow(touch1.clientY - touch2.clientY, 2)
    );
    
    // Calculate center point for zoom
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;
    
    const viewport = document.getElementById('studentFileViewport');
    const rect = viewport.getBoundingClientRect();
    
    studentFileZoomState.zoomCenterX = centerX - rect.left;
    studentFileZoomState.zoomCenterY = centerY - rect.top;
    
    e.preventDefault();
  } else if (touches.length === 1) {
    // One finger - check if it's scrolling or dragging
    const touch = touches[0];
    studentFileZoomState.startTouchX = touch.clientX;
    studentFileZoomState.startTouchY = touch.clientY;
    studentFileZoomState.startTime = Date.now();
    
    // Start as potential drag
    studentFileZoomState.isDragging = true;
    studentFileZoomState.isZooming = false;
    studentFileZoomState.isScrolling = false;
    
    studentFileZoomState.startX = touch.clientX - studentFileZoomState.translateX;
    studentFileZoomState.startY = touch.clientY - studentFileZoomState.translateY;
  }
}

function handleStudentFileZoomMove(e) {
  const touches = e.touches;
  
  if (studentFileZoomState.isZooming && touches.length === 2) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const currentDistance = Math.sqrt(
      Math.pow(touch1.clientX - touch2.clientX, 2) + 
      Math.pow(touch1.clientY - touch2.clientY, 2)
    );
    
    const scaleFactor = currentDistance / studentFileZoomState.initialDistance;
    let newScale = studentFileZoomState.scale * scaleFactor;
    
    // Clamp scale
    newScale = Math.max(studentFileZoomState.minScale, Math.min(studentFileZoomState.maxScale, newScale));
    
    studentFileZoomState.scale = newScale;
    studentFileZoomState.initialDistance = currentDistance;
    
    applyStudentFileTransform();
    e.preventDefault();
  } else if (touches.length === 1 && studentFileZoomState.isDragging) {
    const touch = touches[0];
    const deltaX = Math.abs(touch.clientX - studentFileZoomState.startTouchX);
    const deltaY = Math.abs(touch.clientY - studentFileZoomState.startTouchY);
    const timeDelta = Date.now() - studentFileZoomState.startTime;
    
    // If not yet determined, check if it's scrolling or dragging
    if (!studentFileZoomState.isScrolling && timeDelta > 100) {
      // Determine if it's vertical scrolling or pan movement
      if (deltaY > deltaX && deltaY > 10) {
        // Vertical movement - likely scrolling
        studentFileZoomState.isScrolling = true;
        studentFileZoomState.isDragging = false;
        return; // Allow normal scrolling
      } else if (deltaX > 10 || deltaY > 10) {
        // More horizontal or significant movement - pan
        studentFileZoomState.isScrolling = false;
      }
    }
    
    // If it's scrolling, don't prevent default
    if (studentFileZoomState.isScrolling) {
      return;
    }
    
    // Handle pan movement
    if (!studentFileZoomState.isScrolling) {
      studentFileZoomState.translateX = touch.clientX - studentFileZoomState.startX;
      studentFileZoomState.translateY = touch.clientY - studentFileZoomState.startY;
      
      // Store the last pan position
      studentFileZoomState.lastPanX = studentFileZoomState.translateX;
      studentFileZoomState.lastPanY = studentFileZoomState.translateY;
      
      applyStudentFileTransform();
      e.preventDefault();
    }
  }
}

function handleStudentFileZoomEnd(e) {
  if (e.touches.length === 0) {
    studentFileZoomState.isZooming = false;
    studentFileZoomState.isDragging = false;
    studentFileZoomState.isScrolling = false;
  }
}

function applyStudentFileTransform() {
  const frame = document.getElementById('studentFileFrame');
  if (!frame) return;
  
  // Use translate and scale together, maintaining the last pan position
  const transform = `translate(${studentFileZoomState.translateX}px, ${studentFileZoomState.translateY}px) scale(${studentFileZoomState.scale})`;
  
  frame.style.transition = 'transform 0.1s ease-out';
  frame.style.transform = transform;
}

function closeStudentFilePreview() {
  const modal = document.getElementById('studentFilePreviewModal');
  if (modal) {
    // Clean up event listeners
    const viewport = document.getElementById('studentFileViewport');
    if (viewport) {
      viewport.removeEventListener('touchstart', handleStudentFileZoomStart);
      viewport.removeEventListener('touchmove', handleStudentFileZoomMove);
      viewport.removeEventListener('touchend', handleStudentFileZoomEnd);
    }
    
    // Reset zoom state
    studentFileZoomState = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      lastPanX: 0,
      lastPanY: 0,
      initialDistance: 0,
      isZooming: false,
      isDragging: false,
      minScale: 0.5,
      maxScale: 3
    };
    
    modal.remove();
  }
  
  // iOS-specific body restoration
  if (iOSCompatibility.isIOS) {
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  }
  
  document.body.style.overflow = 'auto';
}

// Fullscreen functionality
let isStudentFilePreviewFullscreen = false;

function toggleStudentFilePreviewFullscreen() {
  const modal = document.getElementById('studentFilePreviewModal');
  const appbar = document.querySelector('.appbar');
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isStudentFilePreviewFullscreen) {
    // Enter fullscreen
    if (isMobile) {
      // For mobile - force horizontal orientation
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(e => console.log('Orientation lock failed:', e));
      }
    }
    
    // Request fullscreen on the modal
    if (modal.requestFullscreen) {
      modal.requestFullscreen().catch(e => console.log('Fullscreen failed:', e));
    } else if (modal.webkitRequestFullscreen) {
      modal.webkitRequestFullscreen();
    } else if (modal.msRequestFullscreen) {
      modal.msRequestFullscreen();
    }
    
    // Hide the appbar
    if (appbar) {
      appbar.style.display = 'none';
    }
    
    // Update modal content styling for fullscreen
    const modalContent = modal.querySelector('div[style*="background: #333"]');
    if (modalContent) {
      modalContent.style.cssText = 'background: #333; border-radius: 12px; width: 100%; height: 100%; position: relative; overflow: hidden;';
    }
    
    // Remove modal padding in fullscreen
    modal.style.padding = '0%';
    
    // Ensure controls are visible in fullscreen on all devices
    const iframe = modal.querySelector('iframe');
    if (iframe) {
      // Add a small delay to ensure fullscreen is active
      setTimeout(() => {
        // Force landscape orientation on mobile after fullscreen
        if (isMobile && screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(e => console.log('Orientation lock retry failed:', e));
        }
        
        // Add PDF navigation controls for fullscreen
        addStudentPDFNavigationControls(modal);
      }, 500);
    }
    
    isStudentFilePreviewFullscreen = true;
    
    // Update button text
    const fullscreenBtn = modal.querySelector('button[onclick="toggleStudentFilePreviewFullscreen()"]');
    if (fullscreenBtn) {
      fullscreenBtn.textContent = '❐';
    }
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    // Show the appbar
    if (appbar) {
      appbar.style.display = 'flex';
    }
    
    // Restore original modal content styling
    const modalContent = modal.querySelector('div[style*="background: #333"]');
    if (modalContent) {
      modalContent.style.cssText = 'background: #333; border-radius: 12px; max-width: 95vw; max-height: 95vh; width: 100%; height: 100%; position: relative; overflow: hidden;';
    }
    
    // Restore modal padding
    modal.style.padding = '20px';
    
    // Unlock orientation when exiting fullscreen on mobile
    if (isMobile && screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
    
    // Remove PDF navigation controls
    removeStudentPDFNavigationControls();
    
    isStudentFilePreviewFullscreen = false;

    modal.style.padding = '0%';
    
    // Update button text
    const fullscreenBtn = modal.querySelector('button[onclick="toggleStudentFilePreviewFullscreen()"]');
    if (fullscreenBtn) {
      fullscreenBtn.textContent = '⛶';
    }
  }
}

// PDF Navigation Controls for student file viewer
function addStudentPDFNavigationControls(modal) {
  // Add controls for all devices when in fullscreen
  if (!isStudentFilePreviewFullscreen) {
    return;
  }
  
  // Remove existing controls if any
  removeStudentPDFNavigationControls();
  
  // Find the header section in the modal
  const headerSection = modal.querySelector('div[style*="background: #444"]');
  if (!headerSection) {
    console.log('Header section not found');
    return;
  }
  
  // Find the button container in the header
  const buttonContainer = headerSection.querySelector('div[style*="display: flex; gap: 10px"]');
  if (!buttonContainer) {
    console.log('Button container not found');
    return;
  }
  
  // Create navigation controls container
  const navControls = document.createElement('div');
  navControls.id = 'studentPdfNavigationControls';
  navControls.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: 10px;
  `;
  
  // Create previous page button
  const prevBtn = document.createElement('button');
  prevBtn.id = 'studentPdfPrevBtn';
  prevBtn.innerHTML = '◀';
  prevBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  `;
  
  // Create next page button
  const nextBtn = document.createElement('button');
  nextBtn.id = 'studentPdfNextBtn';
  nextBtn.innerHTML = '▶';
  nextBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  `;
  
  // Add hover effects
  const addHoverEffects = (btn) => {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.3)';
      btn.style.transform = 'scale(1.1)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.2)';
      btn.style.transform = 'scale(1)';
    });
  };
  
  addHoverEffects(prevBtn);
  addHoverEffects(nextBtn);
  
  // Add click handlers that trigger the iframe's navigation
  prevBtn.addEventListener('click', () => {
    const iframe = modal.querySelector('iframe');
    if (iframe) {
      try {
        // Try to trigger the previous button in the iframe
        iframe.contentWindow.postMessage({ 
          type: 'navigate', 
          action: 'previous' 
        }, '*');
      } catch (e) {
        console.log('Failed to navigate to previous page:', e);
      }
    }
  });
  
  nextBtn.addEventListener('click', () => {
    const iframe = modal.querySelector('iframe');
    if (iframe) {
      try {
        // Try to trigger the next button in the iframe
        iframe.contentWindow.postMessage({ 
          type: 'navigate', 
          action: 'next' 
        }, '*');
      } catch (e) {
        console.log('Failed to navigate to next page:', e);
      }
    }
  });
  
  // Add touch handlers for mobile
  const addTouchHandlers = (btn, action) => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btn.style.background = 'rgba(255, 255, 255, 0.3)';
      btn.style.transform = 'scale(1.1)';
      btn.click();
    });
    
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.style.background = 'rgba(255, 255, 255, 0.2)';
      btn.style.transform = 'scale(1)';
    });
  };
  
  addTouchHandlers(prevBtn, 'prev');
  addTouchHandlers(nextBtn, 'next');
  
  // Add buttons to navigation controls
  navControls.appendChild(prevBtn);
  navControls.appendChild(nextBtn);
  
  // Insert navigation controls before the existing button container
  headerSection.insertBefore(navControls, buttonContainer);
}

function removeStudentPDFNavigationControls() {
  const navControls = document.getElementById('studentPdfNavigationControls');
  if (navControls) {
    navControls.remove();
  }
}

// Open assignments and quizzes page
function openAssignments() {
  window.location.href = "student-assignments.html";
}
