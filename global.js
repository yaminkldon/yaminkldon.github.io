// Global theme management system
class ThemeManager {
  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.initTheme();
    // Sync across tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === 'darkMode' || e.key === 'themeMode') {
        this.apply();
      }
    });
    // React to system change when in auto mode
    if (this.mediaQuery && this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', () => this.apply());
    } else if (this.mediaQuery && this.mediaQuery.addListener) {
      // Safari/iOS fallback
      this.mediaQuery.addListener(() => this.apply());
    }
  }

  initTheme() {
    // themeMode: 'dark' | 'light' | 'auto' (optional). Back-compat with legacy darkMode boolean.
    const legacy = localStorage.getItem('darkMode');
    const savedMode = localStorage.getItem('themeMode');
    if (!savedMode && legacy !== null) {
      // migrate once
      localStorage.setItem('themeMode', legacy === 'true' ? 'dark' : 'light');
    }
    this.apply();
  }

  toggleDarkMode() {
    const isDark = document.body.classList.contains('dark-mode');
  this.setDarkMode(!isDark);
  return !isDark;
  }

  isDarkMode() {
    return document.body.classList.contains('dark-mode');
  }

  // Programmatic setter that also writes canonical themeMode
  setDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
      localStorage.setItem('themeMode', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
      localStorage.setItem('themeMode', 'light');
    }
  }

  // Set mode: 'light' | 'dark' | 'auto'
  setMode(mode) {
    const valid = ['light', 'dark', 'auto'];
    const m = valid.includes(mode) ? mode : 'light';
    localStorage.setItem('themeMode', m);
    // Keep legacy key roughly in sync for older pages
    if (m === 'auto') {
      localStorage.removeItem('darkMode');
    } else {
      localStorage.setItem('darkMode', m === 'dark' ? 'true' : 'false');
    }
    this.apply();
  }

  // Apply according to themeMode and system preference
  apply() {
    const mode = localStorage.getItem('themeMode');
    const prefersDark = this.mediaQuery ? this.mediaQuery.matches : false;
    const effectiveDark = mode === 'dark' || (mode === 'auto' && prefersDark) || (mode === null && localStorage.getItem('darkMode') === 'true');
    if (effectiveDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}

// Detect if app-origin (client-side stand-in for server header check)
function isFromApp() {
  try {
    const ua = navigator.userAgent || '';
    return ua.includes('RaedApp/1.0');
  } catch (_) {
    return false;
  }
}

// Ensure a stable device id exists (shared helper)
function ensureDeviceId() {
  try {
    // 1) If app injects a device ID in the UA (e.g., "RaedApp/1.0; DID=xxxx"), prefer it
    const ua = navigator.userAgent || '';
    const didMatch = ua.match(/\bDID=([A-Za-z0-9._\-]+)/);
    if (didMatch && didMatch[1]) {
      const appId = 'app-' + didMatch[1];
      const existing = localStorage.getItem('device_id');
      if (existing !== appId) {
        writeAllStores(appId);
        idbWriteId(appId);
      }
      return appId;
    }

    // 2) Try existing values from multiple stores (Biri-style)
    let id = localStorage.getItem('device_id') || getCookie('device_id') || getWindowNameId();
    if (id) {
      // Sync to all stores in case some are missing
      writeAllStores(id);
      idbWriteId(id);
      // Async promote storage persistence
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      // Also try reading IDB to reconcile if it has an older value
      idbReadId().then(stored => { if (stored && stored !== id) writeAllStores(stored); }).catch(()=>{});
      return id;
    }

    // 3) Nothing found: generate a cryptographically random persistent ID
    id = 'pid-' + generateRandomHex(16);
    writeAllStores(id);
    idbWriteId(id);
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    return id;
  } catch (_) {
    // Ultimate fallback: minimal deterministic hash of UA
    try {
      const ua = navigator.userAgent || 'unknown';
      const fallback = 'browser-fallback-' + hashString(ua);
      writeAllStores(fallback);
      return fallback;
    } catch {
      return 'browser-fallback-unknown';
    }
  }
}

// Helpers: multi-store (localStorage, cookie, window.name) and IndexedDB
function writeAllStores(id) {
  try { localStorage.setItem('device_id', id); } catch {}
  try { setCookie('device_id', id, 3650); } catch {}
  try { setWindowNameId(id); } catch {}
}

function getCookie(name) {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  } catch { return null; }
}

function setCookie(name, value, days) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  } catch {}
}

function getWindowNameId() {
  try {
    const w = window.name || '';
    if (w.startsWith('did:')) return w.slice(4);
    return null;
  } catch { return null; }
}

function setWindowNameId(id) {
  try {
    // Preserve existing name tail if it contains other data
    const w = window.name || '';
    const rest = w.includes('|') ? w.split('|').slice(1).join('|') : '';
    window.name = 'did:' + id + (rest ? ('|' + rest) : '');
  } catch {}
}

function generateRandomHex(bytes) {
  try {
    const arr = new Uint8Array(bytes);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback to less-secure random
    let s = '';
    for (let i = 0; i < bytes; i++) s += Math.floor(Math.random()*256).toString(16).padStart(2,'0');
    return s;
  }
}

function idbWriteId(id) {
  try {
    const req = indexedDB.open('biri', 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); };
    req.onsuccess = () => {
      const db = req.result; const tx = db.transaction('kv', 'readwrite'); const store = tx.objectStore('kv');
      store.put(id, 'device_id');
    };
  } catch {}
}

function idbReadId() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open('biri', 1);
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); };
      req.onsuccess = () => {
        try {
          const db = req.result; const tx = db.transaction('kv', 'readonly'); const store = tx.objectStore('kv');
          const getReq = store.get('device_id');
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        } catch { resolve(null); }
      };
      req.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
}

// Build a deterministic browser serial. Not a hardware ID, but stable across sessions
function computeBrowserSerial() {
  const nav = navigator || {};
  const scr = window.screen || {};
  const tz = getTimeZone();
  const parts = [
    nav.userAgent || '',
    nav.language || '',
    nav.platform || '',
    nav.vendor || '',
    String(nav.hardwareConcurrency || ''),
    String(nav.deviceMemory || ''),
    String(scr.colorDepth || ''),
    `${scr.width || ''}x${scr.height || ''}`,
    `${scr.availWidth || ''}x${scr.availHeight || ''}`,
    String(scr.pixelDepth || ''),
    tz,
    // Lightweight canvas fingerprint
    getCanvasFingerprint()
  ];
  const raw = parts.join('||');
  return hashString(raw);
}

function getTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
}

function getCanvasFingerprint() {
  try {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 50;
    const ctx = c.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('RaedFingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('RaedFingerprint', 4, 17);
    const gl = !!window.WebGLRenderingContext;
    return (gl ? 'gl:' : '2d:') + c.toDataURL();
  } catch {
    return '';
  }
}

// Simple deterministic hash (FNV-1a-inspired) for string -> hex
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return ('00000000' + h.toString(16)).slice(-8);
}

// ----- Server time sync (resilient against manual clock changes) -----
let __serverTimeOffset = 0; // ms; serverNow ~= Date.now() + offset
function initServerTimeSync() {
  try {
    const ref = firebase.database().ref('.info/serverTimeOffset');
    ref.on('value', async (snap) => {
      const v = snap.val();
      __serverTimeOffset = (typeof v === 'number') ? v : 0;
      // Re-check policies if user is logged in and offset changed
      try {
        const user = firebase.auth().currentUser;
        if (user && typeof runGlobalAuthGuard === 'function') {
          runGlobalAuthGuard(user);
        }
      } catch {}
    });
  } catch (e) {
    console.warn('Server time sync not available:', e);
  }
}
function getServerNow() {
  return Date.now() + (__serverTimeOffset || 0);
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
    
    // Don't reset timer if warning is already shown - user should use buttons
    if (this.warningShown) return;
    
    this.lastActivity = Date.now();
    
    // Clear existing timers
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    
    // Remove any existing warning modal (only if not in warning state)
    const existingModal = document.getElementById('sessionWarningModal');
    if (existingModal && !this.warningShown) {
      existingModal.remove();
    }
    
    // Calculate warning time based on current session timeout
    const warningTime = Math.min(this.warningTime, this.sessionTimeout); // Use full warning time (5 minutes) or session timeout, whichever is smaller
    
    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, this.sessionTimeout - warningTime);
    
    // Set logout timer
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
    
    // Calculate actual warning time
    const warningTime = Math.min(this.warningTime, this.sessionTimeout);
    const warningMinutes = Math.floor(warningTime / 60000);
    const warningSeconds = Math.floor((warningTime % 60000) / 1000);
    const initialDisplay = `${warningMinutes}:${warningSeconds.toString().padStart(2, '0')}`;
    
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
          Your session will expire in <strong id="countdown">${initialDisplay}</strong> due to inactivity.
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
    
    // Calculate actual warning time based on session timeout
    const warningTime = Math.min(this.warningTime, this.sessionTimeout);
    let timeLeft = Math.floor(warningTime / 1000); // Convert to seconds
    
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
    
    // Reset warning state
    this.warningShown = false;
    
    // Reset the timer
    this.lastActivity = Date.now();
    
    // Clear existing timers
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    
    // Calculate warning time based on current session timeout
    const warningTime = Math.min(this.warningTime, this.sessionTimeout * 0.1);
    
    // Set new timers
    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, this.sessionTimeout - warningTime);
    
    this.logoutTimer = setTimeout(() => {
      this.autoLogout();
    }, this.sessionTimeout);
    
    // Update last activity in localStorage
    localStorage.setItem('lastActivity', this.lastActivity.toString());
    
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
        
        // Check if we need to show warning immediately after coming back
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        const warningTime = Math.min(this.warningTime, this.sessionTimeout);
        
        if (timeSinceLastActivity > (this.sessionTimeout - warningTime)) {
          // Show warning immediately if we're in warning period
          setTimeout(() => this.showWarning(), 500);
        } else {
          // Otherwise reset timer normally
          this.resetTimer();
        }
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
      
      // Calculate adaptive warning time (same logic as in resetTimer)
      const warningTime = Math.min(this.warningTime, this.sessionTimeout * 0.1);
      
      // If close to timeout, show warning immediately
      if (timeSinceLastActivity > (this.sessionTimeout - warningTime)) {
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

  // Initialize server time sync early so policy checks use server time
  initServerTimeSync();

  // Global auth guard: enforce app-only + single-device for students on all pages
  firebase.auth().onAuthStateChanged((user) => runGlobalAuthGuard(user));
});

// Reusable global auth guard using server time, with 10s expiry modal
async function runGlobalAuthGuard(user) {
  if (!user) return;
  if (window.__authEnforcementInProgress) return;
  const email = user.email || '';
  try {
    const snap = await firebase.database().ref('users').orderByChild('email').equalTo(email).once('value');
    if (!snap.exists()) return;
    let isStudent = false;
    let deviceAllowed = true;
    let allowedByExpiry = false; // allow if at least one record is not expired (or has no expiration)
    const now = getServerNow();
    const localId = ensureDeviceId();
    snap.forEach(ch => {
      const u = ch.val();
      if ((u.type === 'student')) isStudent = true;
      if (u.deviceId && localId && u.deviceId !== localId) deviceAllowed = false;
      if (!u.expirationDate || now <= u.expirationDate) allowedByExpiry = true;
    });
    if (isStudent && !isFromApp()) {
      window.__authEnforcementInProgress = true;
      NotificationManager.showToast('Access allowed only from the official app');
      await firebase.auth().signOut();
      window.__authEnforcementInProgress = false;
      return;
    }
    if (!deviceAllowed) {
      window.__authEnforcementInProgress = true;
      NotificationManager.showToast('This account is already bound to another device');
      await firebase.auth().signOut();
      window.__authEnforcementInProgress = false;
      return;
    }
    if (!allowedByExpiry) {
      // Show a blocking modal with 10s countdown, then sign out
      showAccountExpiredModalAndLogout(10);
      return;
    }
  } catch (e) {
    console.warn('Auth guard check failed:', e);
  }
}

function showAccountExpiredModalAndLogout(seconds = 10) {
  if (window.__authEnforcementInProgress) return;
  window.__authEnforcementInProgress = true;
  try {
    // Remove existing modal if any
    const existing = document.getElementById('accountExpiredModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'accountExpiredModal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100000;
    `;
    modal.innerHTML = `
      <div style="background: white; padding: 28px; border-radius: 12px; max-width: 420px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <div style="font-size: 44px; margin-bottom: 8px;">⏳</div>
        <h3 style="margin: 0 0 8px 0; color: #333;">Account Expired</h3>
        <p style="margin: 0 0 16px 0; color: #555;">Your subscription has expired and needs renewal to continue.</p>
        <p style="margin: 0 0 16px 0; color: #666;">You will be signed out in <strong id="expiryCountdown">${seconds}</strong> seconds.</p>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button id="logoutNowBtn" style="background:#dc3545;color:#fff;border:none;padding:10px 16px;border-radius:6px;cursor:pointer;">Logout Now</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const countdownEl = document.getElementById('expiryCountdown');
    const logoutNowBtn = document.getElementById('logoutNowBtn');
    let remaining = seconds;
    const tick = setInterval(async () => {
      remaining -= 1;
      if (countdownEl) countdownEl.textContent = String(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        try { await firebase.auth().signOut(); } catch {}
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
        window.__authEnforcementInProgress = false;
        Navigation.goToLogin();
      }
    }, 1000);

    logoutNowBtn?.addEventListener('click', async () => {
      clearInterval(tick);
      try { await firebase.auth().signOut(); } catch {}
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      window.__authEnforcementInProgress = false;
      Navigation.goToLogin();
    });
  } catch (e) {
    console.warn('Failed to show expiry modal, signing out immediately');
    firebase.auth().signOut().finally(() => {
      window.__authEnforcementInProgress = false;
      Navigation.goToLogin();
    });
  }
}

// Export globals
window.Navigation = Navigation;
window.ProgressTracker = ProgressTracker;
window.NotificationManager = NotificationManager;
window.AuthManager = AuthManager;
window.SessionManager = SessionManager;
window.isFromApp = isFromApp;
window.ensureDeviceId = ensureDeviceId;
window.getServerNow = getServerNow;
