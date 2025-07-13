// Advanced Settings JavaScript - V4.1.0
// Handles all advanced features settings and UI interactions

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
