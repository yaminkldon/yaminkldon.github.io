// Firebase Config
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

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
      applyAdvancedFeatures();
    }
    
    loadProgress();
  } else {
    Navigation.goToLogin();
  }
});

function applyAdvancedFeatures() {
  if (!advancedFeatures) return;
  
  // Apply theme
  const theme = advancedFeatures.getCurrentTheme();
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  }
  
  // Apply font size
  const fontSize = advancedFeatures.getCurrentFontSize();
  const fontSizes = {
    small: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '20px'
  };
  document.documentElement.style.setProperty('--base-font-size', fontSizes[fontSize]);
  
  // Apply language
  const language = advancedFeatures.getCurrentLanguage();
  if (language === 'ar') {
    document.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }
  
  // Update language display
  advancedFeatures.updateLanguageDisplay();
}

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
