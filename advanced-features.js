// Advanced Features Manager
// Version: 1.0.0

class AdvancedFeatures {
  constructor() {
    this.init();
  }

  init() {
    console.log('Advanced Features Manager initialized');
    this.initLanguageSupport();
    this.initPlayerThemes();
    this.initAccessibility();
    this.initLayoutPreferences();
    this.initStudyCalendar();
  }

  // 2. Multi-language Support
  initLanguageSupport() {
    this.currentLanguage = localStorage.getItem('preferredLanguage') || 'en';
    this.translations = {
      en: {
        home: 'Home',
        settings: 'Settings',
        progress: 'Progress',
        search: 'Search',
        difficulty: 'Difficulty',
        duration: 'Duration',
        topic: 'Topic',
        all: 'All',
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        short: 'Short (< 5 min)',
        medium: 'Medium (5-15 min)',
        long: 'Long (> 15 min)',
        goals: 'Goals',
        calendar: 'Calendar',
        analytics: 'Analytics',
        recommendations: 'Recommendations',
        dailyGoal: 'Daily Goal',
        weeklyGoal: 'Weekly Goal',
        studyTime: 'Study Time',
        lessonsCompleted: 'Lessons Completed',
        currentStreak: 'Current Streak',
        totalTime: 'Total Time',
        averageSession: 'Average Session',
        completionRate: 'Completion Rate'
      },
      ar: {
        home: 'الرئيسية',
        settings: 'الإعدادات',
        progress: 'التقدم',
        search: 'البحث',
        difficulty: 'الصعوبة',
        duration: 'المدة',
        topic: 'الموضوع',
        all: 'الكل',
        beginner: 'مبتدئ',
        intermediate: 'متوسط',
        advanced: 'متقدم',
        short: 'قصير (< 5 دقائق)',
        medium: 'متوسط (5-15 دقيقة)',
        long: 'طويل (> 15 دقيقة)',
        goals: 'الأهداف',
        calendar: 'التقويم',
        analytics: 'التحليلات',
        recommendations: 'التوصيات',
        dailyGoal: 'الهدف اليومي',
        weeklyGoal: 'الهدف الأسبوعي',
        studyTime: 'وقت الدراسة',
        lessonsCompleted: 'الدروس المكتملة',
        currentStreak: 'السلسلة الحالية',
        totalTime: 'الوقت الإجمالي',
        averageSession: 'متوسط الجلسة',
        completionRate: 'معدل الإكمال'
      }
    };
    
    // Apply current language settings
    this.updateUITexts();
  }

  translate(key) {
    return this.translations[this.currentLanguage][key] || key;
  }

  updateUITexts() {
    // Update document direction and language
    if (this.currentLanguage === 'ar') {
      document.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
    
    // Update all UI elements with new language
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      element.textContent = this.translate(key);
    });
  }

  // 3. Video Player Themes
  initPlayerThemes() {
    this.playerThemes = {
      default: {
        name: 'Default',
        colors: {
          primary: '#6c4fc1',
          background: 'rgba(0,0,0,0.8)',
          text: '#ffffff',
          accent: '#8a66d9'
        }
      },
      dark: {
        name: 'Dark',
        colors: {
          primary: '#bb86fc',
          background: 'rgba(18,18,18,0.9)',
          text: '#e0e0e0',
          accent: '#cf6679'
        }
      },
      blue: {
        name: 'Ocean Blue',
        colors: {
          primary: '#2196f3',
          background: 'rgba(13,71,161,0.8)',
          text: '#ffffff',
          accent: '#64b5f6'
        }
      },
      green: {
        name: 'Forest Green',
        colors: {
          primary: '#4caf50',
          background: 'rgba(27,94,32,0.8)',
          text: '#ffffff',
          accent: '#81c784'
        }
      }
    };
    
    this.currentTheme = localStorage.getItem('playerTheme') || 'default';
  }

  applyPlayerTheme(themeName) {
    const theme = this.playerThemes[themeName];
    if (!theme) return;
    
    const root = document.documentElement;
    root.style.setProperty('--player-primary', theme.colors.primary);
    root.style.setProperty('--player-background', theme.colors.background);
    root.style.setProperty('--player-text', theme.colors.text);
    root.style.setProperty('--player-accent', theme.colors.accent);
    
    this.currentTheme = themeName;
    localStorage.setItem('playerTheme', themeName);
  }

  // 4. Accessibility (Font Size Options)
  initAccessibility() {
    this.fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    
    this.currentFontSize = localStorage.getItem('fontSize') || 'medium';
    this.applyFontSize(this.currentFontSize);
  }

  applyFontSize(size) {
    if (!this.fontSizes[size]) return;
    
    document.documentElement.style.setProperty('--base-font-size', this.fontSizes[size]);
    this.currentFontSize = size;
    localStorage.setItem('fontSize', size);
  }

  // 5. Layout Preferences
  initLayoutPreferences() {
    this.layoutOptions = {
      '2x2': { columns: 2, name: '2x2 Grid' },
      '3x3': { columns: 3, name: '3x3 Grid' },
      '4x4': { columns: 4, name: '4x4 Grid' }
    };
    
    this.currentLayout = localStorage.getItem('layoutPreference') || '3x3';
  }

  applyLayout(layout) {
    if (!this.layoutOptions[layout]) return;
    
    const lessonsGrid = document.querySelector('.lessons-grid, .lesson-grid');
    if (lessonsGrid) {
      // Remove existing layout classes
      lessonsGrid.classList.remove('grid-2x2', 'grid-3x3', 'grid-4x4');
      
      // Add new layout class
      lessonsGrid.classList.add(`grid-${layout}`);
      
      // Also apply direct grid-template-columns as fallback
      lessonsGrid.style.gridTemplateColumns = `repeat(${this.layoutOptions[layout].columns}, 1fr)`;
    }
    
    this.currentLayout = layout;
    localStorage.setItem('layoutPreference', layout);
  }

  // 6. Study Calendar (for progress page)
  initStudyCalendar() {
    this.studySessions = JSON.parse(localStorage.getItem('studySessions')) || {};
  }

  recordStudySession(lessonKey, duration, unitName) {
    const today = new Date().toDateString();
    
    if (!this.studySessions[today]) {
      this.studySessions[today] = [];
    }
    
    this.studySessions[today].push({
      lesson: lessonKey,
      unit: unitName,
      duration: duration,
      timestamp: Date.now()
    });
    
    localStorage.setItem('studySessions', JSON.stringify(this.studySessions));
    
    // Update progress tracking
    this.updateProgress('lessons', 1);
    this.updateProgress('minutes', Math.round(duration / 60));
  }

  getStudyCalendarData() {
    const calendarData = {};
    
    Object.keys(this.studySessions).forEach(date => {
      const sessions = this.studySessions[date];
      calendarData[date] = {
        sessionCount: sessions.length,
        totalDuration: sessions.reduce((sum, session) => sum + session.duration, 0),
        lessons: sessions.map(session => ({
          lesson: session.lesson,
          unit: session.unit,
          duration: session.duration
        }))
      };
    });
    
    return calendarData;
  }

  hasStudyActivity(dateKey) {
    return !!this.studySessions[dateKey];
  }

  trackStudySession(duration, lessonsCompleted, date = null) {
    const sessionDate = date || new Date().toDateString();
    
    // Update study sessions for calendar
    if (!this.studySessions[sessionDate]) {
      this.studySessions[sessionDate] = [];
    }
    
    this.studySessions[sessionDate].push({
      duration: duration * 60, // Convert to seconds
      lessons: lessonsCompleted,
      timestamp: Date.now()
    });
    
    localStorage.setItem('studySessions', JSON.stringify(this.studySessions));
  }

  // Utility Methods
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString(this.currentLanguage === 'ar' ? 'ar-SA' : 'en-US');
  }

  // Getter methods for current settings
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getCurrentFontSize() {
    return this.currentFontSize;
  }

  getCurrentLayout() {
    return this.currentLayout;
  }

  // Setter methods
  setLanguage(language) {
    this.currentLanguage = language;
    localStorage.setItem('preferredLanguage', language);
    this.updateLanguageDisplay();
  }

  setTheme(theme) {
    this.applyPlayerTheme(theme);
  }

  setFontSize(size) {
    this.applyFontSize(size);
  }

  setLayout(layout) {
    this.applyLayout(layout);
  }

  // Additional utility methods
  updateLanguageDisplay() {
    // Update document direction and language
    if (this.currentLanguage === 'ar') {
      document.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
    
    // Update all UI elements with new language
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      element.textContent = this.translate(key);
    });
  }

  // Apply all current features to the page
  applyFeatures() {
    // Apply current theme
    this.applyPlayerTheme(this.getCurrentTheme());
    
    // Apply current font size
    this.applyFontSize(this.getCurrentFontSize());
    
    // Apply current layout
    this.applyLayout(this.getCurrentLayout());
    
    // Update language display
    this.updateLanguageDisplay();
  }

  hasStudyActivity(dateKey) {
    return !!this.studySessions[dateKey];
  }

  trackStudySession(duration, lessonsCompleted, date = null) {
    const sessionDate = date || new Date().toDateString();
    
    // Update study sessions for calendar
    if (!this.studySessions[sessionDate]) {
      this.studySessions[sessionDate] = [];
    }
    
    this.studySessions[sessionDate].push({
      duration: duration * 60, // Convert to seconds
      lessons: lessonsCompleted,
      timestamp: Date.now()
    });
    
    localStorage.setItem('studySessions', JSON.stringify(this.studySessions));
  }
}

// Export the class, don't initialize automatically
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedFeatures;
} else {
  // Make it available globally in the browser
  window.AdvancedFeatures = AdvancedFeatures;
}
