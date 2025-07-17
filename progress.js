// Firebase Configuration with updated initialization order
const firebaseConfig = {
  apiKey: "AIzaSyBXfS_GcFHYa6GV1GkE2h1V1gZY_YGnuLY",
  authDomain: "al-tawfiq-school.firebaseapp.com",
  databaseURL: "https://al-tawfiq-school-default-rtdb.firebaseio.com",
  projectId: "al-tawfiq-school",
  storageBucket: "al-tawfiq-school.appspot.com",
  messagingSenderId: "850120655020",
  appId: "1:850120655020:web:5e46fcdffabea66dc94f9b"
};

// Global variables - will be initialized after iOS compatibility setup
let db;

// iOS Compatibility System for Progress Page
const iOSCompatibilityProgress = {
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
    console.log('🍎 Initializing iOS compatibility for Progress...');
    
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
    
    console.log('✅ iOS compatibility initialization complete for Progress');
  },
  
  applyIOSFixes: function() {
    this.fixViewport();
    this.addIOSStyles();
    this.fixTouchEvents();
    this.fixFirebaseForIOS();
    this.fixCalendarForIOS();
    this.fixChartsForIOS();
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
      
      .progress-card, .stats-card {
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
      .container, .calendar-container {
        -webkit-overflow-scrolling: touch;
      }
      
      /* iOS button fixes */
      button, .btn {
        -webkit-appearance: none;
        border-radius: 8px;
      }
      
      /* iOS progress bar enhancements */
      .progress-bar {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
      
      /* iOS calendar fixes */
      .calendar-grid {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      }
      
      .calendar-day {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
    `;
    document.head.appendChild(style);
  },
  
  fixTouchEvents: function() {
    console.log('👆 Fixing touch events for iOS...');
    
    // Enhanced touch handling for progress items
    document.addEventListener('DOMContentLoaded', () => {
      const addTouchSupport = () => {
        const items = document.querySelectorAll('.progress-card, .stats-card, .calendar-day, button');
        items.forEach(item => {
          item.addEventListener('touchstart', function(e) {
            this.style.opacity = '0.7';
          }, { passive: true });
          
          item.addEventListener('touchend', function(e) {
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
    
    const testRef = db.ref('.info/connected');
    testRef.on('value', (snapshot) => {
      if (snapshot.val() === true) {
        console.log('✅ Firebase connected successfully');
      } else {
        console.log('❌ Firebase connection lost');
        this.showIOSError('Connection lost. Please check your internet connection.');
      }
    });
  },
  
  fixCalendarForIOS: function() {
    console.log('📅 Fixing calendar for iOS...');
    
    // Enhanced calendar touch handling
    document.addEventListener('DOMContentLoaded', () => {
      const handleCalendarTouch = () => {
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
          day.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.95)';
            this.style.backgroundColor = '#e8e8e8';
          }, { passive: true });
          
          day.addEventListener('touchend', function(e) {
            this.style.transform = 'scale(1)';
            this.style.backgroundColor = '';
          }, { passive: true });
        });
      };
      
      // Apply calendar touch support
      handleCalendarTouch();
      
      // Observer for calendar updates
      const observer = new MutationObserver(handleCalendarTouch);
      const calendarContainer = document.querySelector('.calendar-container');
      if (calendarContainer) {
        observer.observe(calendarContainer, { childList: true, subtree: true });
      }
    });
  },
  
  fixChartsForIOS: function() {
    console.log('📊 Fixing charts for iOS...');
    
    // Enhanced chart rendering for iOS
    const style = document.createElement('style');
    style.textContent = `
      .chart-container {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
      
      .progress-circle {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      }
      
      .progress-bar-fill {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
    `;
    document.head.appendChild(style);
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
        .progress-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .progress-card, .stats-card {
          padding: 16px;
        }
        
        .calendar-grid {
          font-size: 14px;
        }
      }
      
      @media (max-width: 480px) {
        .container {
          padding: 16px;
        }
        
        .stats-grid {
          grid-template-columns: 1fr;
        }
        
        .progress-card, .stats-card {
          padding: 12px;
        }
        
        .calendar-day {
          padding: 8px;
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Enhanced touch feedback
    document.addEventListener('touchstart', function(e) {
      const target = e.target;
      if (target.classList.contains('progress-card') || 
          target.classList.contains('stats-card') || 
          target.classList.contains('calendar-day') || 
          target.tagName === 'BUTTON') {
        target.style.opacity = '0.7';
      }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
      const target = e.target;
      if (target.classList.contains('progress-card') || 
          target.classList.contains('stats-card') || 
          target.classList.contains('calendar-day') || 
          target.tagName === 'BUTTON') {
        target.style.opacity = '1';
      }
    }, { passive: true });
  },

  shareError: function(errorDetails) {
    if (this.deviceInfo.isIOS && navigator.share) {
      const errorText = `Progress Error Report:\n\n${errorDetails}\n\nDevice: ${this.deviceInfo.userAgent}\nScreen: ${this.deviceInfo.screenDimensions}\nStandalone: ${this.deviceInfo.isStandalone}`;
      
      navigator.share({
        title: 'Progress Error Report',
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
  console.log('🚀 DOM loaded, initializing iOS compatibility for Progress first...');
  iOSCompatibilityProgress.init();
  
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
let userProgress = {};
let unitsData = {};
let advancedFeatures = null;
let currentCalendarDate = new Date();

// Initialize progress page
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    
    // Initialize Advanced Features
    if (typeof AdvancedFeatures !== 'undefined') {
      advancedFeatures = new AdvancedFeatures();
      advancedFeatures.applyFeatures();
    }
    
    loadProgress();
  } else {
    Navigation.goToLogin();
  }
});

function loadProgress() {
  const userId = currentUser.uid;
  
  // Load user progress data from Firebase
  db.ref('progress/' + userId).once('value')
    .then(snapshot => {
      userProgress = snapshot.val() || {};
      return db.ref('units').once('value');
    })
    .then(snapshot => {
      unitsData = snapshot.val() || {};
      displayProgress();
      generateCalendar();
      setupCalendarControls();
      checkAchievements();
    })
    .catch(error => {
      console.error('Error loading progress:', error);
      NotificationManager.showToast('Error loading progress data');
    });
}

function displayProgress() {
  let totalLessons = 0;
  let completedLessons = 0;
  
  // Calculate overall statistics
  Object.keys(unitsData).forEach(unitId => {
    const unit = unitsData[unitId];
    
    // Count lessons directly under unit (not under unit.lessons)
    Object.keys(unit).forEach(key => {
      const item = unit[key];
      // Check if this is a lesson (has videoURL or videoFile)
      if (item && typeof item === 'object' && (item.videoURL || item.videoFile)) {
        totalLessons++;
        // Check if this lesson is completed
        if (userProgress[unitId] && userProgress[unitId][key] && userProgress[unitId][key].completed) {
          completedLessons++;
        }
      }
    });
  });

  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  // Update overall stats
  document.getElementById('total-lessons').textContent = totalLessons;
  document.getElementById('completed-lessons').textContent = completedLessons;
  document.getElementById('completion-percentage').textContent = completionPercentage + '%';
  
  // Calculate and display streak
  const streak = calculateStreak();
  document.getElementById('study-streak').textContent = streak;

  // Display unit progress
  displayUnitProgress();
}

function displayUnitProgress() {
  const container = document.getElementById('units-progress');
  container.innerHTML = '';

  Object.keys(unitsData).forEach(unitId => {
    const unit = unitsData[unitId];
    
    // Count lessons directly under unit
    const lessonKeys = Object.keys(unit).filter(key => {
      const item = unit[key];
      return item && typeof item === 'object' && (item.videoURL || item.videoFile);
    });
    
    if (lessonKeys.length === 0) return; // Skip if no lessons

    const unitDiv = document.createElement('div');
    unitDiv.className = 'unit-progress';

    let unitTotalLessons = lessonKeys.length;
    let unitCompletedLessons = 0;

    // Count completed lessons in this unit
    lessonKeys.forEach(lessonId => {
      if (userProgress[unitId] && userProgress[unitId][lessonId] && userProgress[unitId][lessonId].completed) {
        unitCompletedLessons++;
      }
    });

    const unitPercentage = Math.round((unitCompletedLessons / unitTotalLessons) * 100);

    unitDiv.innerHTML = `
      <div class="unit-header">
        <div class="unit-name">${unitId}</div>
        <div class="unit-percentage">${unitCompletedLessons}/${unitTotalLessons} (${unitPercentage}%)</div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${unitPercentage}%"></div>
      </div>
      <div class="lesson-list" id="lessons-${unitId}"></div>
    `;

    container.appendChild(unitDiv);

    // Add lesson details
    const lessonsList = document.getElementById(`lessons-${unitId}`);
    lessonKeys.forEach(lessonId => {
      const lesson = unit[lessonId];
      const isCompleted = userProgress[unitId] && userProgress[unitId][lessonId] && userProgress[unitId][lessonId].completed;
      
      const lessonDiv = document.createElement('div');
      lessonDiv.className = 'lesson-item';
      lessonDiv.innerHTML = `
        <span class="material-icons lesson-status ${isCompleted ? '' : 'incomplete'}">
          ${isCompleted ? 'check_circle' : 'radio_button_unchecked'}
        </span>
        <span class="lesson-name">${lessonId}</span>
      `;
      
      lessonsList.appendChild(lessonDiv);
    });
  });
}

function calculateStreak() {
  if (!userProgress.lastStudyDates) return 0;
  
  const dates = userProgress.lastStudyDates.sort().reverse();
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < dates.length; i++) {
    const studyDate = new Date(dates[i]);
    studyDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate - studyDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

function checkAchievements() {
  const completedLessons = Object.values(userProgress).reduce((total, unit) => {
    if (typeof unit === 'object' && unit !== null) {
      return total + Object.keys(unit).filter(key => key !== 'lastStudyDates').length;
    }
    return total;
  }, 0);

  const totalUnits = Object.keys(unitsData).length;
  const completedUnits = Object.keys(unitsData).filter(unitId => {
    const unit = unitsData[unitId];
    if (!unit.lessons) return false;
    
    const unitLessonCount = Object.keys(unit.lessons).length;
    const completedInUnit = userProgress[unitId] ? Object.keys(userProgress[unitId]).filter(key => key !== 'lastStudyDates').length : 0;
    
    return completedInUnit >= unitLessonCount;
  }).length;

  const streak = calculateStreak();

  // Check and update achievements
  updateAchievement('first-lesson', completedLessons >= 1);
  updateAchievement('unit-complete', completedUnits >= 1);
  updateAchievement('streak-week', streak >= 7);
  updateAchievement('streak-month', streak >= 30);
  updateAchievement('speedster', checkDailyCompletions() >= 5);
  updateAchievement('completionist', completedLessons >= Object.keys(unitsData).reduce((total, unitId) => {
    const unit = unitsData[unitId];
    return total + (unit.lessons ? Object.keys(unit.lessons).length : 0);
  }, 0));
}

function checkDailyCompletions() {
  // This would need to track completion timestamps to work properly
  // For now, return 0
  return 0;
}

// Calendar Functions
function generateCalendar() {
  const calendar = document.getElementById('study-calendar');
  if (!calendar) return;
  
  calendar.innerHTML = '';
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // Update month header
  const monthHeader = document.getElementById('calendar-month');
  if (monthHeader) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    monthHeader.textContent = `${monthNames[month]} ${year}`;
  }
  
  // Add day headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day header';
    dayHeader.textContent = day;
    calendar.appendChild(dayHeader);
  });
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day other-month';
    calendar.appendChild(emptyDay);
  }
  
  // Add days of the month
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    // Check if this day has study activity
    const dateString = new Date(year, month, day).toDateString();
    const hasActivity = advancedFeatures ? advancedFeatures.hasStudyActivity(dateString) : false;
    
    if (hasActivity) {
      dayElement.classList.add('has-activity');
    }
    
    // Mark today
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayElement.classList.add('today');
    }
    
    calendar.appendChild(dayElement);
  }
}

function setupCalendarControls() {
  const prevButton = document.getElementById('prev-month');
  const nextButton = document.getElementById('next-month');
  
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      generateCalendar();
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      generateCalendar();
    });
  }
}

function updateAchievement(achievementId, isEarned) {
  const achievementCard = document.getElementById(achievementId);
  const icon = achievementCard.querySelector('.achievement-icon');
  
  if (isEarned) {
    achievementCard.classList.add('earned');
    icon.classList.remove('locked');
    icon.classList.add('earned');
  }
}

function goBack() {
  Navigation.goToMainPage();
}

// Function to mark lesson as completed (to be called from other pages)
window.markLessonCompleted = function(unitId, lessonId) {
  if (!currentUser) return;
  
  const userId = currentUser.uid;
  const today = new Date().toISOString().split('T')[0];
  
  // Mark lesson as completed
  db.ref(`progress/${userId}/${unitId}/${lessonId}`).set({
    completed: true,
    completedDate: today,
    timestamp: Date.now()
  });
  
  // Update last study dates for streak calculation
  db.ref(`progress/${userId}/lastStudyDates`).once('value')
    .then(snapshot => {
      let dates = snapshot.val() || [];
      if (!dates.includes(today)) {
        dates.push(today);
        db.ref(`progress/${userId}/lastStudyDates`).set(dates);
      }
    });
};
