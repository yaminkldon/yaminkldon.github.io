// Global theme management system
class ThemeManager {
  constructor() {
    this.initTheme();
  }

  initTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
      document.body.classList.add('dark-mode');
    }
  }

  toggleDarkMode() {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
      document.body.classList.remove('dark-mode');

    } else {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    }
    return !isDark;
  }

  isDarkMode() {
    return document.body.classList.contains('dark-mode');
  }
}

// Global navigation helpers
class Navigation {
  static goToMainPage() {
    window.location.href = "mainpage.html";
  }

  static goToSettings() {
    window.location.href = "settings.html";
  }

  static goToProgress() {
    window.location.href = "progress.html";
  }

  static goToLogin() {
    window.location.href = "index.html";
  }

  static goToRegister() {
    window.location.href = "register.html";
  }

  static goToPasswordReset() {
    window.location.href = "password-reset.html";
  }
}

// Global progress tracking
class ProgressTracker {
  static markLessonCompleted(unitId, lessonId) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const userId = user.uid;
    const today = new Date().toISOString().split('T')[0];
    
    // Mark lesson as completed in Firebase
    firebase.database().ref(`progress/${userId}/${unitId}/${lessonId}`).set({
      completed: true,
      completedDate: today,
      timestamp: Date.now()
    });
    
    // Update last study dates for streak calculation
    firebase.database().ref(`progress/${userId}/lastStudyDates`).once('value')
      .then(snapshot => {
        let dates = snapshot.val() || [];
        if (!dates.includes(today)) {
          dates.push(today);
          firebase.database().ref(`progress/${userId}/lastStudyDates`).set(dates);
        }
      });
  }

  static async getUserProgress() {
    const user = firebase.auth().currentUser;
    if (!user) return {};
    
    try {
      const snapshot = await firebase.database().ref(`progress/${user.uid}`).once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error getting user progress:', error);
      return {};
    }
  }
  
  static saveVideoPosition(unitId, lessonId, currentTime) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const userId = user.uid;
    firebase.database().ref(`progress/${userId}/${unitId}/${lessonId}/lastPosition`).set(currentTime);
  }
  
  static async getVideoPosition(unitId, lessonId) {
    const user = firebase.auth().currentUser;
    if (!user) return 0;
    
    try {
      const snapshot = await firebase.database().ref(`progress/${user.uid}/${unitId}/${lessonId}/lastPosition`).once('value');
      return snapshot.val() || 0;
    } catch (error) {
      console.error('Error getting video position:', error);
      return 0;
    }
  }
}

// Global notification system
class NotificationManager {
  static showToast(message, duration = 4000) {
    const toast = document.getElementById('toast');
    if (!toast) {
      this.createToast();
      return this.showToast(message, duration);
    }
    
    toast.textContent = message;
    toast.style.visibility = 'visible';
    toast.style.opacity = '1';
    
    const hide = () => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.style.visibility = 'hidden'; }, 500);
      toast.removeEventListener('click', hide);
    };
    
    toast.addEventListener('click', hide);
    setTimeout(hide, duration);
  }

  static createToast() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      visibility:hidden;
      min-width:250px;
      margin-left:-125px;
      background:#323232;
      color:#fff;
      text-align:center;
      border-radius:4px;
      padding:16px;
      position:fixed;
      z-index:9999;
      left:50%;
      bottom:30px;
      font-size:17px;
      cursor:pointer;
      transition:visibility 0s, opacity 0.5s linear;
      opacity:0;
    `;
    document.body.appendChild(toast);
  }
}

// Global authentication helpers
class AuthManager {
  static async logout() {
    try {
      await firebase.auth().signOut();
      localStorage.removeItem('device_id');
      Navigation.goToLogin();
    } catch (error) {
      NotificationManager.showToast('Error signing out: ' + error.message);
    }
  }

  static onAuthStateChanged(callback) {
    return firebase.auth().onAuthStateChanged(callback);
  }

  static getCurrentUser() {
    return firebase.auth().currentUser;
  }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});

// Export globals
window.Navigation = Navigation;
window.ProgressTracker = ProgressTracker;
window.NotificationManager = NotificationManager;
window.AuthManager = AuthManager;
