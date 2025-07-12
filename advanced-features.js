// Advanced Features Manager
// Version: 1.0.0

class AdvancedFeatures {
  constructor() {
    this.init();
  }

  init() {
    console.log('Advanced Features Manager initialized');
    this.initSearchFilters();
    this.initLanguageSupport();
    this.initPlayerThemes();
    this.initAccessibility();
    this.initLayoutPreferences();
    this.initGoalSetting();
    this.initStudyCalendar();
    this.initAnalytics();
    this.initLearningPath();
  }

  // 1. Advanced Search Filters
  initSearchFilters() {
    this.searchFilters = {
      difficulty: 'all', // all, beginner, intermediate, advanced
      duration: 'all',   // all, short, medium, long
      topic: 'all',      // all, or specific topics
      searchTerm: ''
    };
  }

  filterLessons(lessons, filters = this.searchFilters) {
    return lessons.filter(lesson => {
      // Filter by search term
      if (filters.searchTerm && !lesson.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by difficulty
      if (filters.difficulty !== 'all' && lesson.difficulty !== filters.difficulty) {
        return false;
      }
      
      // Filter by duration
      if (filters.duration !== 'all') {
        const duration = lesson.duration || 0;
        if (filters.duration === 'short' && duration > 300) return false;
        if (filters.duration === 'medium' && (duration <= 300 || duration > 900)) return false;
        if (filters.duration === 'long' && duration <= 900) return false;
      }
      
      // Filter by topic
      if (filters.topic !== 'all' && lesson.topic !== filters.topic) {
        return false;
      }
      
      return true;
    });
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
  }

  translate(key) {
    return this.translations[this.currentLanguage][key] || key;
  }

  setLanguage(language) {
    this.currentLanguage = language;
    localStorage.setItem('preferredLanguage', language);
    this.updateUITexts();
  }

  updateUITexts() {
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
    
    const lessonsGrid = document.querySelector('.lessons-grid');
    if (lessonsGrid) {
      lessonsGrid.style.gridTemplateColumns = `repeat(${this.layoutOptions[layout].columns}, 1fr)`;
    }
    
    this.currentLayout = layout;
    localStorage.setItem('layoutPreference', layout);
  }

  // 6. Goal Setting
  initGoalSetting() {
    this.goals = JSON.parse(localStorage.getItem('studyGoals')) || {
      daily: {
        lessons: 3,
        minutes: 30
      },
      weekly: {
        lessons: 20,
        minutes: 210
      }
    };
  }

  setGoal(type, metric, value) {
    if (!this.goals[type]) this.goals[type] = {};
    this.goals[type][metric] = value;
    localStorage.setItem('studyGoals', JSON.stringify(this.goals));
  }

  getGoalProgress(type, metric) {
    const today = new Date().toDateString();
    const thisWeek = this.getWeekKey(new Date());
    
    const progress = JSON.parse(localStorage.getItem('studyProgress')) || {};
    
    if (type === 'daily') {
      return progress[today] ? progress[today][metric] || 0 : 0;
    } else if (type === 'weekly') {
      return progress[thisWeek] ? progress[thisWeek][metric] || 0 : 0;
    }
    
    return 0;
  }

  updateProgress(metric, value) {
    const today = new Date().toDateString();
    const thisWeek = this.getWeekKey(new Date());
    
    const progress = JSON.parse(localStorage.getItem('studyProgress')) || {};
    
    // Update daily progress
    if (!progress[today]) progress[today] = {};
    progress[today][metric] = (progress[today][metric] || 0) + value;
    
    // Update weekly progress
    if (!progress[thisWeek]) progress[thisWeek] = {};
    progress[thisWeek][metric] = (progress[thisWeek][metric] || 0) + value;
    
    localStorage.setItem('studyProgress', JSON.stringify(progress));
  }

  getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + 1) / 7);
    return `${year}-W${week}`;
  }

  // 7. Study Calendar
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

  // 8. Detailed Analytics
  initAnalytics() {
    this.analytics = JSON.parse(localStorage.getItem('detailedAnalytics')) || {};
  }

  recordAnalytics(lessonKey, unitName, event, data = {}) {
    const today = new Date().toDateString();
    
    if (!this.analytics[today]) {
      this.analytics[today] = {};
    }
    
    const sessionKey = `${unitName}-${lessonKey}`;
    
    if (!this.analytics[today][sessionKey]) {
      this.analytics[today][sessionKey] = {
        lesson: lessonKey,
        unit: unitName,
        events: []
      };
    }
    
    this.analytics[today][sessionKey].events.push({
      event: event,
      timestamp: Date.now(),
      data: data
    });
    
    localStorage.setItem('detailedAnalytics', JSON.stringify(this.analytics));
  }

  getAnalyticsSummary() {
    const summary = {
      totalTime: 0,
      totalLessons: 0,
      averageSessionTime: 0,
      completionRate: 0,
      viewingPatterns: {},
      topUnits: {},
      dailyStreaks: []
    };
    
    Object.keys(this.analytics).forEach(date => {
      const dayData = this.analytics[date];
      Object.keys(dayData).forEach(sessionKey => {
        const session = dayData[sessionKey];
        const watchEvents = session.events.filter(e => e.event === 'watch');
        const completeEvents = session.events.filter(e => e.event === 'complete');
        
        if (watchEvents.length > 0) {
          summary.totalLessons++;
          
          // Calculate time spent
          const timeSpent = watchEvents.reduce((sum, event) => {
            return sum + (event.data.duration || 0);
          }, 0);
          
          summary.totalTime += timeSpent;
          
          // Track completion
          if (completeEvents.length > 0) {
            summary.completionRate++;
          }
          
          // Track units
          summary.topUnits[session.unit] = (summary.topUnits[session.unit] || 0) + 1;
        }
      });
    });
    
    if (summary.totalLessons > 0) {
      summary.averageSessionTime = summary.totalTime / summary.totalLessons;
      summary.completionRate = (summary.completionRate / summary.totalLessons) * 100;
    }
    
    return summary;
  }

  // 9. Learning Path Recommendations
  initLearningPath() {
    this.learningProgress = JSON.parse(localStorage.getItem('learningProgress')) || {};
  }

  updateLearningProgress(unitName, lessonKey, status) {
    if (!this.learningProgress[unitName]) {
      this.learningProgress[unitName] = {};
    }
    
    this.learningProgress[unitName][lessonKey] = {
      status: status, // 'started', 'completed', 'in_progress'
      timestamp: Date.now(),
      lastWatched: Date.now()
    };
    
    localStorage.setItem('learningProgress', JSON.stringify(this.learningProgress));
  }

  getRecommendations(currentUnit, currentLesson) {
    const recommendations = [];
    
    // Get current unit progress
    const unitProgress = this.learningProgress[currentUnit] || {};
    
    // Find next lesson in same unit
    const lessonNumbers = Object.keys(unitProgress)
      .filter(lesson => lesson.startsWith('lesson-'))
      .map(lesson => parseInt(lesson.split('-')[1]))
      .sort((a, b) => a - b);
    
    if (lessonNumbers.length > 0) {
      const lastLessonNum = Math.max(...lessonNumbers);
      const nextLessonKey = `lesson-${lastLessonNum + 1}`;
      
      recommendations.push({
        type: 'next_in_unit',
        unit: currentUnit,
        lesson: nextLessonKey,
        reason: 'Continue your learning path in this unit',
        priority: 1
      });
    }
    
    // Find similar units with progress
    const allUnits = Object.keys(this.learningProgress);
    const similarUnits = allUnits.filter(unit => {
      const progress = this.learningProgress[unit];
      const completedLessons = Object.keys(progress).filter(lesson => 
        progress[lesson].status === 'completed'
      ).length;
      
      return completedLessons > 0 && unit !== currentUnit;
    });
    
    // Recommend based on recent activity
    const recentActivity = [];
    allUnits.forEach(unit => {
      const progress = this.learningProgress[unit];
      Object.keys(progress).forEach(lesson => {
        recentActivity.push({
          unit: unit,
          lesson: lesson,
          timestamp: progress[lesson].lastWatched
        });
      });
    });
    
    recentActivity.sort((a, b) => b.timestamp - a.timestamp);
    
    if (recentActivity.length > 1) {
      const recentUnit = recentActivity[0].unit;
      if (recentUnit !== currentUnit) {
        recommendations.push({
          type: 'continue_recent',
          unit: recentUnit,
          lesson: recentActivity[0].lesson,
          reason: 'Continue where you left off',
          priority: 2
        });
      }
    }
    
    return recommendations.sort((a, b) => a.priority - b.priority);
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
}

// Initialize Advanced Features
window.AdvancedFeatures = new AdvancedFeatures();
