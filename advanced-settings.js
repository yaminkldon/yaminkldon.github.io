// Advanced Settings JavaScript - V2.0
// Handles all advanced features settings and UI interactions

class AdvancedSettingsManager {
  constructor() {
    this.advancedFeatures = new AdvancedFeatures();
    this.init();
  }

  init() {
    this.loadCurrentSettings();
    this.setupEventListeners();
    this.generateCalendar();
    this.updateAnalytics();
    this.updateGoalProgress();
    this.loadRecommendations();
    this.updateLanguageDisplay();
  }

  loadCurrentSettings() {
    // Load current language
    const currentLanguage = this.advancedFeatures.getCurrentLanguage();
    document.getElementById(`lang-${currentLanguage}`).classList.add('active');

    // Load current theme
    const currentTheme = this.advancedFeatures.getCurrentTheme();
    document.getElementById(`theme-${currentTheme}`).classList.add('active');

    // Load current font size
    const currentFontSize = this.advancedFeatures.getCurrentFontSize();
    document.getElementById(`font-${currentFontSize}`).classList.add('active');

    // Load current layout
    const currentLayout = this.advancedFeatures.getCurrentLayout();
    document.getElementById(`layout-${currentLayout}`).classList.add('active');

    // Load goals
    const goals = this.advancedFeatures.getGoals();
    document.getElementById('daily-lessons').value = goals.daily.lessons;
    document.getElementById('daily-minutes').value = goals.daily.minutes;
    document.getElementById('weekly-lessons').value = goals.weekly.lessons;
    document.getElementById('weekly-minutes').value = goals.weekly.minutes;

    // Load search filters
    const filters = this.advancedFeatures.getSearchFilters();
    document.getElementById('difficulty-filter').value = filters.difficulty;
    document.getElementById('duration-filter').value = filters.duration;
    document.getElementById('topic-filter').value = filters.topic;

    // Apply dark mode if enabled
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }

    // Apply font size
    this.applyFontSize(currentFontSize);
  }

  setupEventListeners() {
    // Search filter listeners
    document.getElementById('difficulty-filter').addEventListener('change', (e) => {
      this.advancedFeatures.setSearchFilter('difficulty', e.target.value);
    });

    document.getElementById('duration-filter').addEventListener('change', (e) => {
      this.advancedFeatures.setSearchFilter('duration', e.target.value);
    });

    document.getElementById('topic-filter').addEventListener('change', (e) => {
      this.advancedFeatures.setSearchFilter('topic', e.target.value);
    });

    // Goal input listeners
    document.getElementById('daily-lessons').addEventListener('input', (e) => {
      this.advancedFeatures.setGoal('daily', 'lessons', parseInt(e.target.value));
      this.updateGoalProgress();
    });

    document.getElementById('daily-minutes').addEventListener('input', (e) => {
      this.advancedFeatures.setGoal('daily', 'minutes', parseInt(e.target.value));
      this.updateGoalProgress();
    });

    document.getElementById('weekly-lessons').addEventListener('input', (e) => {
      this.advancedFeatures.setGoal('weekly', 'lessons', parseInt(e.target.value));
      this.updateGoalProgress();
    });

    document.getElementById('weekly-minutes').addEventListener('input', (e) => {
      this.advancedFeatures.setGoal('weekly', 'minutes', parseInt(e.target.value));
      this.updateGoalProgress();
    });

    // Real-time analytics update
    setInterval(() => {
      this.updateAnalytics();
      this.updateGoalProgress();
    }, 30000); // Update every 30 seconds
  }

  generateCalendar() {
    const calendar = document.getElementById('study-calendar');
    calendar.innerHTML = '';

    // Generate calendar for current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day';
      dayHeader.textContent = day;
      dayHeader.style.fontWeight = 'bold';
      dayHeader.style.color = '#6c4fc1';
      calendar.appendChild(dayHeader);
    });

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day';
      calendar.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day;

      // Check if this day has study activity
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasActivity = this.advancedFeatures.hasStudyActivity(dateKey);
      
      if (hasActivity) {
        dayElement.classList.add('has-activity');
      }

      // Mark today
      if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
        dayElement.classList.add('today');
      }

      calendar.appendChild(dayElement);
    }
  }

  updateAnalytics() {
    const analytics = this.advancedFeatures.getAnalytics();
    
    // Update total time
    const totalMinutes = analytics.totalTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    document.getElementById('total-time').textContent = `${hours}h ${minutes}m`;

    // Update lessons completed
    document.getElementById('total-lessons').textContent = analytics.lessonsCompleted;

    // Update average session
    document.getElementById('average-session').textContent = `${analytics.averageSession}m`;

    // Update completion rate
    document.getElementById('completion-rate').textContent = `${Math.round(analytics.completionRate)}%`;
  }

  updateGoalProgress() {
    const goals = this.advancedFeatures.getGoals();
    const progress = this.advancedFeatures.getGoalProgress();

    // Update daily progress
    const dailyLessonsProgress = (progress.daily.lessons / goals.daily.lessons) * 100;
    document.getElementById('daily-progress').style.width = `${Math.min(dailyLessonsProgress, 100)}%`;
    document.getElementById('daily-status').textContent = `${progress.daily.lessons} / ${goals.daily.lessons} lessons completed today`;

    // Update weekly progress
    const weeklyLessonsProgress = (progress.weekly.lessons / goals.weekly.lessons) * 100;
    document.getElementById('weekly-progress').style.width = `${Math.min(weeklyLessonsProgress, 100)}%`;
    document.getElementById('weekly-status').textContent = `${progress.weekly.lessons} / ${goals.weekly.lessons} lessons completed this week`;
  }

  loadRecommendations() {
    const recommendations = this.advancedFeatures.getRecommendations();
    const container = document.getElementById('recommendations-list');
    container.innerHTML = '';

    recommendations.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'recommendation-item';
      item.innerHTML = `
        <div class="recommendation-title">${rec.title}</div>
        <div class="recommendation-description">${rec.description}</div>
      `;
      container.appendChild(item);
    });
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

  applyFontSize(size) {
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };

    document.documentElement.style.setProperty('--base-font-size', fontSizes[size]);
  }

  addDemoData() {
    // Add some demo analytics data if none exists
    const analytics = this.advancedFeatures.getAnalytics();
    if (analytics.totalTime === 0) {
      // Add demo session data
      const demoSessions = [
        { date: '2024-01-15', duration: 25, lessonsCompleted: 3 },
        { date: '2024-01-16', duration: 30, lessonsCompleted: 4 },
        { date: '2024-01-17', duration: 20, lessonsCompleted: 2 },
        { date: '2024-01-18', duration: 35, lessonsCompleted: 5 },
        { date: '2024-01-19', duration: 40, lessonsCompleted: 6 }
      ];

      demoSessions.forEach(session => {
        this.advancedFeatures.trackStudySession(session.duration, session.lessonsCompleted, session.date);
      });

      // Refresh displays
      this.updateAnalytics();
      this.updateGoalProgress();
      this.generateCalendar();
    }
  }
}

// Global functions for UI interactions
function goBack() {
  window.history.back();
}

function setLanguage(lang) {
  // Remove active class from all language buttons
  document.querySelectorAll('[id^="lang-"]').forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected language
  document.getElementById(`lang-${lang}`).classList.add('active');
  
  // Update language in advanced features
  window.settingsManager.advancedFeatures.setLanguage(lang);
  
  // Update display
  window.settingsManager.updateLanguageDisplay();
}

function setTheme(theme) {
  // Remove active class from all theme buttons
  document.querySelectorAll('[id^="theme-"]').forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected theme
  document.getElementById(`theme-${theme}`).classList.add('active');
  
  // Apply theme
  window.settingsManager.advancedFeatures.setTheme(theme);
  
  // Update body class for dark mode
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

function setFontSize(size) {
  // Remove active class from all font size buttons
  document.querySelectorAll('[id^="font-"]').forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected font size
  document.getElementById(`font-${size}`).classList.add('active');
  
  // Apply font size
  window.settingsManager.advancedFeatures.setFontSize(size);
  window.settingsManager.applyFontSize(size);
}

function setLayout(layout) {
  // Remove active class from all layout buttons
  document.querySelectorAll('[id^="layout-"]').forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected layout
  document.getElementById(`layout-${layout}`).classList.add('active');
  
  // Apply layout
  window.settingsManager.advancedFeatures.setLayout(layout);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.settingsManager = new AdvancedSettingsManager();
  
  // Show success message
  setTimeout(() => {
    if (window.showToast) {
      window.showToast('Advanced settings loaded successfully!', 'success');
    } else {
      console.log('Advanced Settings initialized successfully!');
    }
    
    // Add demo data if none exists
    window.settingsManager.addDemoData();
  }, 500);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedSettingsManager;
}
