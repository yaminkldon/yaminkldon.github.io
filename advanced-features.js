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
        unitDetail: 'Unit Detail',
        lessons: 'Lessons',
        loading: 'Loading...',
        yourProgress: 'Your Progress',
        overallStatistics: 'Overall Statistics',
        unitProgress: 'Unit Progress',
        studyCalendar: 'Study Calendar',
        achievements: 'Achievements',
        accountInformation: 'Account Information',
        security: 'Security',
        appSettings: 'App Settings',
        accountActions: 'Account Actions',
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
        completionRate: 'Completion Rate',
        totalLessons: 'Total Lessons',
        completed: 'Completed',
        studyDay: 'Study Day',
        today: 'Today',
        firstSteps: 'First Steps',
        firstStepsDesc: 'Complete your first lesson',
        unitMaster: 'Unit Master',
        unitMasterDesc: 'Complete an entire unit',
        email: 'Email',
        deviceId: 'Device ID',
        accountExpires: 'Account Expires',
        changePassword: 'Change Password',
        change: 'Change',
        darkMode: 'Dark Mode',
        notifications: 'Notifications',
        signOut: 'Sign Out',
        deleteAccount: 'Delete Account',
        delete: 'Delete',
        searchLessons: 'Search Lessons',
        advancedSettings: 'Advanced Settings',
        logout: 'Logout',
        searchPlaceholder: 'Search lessons...',
        description: 'Description',
        teacherDashboard: 'Teacher Dashboard',
        welcomeTeacher: 'Welcome, Teacher!',
        dashboardSubtitle: 'Manage your courses, students, and content from here',
        totalStudents: 'Total Students',
        totalUnits: 'Total Units',
        avgProgress: 'Avg Progress',
        userManagement: 'User Management',
        userManagementDesc: 'Add, remove, and manage student accounts. View student progress and analytics.',
        addStudent: 'Add User',
        viewAll: 'View All',
        contentManagement: 'Content Management',
        contentManagementDesc: 'Create and manage units, lessons, and course materials.',
        addUnit: 'Add Unit',
        addLesson: 'Add Lesson',
        analytics: 'Analytics & Reports',
        analyticsDesc: 'View detailed progress reports and student performance analytics.',
        generateReport: 'Generate Report',
        exportData: 'Export Data',
        communication: 'Communication',
        communicationDesc: 'Send announcements and notifications to students.',
        sendNotification: 'Send Notification',
        viewMessages: 'View Messages',
        videoManagement: 'Video Management',
        videoManagementDesc: 'Upload, organize, and manage video content for lessons.',
        uploadVideo: 'Upload Video',
        manageLessons: 'Manage Lessons',
        manageUnits: 'Manage Units',
        editUnit: 'Edit Unit',
        updateUnit: 'Update Unit',
        teacherSettings: 'Teacher Settings',
        teacherSettingsDesc: 'Configure dashboard preferences and account settings.',
        preferences: 'Preferences',
        backup: 'Backup',
        addNewStudent: 'Add New Student',
        password: 'Password',
        deviceId: 'Device ID',
        expirationDate: 'Expiration Date',
        cancel: 'Cancel',
        addNewUnit: 'Add New Unit',
        unitName: 'Unit Name',
        unitOrder: 'Order',
        createUnit: 'Create Unit',
        videoTitle: 'Video Title',
        videoDescription: 'Video Description',
        selectUnit: 'Select Unit',
        videoFile: 'Video File',
        dragDropVideo: 'Drag & drop video file or click to browse',
        videoThumbnail: 'Video Thumbnail (Optional)',
        thumbnailHelp: 'Upload a thumbnail image for the video (optional)',
        userType: 'User Type',
        addUser: 'Add User',
        tokenGeneration: 'Token Generation',
        tokenGenerationDesc: 'Generate access tokens for temporary user authentication.',
        generateToken: 'Generate Token',
        viewTokens: 'View Tokens',
        manageTokens: 'Manage Tokens',
        tokenDuration: 'Token Duration (Days)',
        tokenDurationHelp: 'Enter the number of days this token should remain valid',
        tokenDescription: 'Description (Optional)',
        tokenDescHelp: 'Add a description to help identify this token later',
        addNewUser: 'Add New User',
        // Assessment and Assignment translations
        assessmentManagement: 'Assessment Management',
        assessmentManagementDesc: 'Create quizzes, tests, and assignments with auto-grading capabilities.',
        createQuiz: 'Create Quiz',
        createAssignment: 'Create Assignment',
        viewAssessments: 'View All',
        gradingCenter: 'Grading Center',
        gradingCenterDesc: 'Review and grade student submissions with rubric-based assessment tools.',
        pendingGrades: 'Pending Grades',
        createRubric: 'Create Rubric',
        quizTitle: 'Quiz Title',
        quizDescription: 'Description',
        timeLimit: 'Time Limit (minutes)',
        attempts: 'Max Attempts',
        questions: 'Questions',
        assignmentTitle: 'Assignment Title',
        assignmentDescription: 'Description',
        dueDate: 'Due Date',
        maxPoints: 'Maximum Points',
        submissionType: 'Submission Type',
        allowedFileTypes: 'Allowed File Types',
        gradingRubric: 'Grading Rubric',
        rubricName: 'Rubric Name',
        rubricDescription: 'Description',
        criteria: 'Grading Criteria',
        gradeSubmission: 'Grade Submission',
        saveGrade: 'Save Grade',
        assignments: 'Assignments & Quizzes',
        studentAssignments: 'Student Assignments'
      },
      ar: {
        home: 'الرئيسية',
        settings: 'الإعدادات',
        progress: 'التقدم',
        search: 'البحث',
        unitDetail: 'تفاصيل الوحدة',
        lessons: 'الدروس',
        loading: 'جاري التحميل...',
        yourProgress: 'تقدمك',
        overallStatistics: 'الإحصائيات العامة',
        unitProgress: 'تقدم الوحدة',
        studyCalendar: 'تقويم الدراسة',
        achievements: 'الإنجازات',
        accountInformation: 'معلومات الحساب',
        security: 'الأمان',
        appSettings: 'إعدادات التطبيق',
        accountActions: 'إجراءات الحساب',
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
        completionRate: 'معدل الإكمال',
        totalLessons: 'إجمالي الدروس',
        completed: 'مكتمل',
        studyDay: 'يوم الدراسة',
        today: 'اليوم',
        firstSteps: 'الخطوات الأولى',
        firstStepsDesc: 'أكمل درسك الأول',
        unitMaster: 'سيد الوحدة',
        unitMasterDesc: 'أكمل وحدة كاملة',
        email: 'البريد الإلكتروني',
        deviceId: 'معرف الجهاز',
        accountExpires: 'انتهاء صلاحية الحساب',
        changePassword: 'تغيير كلمة المرور',
        change: 'تغيير',
        darkMode: 'الوضع الداكن',
        notifications: 'الإشعارات',
        signOut: 'تسجيل الخروج',
        deleteAccount: 'حذف الحساب',
        delete: 'حذف',
        searchLessons: 'البحث في الدروس',
        advancedSettings: 'الإعدادات المتقدمة',
        logout: 'تسجيل الخروج',
        searchPlaceholder: 'البحث في الدروس...',
        description: 'الوصف',
        teacherDashboard: 'لوحة تحكم المعلم',
        welcomeTeacher: 'مرحباً، أيها المعلم!',
        dashboardSubtitle: 'إدارة دوراتك والطلاب والمحتوى من هنا',
        totalStudents: 'إجمالي الطلاب',
        totalUnits: 'إجمالي الوحدات',
        avgProgress: 'متوسط التقدم',
        userManagement: 'إدارة المستخدمين',
        userManagementDesc: 'إضافة وإزالة وإدارة حسابات الطلاب. عرض تقدم الطلاب والتحليلات.',
        addStudent: 'إضافة مستخدم',
        viewAll: 'عرض الكل',
        contentManagement: 'إدارة المحتوى',
        contentManagementDesc: 'إنشاء وإدارة الوحدات والدروس والمواد التعليمية.',
        addUnit: 'إضافة وحدة',
        addLesson: 'إضافة درس',
        analytics: 'التحليلات والتقارير',
        analyticsDesc: 'عرض تقارير التقدم التفصيلية وتحليلات أداء الطلاب.',
        generateReport: 'إنشاء تقرير',
        exportData: 'تصدير البيانات',
        communication: 'التواصل',
        communicationDesc: 'إرسال الإعلانات والإشعارات للطلاب.',
        sendNotification: 'إرسال إشعار',
        viewMessages: 'عرض الرسائل',
        videoManagement: 'إدارة الفيديو',
        videoManagementDesc: 'رفع وتنظيم وإدارة محتوى الفيديو للدروس.',
        uploadVideo: 'رفع فيديو',
        manageLessons: 'إدارة الدروس',
        manageUnits: 'إدارة الوحدات',
        editUnit: 'تعديل الوحدة',
        updateUnit: 'تحديث الوحدة',
        teacherSettings: 'إعدادات المعلم',
        teacherSettingsDesc: 'تكوين تفضيلات لوحة التحكم وإعدادات الحساب.',
        preferences: 'التفضيلات',
        backup: 'النسخ الاحتياطي',
        addNewStudent: 'إضافة طالب جديد',
        password: 'كلمة المرور',
        deviceId: 'معرف الجهاز',
        expirationDate: 'تاريخ انتهاء الصلاحية',
        cancel: 'إلغاء',
        addNewUnit: 'إضافة وحدة جديدة',
        unitName: 'اسم الوحدة',
        unitOrder: 'الترتيب',
        createUnit: 'إنشاء وحدة',
        videoTitle: 'عنوان الفيديو',
        videoDescription: 'وصف الفيديو',
        selectUnit: 'اختر وحدة',
        videoFile: 'ملف الفيديو',
        dragDropVideo: 'اسحب وأفلت ملف الفيديو أو انقر للتصفح',
        videoThumbnail: 'صورة مصغرة للفيديو (اختياري)',
        thumbnailHelp: 'إذا لم يتم تحميل صورة مصغرة، فسيتم إنشاء واحدة تلقائيًا',
        userType: 'نوع المستخدم',
        addUser: 'إضافة مستخدم',
        tokenGeneration: 'إنشاء الرموز',
        tokenGenerationDesc: 'إنشاء رموز الوصول للمصادقة المؤقتة للمستخدمين.',
        generateToken: 'إنشاء رمز',
        viewTokens: 'عرض الرموز',
        manageTokens: 'إدارة الرموز',
        tokenDuration: 'مدة الرمز (بالأيام)',
        tokenDurationHelp: 'أدخل عدد الأيام التي يجب أن يبقى فيها هذا الرمز صالحًا',
        tokenDescription: 'الوصف (اختياري)',
        tokenDescHelp: 'أضف وصفًا للمساعدة في تحديد هذا الرمز لاحقًا',
        addNewUser: 'إضافة مستخدم جديد',
        // Assessment and Assignment translations
        assessmentManagement: 'إدارة التقييمات',
        assessmentManagementDesc: 'إنشاء الاختبارات والامتحانات والمهام مع إمكانيات التصحيح التلقائي.',
        createQuiz: 'إنشاء اختبار',
        createAssignment: 'إنشاء مهمة',
        viewAssessments: 'عرض الكل',
        gradingCenter: 'مركز التصحيح',
        gradingCenterDesc: 'مراجعة وتصحيح مقدمات الطلاب باستخدام أدوات التقييم القائمة على المعايير.',
        pendingGrades: 'الدرجات المعلقة',
        createRubric: 'إنشاء معيار تقييم',
        quizTitle: 'عنوان الاختبار',
        quizDescription: 'الوصف',
        timeLimit: 'الحد الزمني (بالدقائق)',
        attempts: 'الحد الأقصى للمحاولات',
        questions: 'الأسئلة',
        assignmentTitle: 'عنوان المهمة',
        assignmentDescription: 'الوصف',
        dueDate: 'تاريخ الاستحقاق',
        maxPoints: 'النقاط القصوى',
        submissionType: 'نوع التسليم',
        allowedFileTypes: 'أنواع الملفات المسموحة',
        gradingRubric: 'معيار التصحيح',
        rubricName: 'اسم المعيار',
        rubricDescription: 'الوصف',
        criteria: 'معايير التصحيح',
        gradeSubmission: 'تصحيح التسليم',
        saveGrade: 'حفظ الدرجة',
        assignments: 'المهام والاختبارات',
        studentAssignments: 'مهام الطلاب'
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
    
    // Update placeholder texts
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
      const key = element.getAttribute('data-translate-placeholder');
      element.placeholder = this.translate(key);
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
    
    document.documentElement.style.setProperty('font-size', this.fontSizes[size]);
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
    
  // Default to 2x2 if no preference saved
  this.currentLayout = localStorage.getItem('layoutPreference') || '2x2';
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
    
    // Update placeholder texts
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
      const key = element.getAttribute('data-translate-placeholder');
      element.placeholder = this.translate(key);
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
