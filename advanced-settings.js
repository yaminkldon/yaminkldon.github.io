// Advanced Settings JavaScript - V7.0
// Handles all advanced features settings and UI interactions

// iOS Compatibility System for Advanced Settings Page
const iOSCompatibilityAdvancedSettings = {
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
    console.log('🍎 Initializing iOS compatibility for Advanced Settings...');
    
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
    
    if (this.deviceInfo.isIOS) {
      console.log('🎯 iOS device detected, applying compatibility fixes...');
      this.applyIOSFixes();
    }
    
    this.isInitialized = true;
    // Apply universal mobile enhancements
    this.applyMobileEnhancements();
    
    console.log('✅ iOS compatibility initialization complete for Advanced Settings');
  },
  
  applyIOSFixes: function() {
    this.fixViewport();
    this.addIOSStyles();
    this.fixTouchEvents();
    this.fixButtonInteractions();
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
      
      .settings-group, .setting-card {
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
      button, .btn, .option-btn {
        -webkit-appearance: none;
        border-radius: 8px;
        border: none;
        cursor: pointer;
      }
      
      /* iOS option buttons */
      .option-btn {
        transition: all 0.2s ease;
      }
      
      .option-btn:active {
        transform: scale(0.95);
      }
      
      .option-btn.active {
        background: #6c4fc1;
        color: white;
      }
    `;
    document.head.appendChild(style);
  },
  
  fixTouchEvents: function() {
    console.log('👆 Fixing touch events for iOS...');
    
    // Enhanced touch handling for settings buttons
    document.addEventListener('DOMContentLoaded', () => {
      const addTouchSupport = () => {
        const buttons = document.querySelectorAll('.option-btn, .setting-card, button');
        buttons.forEach(button => {
          button.addEventListener('touchstart', function(e) {
            if (!this.classList.contains('active')) {
              this.style.opacity = '0.7';
            }
          }, { passive: true });
          
          button.addEventListener('touchend', function(e) {
            this.style.opacity = '1';
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
  
  fixButtonInteractions: function() {
    console.log('🔘 Fixing button interactions for iOS...');
    
    // Enhanced button feedback
    document.addEventListener('DOMContentLoaded', () => {
      const buttons = document.querySelectorAll('.option-btn');
      buttons.forEach(button => {
        button.addEventListener('click', function() {
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
    
    // Add loading indicators and mobile styles
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
        
        .setting-card {
          padding: 16px;
        }
        
        .option-btn {
          padding: 12px 16px;
          font-size: 14px;
        }
      }
      
      @media (max-width: 480px) {
        .container {
          padding: 16px;
        }
        
        .setting-card {
          padding: 12px;
        }
        
        .option-btn {
          padding: 10px 12px;
          font-size: 13px;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Enhanced touch feedback
    document.addEventListener('touchstart', function(e) {
      const target = e.target;
      if (target.classList.contains('option-btn') || 
          target.classList.contains('setting-card') || 
          target.tagName === 'BUTTON') {
        target.style.opacity = '0.7';
      }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
      const target = e.target;
      if (target.classList.contains('option-btn') || 
          target.classList.contains('setting-card') || 
          target.tagName === 'BUTTON') {
        target.style.opacity = '1';
      }
    }, { passive: true });
  },

  shareError: function(errorDetails) {
    if (this.deviceInfo.isIOS && navigator.share) {
      const errorText = `Advanced Settings Error Report:\n\n${errorDetails}\n\nDevice: ${this.deviceInfo.userAgent}\nScreen: ${this.deviceInfo.screenDimensions}\nStandalone: ${this.deviceInfo.isStandalone}`;
      
      navigator.share({
        title: 'Advanced Settings Error Report',
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

// Initialize iOS compatibility system FIRST
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing iOS compatibility for Advanced Settings first...');
  iOSCompatibilityAdvancedSettings.init();
});

class AdvancedSettingsManager {
  constructor() {
    this.advancedFeatures = new AdvancedFeatures();
    this.init();
  }

  init() {
    this.loadCurrentSettings();
    this.setupEventListeners();
    this.updateLanguageDisplay();
  }

  loadCurrentSettings() {
    // Load current language
    const currentLanguage = this.advancedFeatures.getCurrentLanguage();
    const langElement = document.getElementById(`lang-${currentLanguage}`);
    if (langElement) {
      langElement.classList.add('active');
    }

    // Load current font size
    const currentFontSize = this.advancedFeatures.getCurrentFontSize();
    const fontElement = document.getElementById(`font-${currentFontSize}`);
    if (fontElement) {
      fontElement.classList.add('active');
    }

    // Load current layout
    const currentLayout = this.advancedFeatures.getCurrentLayout();
    const layoutElement = document.getElementById(`layout-${currentLayout}`);
    if (layoutElement) {
      layoutElement.classList.add('active');
    }

    // Apply current theme to body
    const currentTheme = this.advancedFeatures.getCurrentTheme();
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }

    // Apply font size
    this.applyFontSize(currentFontSize);
  }

  setupEventListeners() {
    // No additional event listeners needed for now
    console.log('Event listeners set up for advanced settings');
  }

  applyFontSize(size) {
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };

    document.documentElement.style.setProperty('--base-font-size', fontSizes[size]);
  }

  updateLanguageDisplay() {
    const currentLanguage = this.advancedFeatures.getCurrentLanguage();
    if (currentLanguage === 'ar') {
      document.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
    this.advancedFeatures.updateLanguageDisplay();
  }
}

// Global functions for UI interactions
function goBack() {
  window.history.back();
}

function setLanguage(lang) {
  try {
    if (!window.settingsManager) {
      console.error('Settings manager not initialized');
      return;
    }
    
    // Remove active class from all language buttons
    document.querySelectorAll('[id^="lang-"]').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to selected language
    document.getElementById(`lang-${lang}`).classList.add('active');
    
    // Update language in advanced features
    window.settingsManager.advancedFeatures.setLanguage(lang);
    
    // Update display
    window.settingsManager.updateLanguageDisplay();
    
    console.log(`Language set to: ${lang}`);
  } catch (error) {
    console.error('Error setting language:', error);
  }
}

function setFontSize(size) {
  try {
    if (!window.settingsManager) {
      console.error('Settings manager not initialized');
      return;
    }
    
    // Remove active class from all font size buttons
    document.querySelectorAll('[id^="font-"]').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to selected font size
    document.getElementById(`font-${size}`).classList.add('active');
    
    // Apply font size
    window.settingsManager.advancedFeatures.setFontSize(size);
    window.settingsManager.applyFontSize(size);
    
    console.log(`Font size set to: ${size}`);
  } catch (error) {
    console.error('Error setting font size:', error);
  }
}

function setLayout(layout) {
  try {
    if (!window.settingsManager) {
      console.error('Settings manager not initialized');
      return;
    }
    
    // Remove active class from all layout buttons
    document.querySelectorAll('[id^="layout-"]').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to selected layout
    document.getElementById(`layout-${layout}`).classList.add('active');
    
    // Apply layout
    window.settingsManager.advancedFeatures.setLayout(layout);
    
    console.log(`Layout set to: ${layout}`);
  } catch (error) {
    console.error('Error setting layout:', error);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Initializing Advanced Settings...');
    
    // Check if AdvancedFeatures class is available
    if (typeof AdvancedFeatures === 'undefined') {
      console.error('AdvancedFeatures class is not available. Make sure advanced-features.js is loaded.');
      return;
    }
    
    window.settingsManager = new AdvancedSettingsManager();
    console.log('Advanced Settings Manager initialized successfully');
    
    // Show success message
    setTimeout(() => {
      if (window.showToast) {
        window.showToast('Advanced settings loaded successfully!', 'success');
      } else {
        console.log('Advanced Settings initialized successfully!');
      }
    }, 500);
    
  } catch (error) {
    console.error('Error initializing Advanced Settings:', error);
    
    // Show error message to user
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 9999;
    `;
    errorMsg.textContent = 'Error loading advanced settings. Please refresh the page.';
    document.body.appendChild(errorMsg);
    
    setTimeout(() => {
      document.body.removeChild(errorMsg);
    }, 5000);
  }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedSettingsManager;
}
