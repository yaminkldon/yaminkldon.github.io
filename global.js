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
  static async markLessonCompleted(unitId, lessonId) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const authUID = user.uid;
    const today = new Date().toISOString().split('T')[0];
    
    // Get the database user ID by finding user record with matching email
    let databaseUserID = null;
    try {
      const snapshot = await firebase.database().ref('users').orderByChild('email').equalTo(user.email).once('value');
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          databaseUserID = child.key; // This is the database user ID
        });
      }
    } catch (error) {
      console.error('Error finding database user ID:', error);
    }
    
    const progressData = {
      completed: true,
      completedDate: today,
      timestamp: Date.now()
    };
    
    // Save progress using Firebase Auth UID (for current functionality)
    firebase.database().ref(`progress/${authUID}/${unitId}/${lessonId}`).set(progressData);
    
    // ALSO save progress using database user ID (for teacher analytics)
    if (databaseUserID) {
      firebase.database().ref(`progress/${databaseUserID}/${unitId}/${lessonId}`).set(progressData);
    }
    
    // Update last study dates for both UIDs
    const updateStudyDates = async (uid) => {
      try {
        const snapshot = await firebase.database().ref(`progress/${uid}/lastStudyDates`).once('value');
        let dates = snapshot.val() || [];
        if (!dates.includes(today)) {
          dates.push(today);
          firebase.database().ref(`progress/${uid}/lastStudyDates`).set(dates);
        }
      } catch (error) {
        console.error(`Error updating study dates for UID ${uid}:`, error);
      }
    };
    
    updateStudyDates(authUID);
    if (databaseUserID) {
      updateStudyDates(databaseUserID);
    }
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
  
  static async saveVideoPosition(unitId, lessonId, currentTime) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const authUID = user.uid;
    
    // Get the database user ID
    let databaseUserID = null;
    try {
      const snapshot = await firebase.database().ref('users').orderByChild('email').equalTo(user.email).once('value');
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          databaseUserID = child.key;
        });
      }
    } catch (error) {
      console.error('Error finding database user ID for video position:', error);
    }
    
    // Save video position using both UIDs
    firebase.database().ref(`progress/${authUID}/${unitId}/${lessonId}/lastPosition`).set(currentTime);
    if (databaseUserID) {
      firebase.database().ref(`progress/${databaseUserID}/${unitId}/${lessonId}/lastPosition`).set(currentTime);
    }
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
      z-index:9999999;
      left:50%;
      bottom:30px;
      font-size:17px;
      cursor:pointer;
      transition:visibility 0s, opacity 0.5s linear;
      opacity:0;
      pointer-events:auto;
    `;
    document.body.appendChild(toast);
  }
}

// Global authentication helpers
class AuthManager {
  static async logout() {
    try {
      // Destroy session manager if it exists
      if (window.sessionManager) {
        window.sessionManager.destroy();
        window.sessionManager = null;
      }
      
      await firebase.auth().signOut();
      localStorage.removeItem('device_id');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('pageHiddenTime');
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

  static getSessionTimeRemaining() {
    if (!window.sessionManager) return null;
    
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return null;
    
    const sessionTimeout = 60 * 60 * 1000; // 1 hour
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    const timeRemaining = sessionTimeout - timeSinceLastActivity;
    
    return Math.max(0, timeRemaining);
  }
}

// Session Management for Auto-Logout
class SessionManager {
  constructor() {
    this.sessionTimeout = 60 * 60 * 1000; // 1 hour in milliseconds
    this.warningTime = 5 * 60 * 1000; // Show warning 5 minutes before logout
    this.lastActivity = Date.now();
    this.warningTimer = null;
    this.logoutTimer = null;
    this.countdownTimer = null; // Add countdown timer property
    this.warningShown = false;
    this.isActive = true;
    
    this.init();
  }

  init() {
    // Track user activity events
    this.activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus', 'blur'
    ];
    
    // Add event listeners for activity tracking
    this.activityEvents.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), true);
    });
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });
    
    // Start the timer
    this.resetTimer();
    
    // Check for existing session on page load
    this.checkExistingSession();
  }

  resetTimer() {
    if (!this.isActive) return;
    
    this.lastActivity = Date.now();
    this.warningShown = false;
    
    // Clear existing timers
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    
    // Remove any existing warning modal
    const existingModal = document.getElementById('sessionWarningModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Set warning timer (55 minutes)
    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, this.sessionTimeout - this.warningTime);
    
    // Set logout timer (60 minutes)
    this.logoutTimer = setTimeout(() => {
      this.autoLogout();
    }, this.sessionTimeout);
    
    // Update last activity in localStorage
    localStorage.setItem('lastActivity', this.lastActivity.toString());
  }

  showWarning() {
    if (this.warningShown || !firebase.auth().currentUser) return;
    
    // Check if modal already exists and remove it
    const existingModal = document.getElementById('sessionWarningModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    this.warningShown = true;
    
    // Create warning modal
    const modal = document.createElement('div');
    modal.id = 'sessionWarningModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: 'Segoe UI', Arial, sans-serif;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      ">
        <div style="color: #ff6b35; font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h3 style="margin: 0 0 16px 0; color: #333;">Session Timeout Warning</h3>
        <p style="margin: 0 0 20px 0; color: #666; line-height: 1.4;">
          Your session will expire in <strong id="countdown">5:00</strong> minutes due to inactivity.
          Click "Stay Logged In" to continue your session.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button onclick="sessionManager.extendSession()" style="
            background: #6c4fc1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">Stay Logged In</button>
          <button onclick="sessionManager.logoutNow()" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">Logout Now</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Start countdown
    this.startCountdown();
  }

  startCountdown() {
    // Clear any existing countdown timer
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    
    let timeLeft = 5 * 60; // 5 minutes in seconds
    const countdownElement = document.getElementById('countdown');
    
    this.countdownTimer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      if (countdownElement) {
        countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      timeLeft--;
      
      // Stop countdown if time is up or modal is removed
      if (timeLeft < 0 || !document.getElementById('sessionWarningModal')) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    }, 1000);
  }

  extendSession() {
    // Clear countdown timer
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    // Remove warning modal
    const modal = document.getElementById('sessionWarningModal');
    if (modal) modal.remove();
    
    // Reset the timer
    this.resetTimer();
    
    NotificationManager.showToast('Session extended successfully!');
  }

  logoutNow() {
    this.autoLogout();
  }

  async autoLogout() {
    this.isActive = false;
    
    // Clear all timers
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    
    // Remove warning modal if exists
    const modal = document.getElementById('sessionWarningModal');
    if (modal) modal.remove();
    
    // Clear session data
    localStorage.removeItem('lastActivity');
    
    try {
      await firebase.auth().signOut();
      localStorage.removeItem('device_id');
      
      // Show logout notification
      NotificationManager.showToast('Session expired due to inactivity. Please login again.');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        Navigation.goToLogin();
      }, 2000);
      
    } catch (error) {
      console.error('Error during auto-logout:', error);
      Navigation.goToLogin();
    }
  }

  handlePageHidden() {
    // Store the time when page was hidden
    localStorage.setItem('pageHiddenTime', Date.now().toString());
  }

  handlePageVisible() {
    const pageHiddenTime = localStorage.getItem('pageHiddenTime');
    if (pageHiddenTime) {
      const hiddenDuration = Date.now() - parseInt(pageHiddenTime);
      
      // If page was hidden for more than session timeout, logout immediately
      if (hiddenDuration > this.sessionTimeout) {
        this.autoLogout();
        return;
      }
      
      // If page was hidden for significant time, adjust the timer
      if (hiddenDuration > 60000) { // More than 1 minute
        this.lastActivity = Date.now() - hiddenDuration;
        this.resetTimer();
      }
      
      localStorage.removeItem('pageHiddenTime');
    }
  }

  checkExistingSession() {
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity && firebase.auth().currentUser) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      
      // If more than session timeout has passed, logout immediately
      if (timeSinceLastActivity > this.sessionTimeout) {
        this.autoLogout();
        return;
      }
      
      // If close to timeout, show warning immediately
      if (timeSinceLastActivity > (this.sessionTimeout - this.warningTime)) {
        setTimeout(() => this.showWarning(), 1000);
      }
    }
  }

  destroy() {
    this.isActive = false;
    
    // Clear all timers
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    
    // Remove any existing warning modal
    const modal = document.getElementById('sessionWarningModal');
    if (modal) modal.remove();
    
    // Remove event listeners
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, () => this.resetTimer(), true);
    });
  }
}

// Initialize theme and session management on page load
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
  
  // Initialize session manager only if user is authenticated
  firebase.auth().onAuthStateChanged((user) => {
    if (user && !window.sessionManager) {
      window.sessionManager = new SessionManager();
    } else if (!user && window.sessionManager) {
      window.sessionManager.destroy();
      window.sessionManager = null;
    }
  });
});

// Export globals
window.Navigation = Navigation;
window.ProgressTracker = ProgressTracker;
window.NotificationManager = NotificationManager;
window.AuthManager = AuthManager;
window.SessionManager = SessionManager;
