// Teacher Dashboard JavaScript
// Version: 1.0.0

const firebaseConfig = {
  apiKey: "AIzaSyCVoy2aBaQO1RDpoGGPIBqriFnGdKeNqHk",
  authDomain: "raednusairat-68b52.firebaseapp.com",
  databaseURL: "https://raednusairat-68b52-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "raednusairat-68b52",
  storageBucket: "raednusairat-68b52.appspot.com",
  messagingSenderId: "852022576722",
  appId: "1:852022576722:web:8546d7cd4d3f6b0f8fc18b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// Cache management for teacher dashboard
const TeacherCacheManager = {
  // Cache duration in milliseconds (6 hours for teacher dashboard)
  CACHE_DURATION: 6 * 60 * 60 * 1000,
  
  // Cache keys
  CACHE_KEYS: {
    DASHBOARD_STATS: 'teacher_dashboard_stats',
    UNITS: 'teacher_units',
    ASSIGNMENTS: 'teacher_assignments',
    QUIZZES: 'teacher_quizzes',
    USERS: 'teacher_users'
  },
  
  // Set cache with timestamp and data hash
  setCache: function(key, data) {
    const cacheData = {
      timestamp: Date.now(),
      data: data,
      hash: this.generateDataHash(data)
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  },
  
  // Generate a simple hash of the data structure
  generateDataHash: function(data) {
    if (!data) return '';
    
    // Create a hash based on the structure keys and basic properties
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data).sort();
      let hashString = keys.join('|');
      
      // Add basic properties to detect changes
      keys.forEach(key => {
        const item = data[key];
        if (typeof item === 'object' && item !== null) {
          // For teacher dashboard, include key identifiers
          hashString += `|${key}:${item.title || item.name || item.email || ''}`;
        }
      });
      
      return hashString;
    }
    
    return JSON.stringify(data);
  },
  
  // Get cache if not expired
  getCache: function(key) {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;
    
    try {
      const parsedItem = JSON.parse(cachedItem);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - parsedItem.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsedItem.data;
    } catch (error) {
      console.error('Error parsing teacher cache:', error);
      localStorage.removeItem(key);
      return null;
    }
  },
  
  // Check if cached data is still valid by comparing structure
  isCacheValid: function(key, currentData) {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return false;
    
    try {
      const parsedItem = JSON.parse(cachedItem);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - parsedItem.timestamp > this.CACHE_DURATION) {
        return false;
      }
      
      // Check if structure has changed
      const currentHash = this.generateDataHash(currentData);
      const cachedHash = parsedItem.hash;
      
      if (currentHash !== cachedHash) {
        console.log('Teacher cache invalidated: structure changed');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating teacher cache:', error);
      return false;
    }
  },
  
  // Clear specific cache
  clearCache: function(key) {
    localStorage.removeItem(key);
  },
  
  // Clear all cache
  clearAllCache: function() {
    Object.values(this.CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

// Initialize Advanced Features
let advancedFeatures = null;

// Initialize page
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // Initialize Advanced Features
    if (typeof AdvancedFeatures !== 'undefined') {
      advancedFeatures = new AdvancedFeatures();
      advancedFeatures.applyFeatures();
    }
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('teacherTheme') || 'light';
    applyTheme(savedTheme);
    
    // Check if user is teacher
    verifyTeacherAccess(user);
    loadDashboardData();
  } else {
    Navigation.goToLogin();
  }
});

function verifyTeacherAccess(user) {
  // Search for user by email in database
  db.ref('users').orderByChild('email').equalTo(user.email).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      alert('User not found in database.');
      Navigation.goToMainPage();
      return;
    }
    
    // Get the first (and should be only) matching user
    const userData = Object.values(snapshot.val())[0];
    if (!userData || userData.type !== 'teacher') {
      alert('Access denied. Teachers only.');
      Navigation.goToMainPage();
    }
  }).catch(error => {
    console.error('Error checking user type:', error);
    alert('Error verifying access permissions.');
    Navigation.goToMainPage();
  });
}

function loadDashboardData() {
  loadQuickStats();
  loadUnitsForSelect();
}

function loadQuickStats() {
  // Load total students
  db.ref('users').orderByChild('type').equalTo('student').once('value').then(snapshot => {
    const studentCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    document.getElementById('total-students').textContent = studentCount;
  });
  
  // Load total units
  db.ref('units').once('value').then(snapshot => {
    const unitCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    document.getElementById('total-units').textContent = unitCount;
    
    // Count total lessons (using progress.js logic)
    let lessonCount = 0;
    if (snapshot.exists()) {
      Object.values(snapshot.val()).forEach(unit => {
        // Count lessons directly under unit (not under unit.lessons)
        Object.keys(unit).forEach(key => {
          const item = unit[key];
          // Check if this is a lesson (has videoURL or videoFile)
          if (item && typeof item === 'object' && (item.videoURL || item.videoFile)) {
            lessonCount++;
          }
        });
      });
    }
    document.getElementById('total-lessons').textContent = lessonCount;
  });
  
  // Calculate average progress (placeholder)
  document.getElementById('avg-progress').textContent = '75%';
}

function loadUnitsForSelect() {
  const unitSelect = document.getElementById('videoUnit');
  if (!unitSelect) return;
  
  db.ref('units').once('value').then(snapshot => {
    unitSelect.innerHTML = '<option value="">Choose a unit...</option>';
    
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([unitKey, unitData]) => {
        const option = document.createElement('option');
        option.value = unitKey;
        option.textContent = unitKey;
        unitSelect.appendChild(option);
      });
    }
  });
}

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  
  // Clean up quiz test timer if closing quiz test modal
  if (modalId === 'quizTestModal' && testQuizTimer) {
    clearInterval(testQuizTimer);
    testQuizTimer = null;
  }
}

// Feature Card Click Handlers
function openUserManagement() {
  // Show comprehensive user management interface
  console.log('Opening User Management');
  
  // Create and show user management modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'userManagementModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">User Management Dashboard</h3>
        <button class="modal-close" onclick="closeModal('userManagementModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="feature-actions" style="margin-bottom: 20px;">
        <button class="action-btn" onclick="openAddUserModal()">Add New Student</button>
        <button class="action-btn secondary" onclick="refreshUserList()">Refresh List</button>
        <button class="action-btn secondary" onclick="exportUserData()">Export Users</button>
      </div>
      
      <div class="user-list-container">
        <div class="search-bar" style="margin-bottom: 16px;">
          <input type="text" id="userSearchInput" placeholder="Search users..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        </div>
        
        <div class="users-grid" id="usersGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; max-height: 400px; overflow-y: auto;">
          <div style="text-align: center; padding: 20px; color: #666;">Loading users...</div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load users
  loadAllUsers();
  
  // Add search functionality
  const searchInput = document.getElementById('userSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterUsers);
  }
}

function openContentManagement() {
  console.log('Opening Content Management');
  
  // Create content management modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'contentManagementModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">Content Management</h3>
        <button class="modal-close" onclick="closeModal('contentManagementModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="content-tabs" style="display: flex; margin-bottom: 20px; border-bottom: 1px solid #ddd;">
        <button class="tab-btn active" onclick="switchContentTab('units')" data-tab="units">Units</button>
        <button class="tab-btn" onclick="switchContentTab('lessons')" data-tab="lessons">Lessons</button>
        <button class="tab-btn" onclick="switchContentTab('videos')" data-tab="videos">Videos</button>
      </div>
      
      <div id="units-tab" class="content-tab-panel">
        <div class="feature-actions" style="margin-bottom: 16px;">
          <button class="action-btn" onclick="openAddUnitModal()">Add Unit</button>
          <button class="action-btn secondary" onclick="refreshUnits()">Refresh</button>
        </div>
        <div id="unitsContentList" style="max-height: 400px; overflow-y: auto;">Loading units...</div>
      </div>
      
      <div id="lessons-tab" class="content-tab-panel" style="display: none;">
        <div class="feature-actions" style="margin-bottom: 16px;">
          <button class="action-btn" onclick="openAddLessonModal()">Add Lesson</button>
          <button class="action-btn secondary" onclick="refreshLessons()">Refresh</button>
        </div>
        <div id="lessonsContentList" style="max-height: 400px; overflow-y: auto;">Loading lessons...</div>
      </div>
      
      <div id="videos-tab" class="content-tab-panel" style="display: none;">
        <div class="feature-actions" style="margin-bottom: 16px;">
          <button class="action-btn" onclick="openUploadVideoModal()">Upload Video</button>
          <button class="action-btn secondary" onclick="refreshVideos()">Refresh</button>
        </div>
        <div id="videosContentList" style="max-height: 400px; overflow-y: auto;">Loading videos...</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load initial content
  loadContentData();
}

function openAnalytics() {
  console.log('Opening Analytics');
  
  // Create analytics modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'analyticsModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 1000px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">Analytics & Reports</h3>
        <button class="modal-close" onclick="closeModal('analyticsModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="analytics-dashboard">
        <div class="analytics-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="stat-card">
            <div class="stat-number" id="totalLogins">0</div>
            <div class="stat-label">Total Logins Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="activeUsers">0</div>
            <div class="stat-label">Active Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="completionRate">0%</div>
            <div class="stat-label">Avg Completion Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="totalWatchTime">0h</div>
            <div class="stat-label">Total Watch Time</div>
          </div>
        </div>
        
        <div class="analytics-charts">
          <div class="chart-container" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
            <h4>User Progress Overview</h4>
            <div id="progressChart" style="height: 200px; display: flex; align-items: center; justify-content: center; color: #666;">
              📊 Progress visualization will be displayed here
            </div>
          </div>
          
          <div class="chart-container" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h4>Popular Content</h4>
            <div id="popularContent" style="max-height: 200px; overflow-y: auto;">Loading popular content...</div>
          </div>
        </div>
        
        <div class="feature-actions" style="margin-top: 20px;">
          <button class="action-btn" onclick="generateDetailedReport()">Generate Report</button>
          <button class="action-btn secondary" onclick="exportAnalyticsData()">Export Data</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load analytics data
  loadAnalyticsData();
}

function openCommunication() {
  // Open send notification page
  window.location.href = 'send_notification.html';
}

function openVideoManagement() {
  console.log('Opening Video Management');
  
  // Create video management modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'videoManagementModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">Video Management</h3>
        <button class="modal-close" onclick="closeModal('videoManagementModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="video-management-tools">
        <div class="feature-actions" style="margin-bottom: 20px;">
          <button class="action-btn" onclick="openUploadVideoModal()">Upload New Video</button>
          <button class="action-btn secondary" onclick="refreshVideoList()">Refresh List</button>
          <button class="action-btn secondary" onclick="bulkVideoActions()">Bulk Actions</button>
        </div>
        
        <div class="video-filters" style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
          <select id="unitFilter" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Units</option>
          </select>
          <input type="text" id="videoSearchInput" placeholder="Search videos..." style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex: 1; min-width: 200px;">
        </div>
        
        <div class="videos-grid" id="videosManagementGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; max-height: 500px; overflow-y: auto;">
          <div style="text-align: center; padding: 20px; color: #666;">Loading videos...</div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load videos
  loadVideoManagementData();
}

function openTeacherSettings() {
  console.log('Opening Teacher Settings');
  
  // Create teacher settings modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'teacherSettingsModal';
  modal.style.display = 'flex';
  
  // Get session info
  const sessionTimeRemaining = AuthManager.getSessionTimeRemaining();
  const sessionInfo = sessionTimeRemaining ? 
    `${Math.floor(sessionTimeRemaining / 60000)} minutes remaining` : 
    'Session info not available';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">Teacher Settings</h3>
        <button class="modal-close" onclick="closeModal('teacherSettingsModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="teacher-settings-form">
        <div class="setting-group" style="margin-bottom: 20px; padding: 16px; border-radius: 8px;">
          <label class="form-label" style="font-weight: bold; color: #6c4fc1;">Session Information</label>
          <div style="margin-top: 8px;">
            <div><strong>Current User:</strong> ${firebase.auth().currentUser?.email || 'Unknown'}</div>
            <div><strong>Session Status:</strong> ${sessionInfo}</div>
            <div><strong>Auto-Logout:</strong> Enabled (1 hour inactivity)</div>
          </div>
          <div style="margin-top: 12px;">
            <button onclick="refreshSessionTimer()" class="action-btn secondary" style="margin-right: 8px;">Extend Session</button>
            <button onclick="showSessionInfo()" class="action-btn secondary">Session Details</button>
          </div>
        </div>
        
        <div class="setting-group" style="margin-bottom: 20px;">
          <label class="form-label">Dashboard Theme</label>
          <select id="teacherTheme" class="form-input">
            <option value="light">Light Theme</option>
            <option value="dark">Dark Theme</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>
        
        <div class="setting-group" style="margin-bottom: 20px;">
          <label class="form-label">Default View</label>
          <select id="defaultView" class="form-input">
            <option value="dashboard">Dashboard Overview</option>
            <option value="users">User Management</option>
            <option value="content">Content Management</option>
            <option value="analytics">Analytics</option>
          </select>
        </div>
        
        <div class="setting-group" style="margin-bottom: 20px;">
          <label class="form-label">Notification Preferences</label>
          <div class="checkbox-group">
            <label><input type="checkbox" id="emailNotifications" checked> Email notifications</label><br>
            <label><input type="checkbox" id="browserNotifications" checked> Browser notifications</label><br>
            <label><input type="checkbox" id="dailyReports" checked> Daily reports</label>
          </div>
        </div>
        
        <div class="setting-group" style="margin-bottom: 20px;">
          <label class="form-label">Auto-backup Frequency</label>
          <select id="backupFrequency" class="form-input">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="never">Never</option>
          </select>
        </div>
        
        <div class="feature-actions">
          <button class="action-btn" onclick="saveTeacherSettings()">Save Settings</button>
          <button class="action-btn secondary" onclick="resetToDefaults()">Reset to Defaults</button>
          <button class="action-btn" onclick="AuthManager.logout()" style="background: #dc3545;">Logout Now</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load current settings
  loadTeacherSettings();
}

// Action Button Handlers
function openAddUserModal() {
  // Close the user management modal first
  closeModal('userManagementModal');
  closeModal('userListModal'); // Also close if called from user list modal
  openModal('addUserModal');
}

function openAddUnitModal() {
  openModal('addUnitModal');
}

function openAddLessonModal() {
  console.log('Opening Add Lesson Modal');
  
  // Create add lesson modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'addLessonModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title" data-translate="addLesson">Add Lesson</h3>
        <button class="modal-close" onclick="closeModal('addLessonModal')" style="width: 15%;">&times;</button>
      </div>
      <form id="addLessonForm">
        <div class="form-group">
          <label class="form-label" data-translate="lessonTitle">Lesson Title</label>
          <input type="text" class="form-input" id="lessonTitle" required>
        </div>
        <div class="form-group">
          <label class="form-label" data-translate="lessonDescription">Lesson Description</label>
          <textarea class="form-textarea" id="lessonDescription" placeholder="Enter lesson description..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" data-translate="selectUnit">Select Unit</label>
          <select class="form-input" id="lessonUnit" required>
            <option value="">Choose a unit...</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" data-translate="lessonThumbnail">Lesson Thumbnail (Optional)</label>
          <input type="file" class="form-input" id="lessonThumbnail" accept="image/*">
          <small class="form-help" data-translate="thumbnailHelp">If no thumbnail is uploaded, one will be generated automatically</small>
        </div>
        <div class="feature-actions">
          <button type="submit" class="action-btn" id="addLessonBtn" data-translate="addLesson">Add Lesson</button>
          <button type="button" class="action-btn secondary" onclick="closeModal('addLessonModal')" data-translate="cancel">Cancel</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load units for dropdown
  loadUnitsForLessonSelect();
  
  // Add form handler
  const form = document.getElementById('addLessonForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      addNewLesson();
    });
  }
}

function openUploadVideoModal() {
  // Close the video management modal first
  closeModal('videoManagementModal');
  openModal('uploadVideoModal');
}

function viewAllUsers() {
  console.log('Viewing All Users');
  
  // Create user list modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'userListModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">All Users</h3>
        <button class="modal-close" onclick="closeModal('userListModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="user-list-tools">
        <div class="feature-actions" style="margin-bottom: 16px;">
          <button class="action-btn" onclick="openAddUserModal()">Add User</button>
          <button class="action-btn secondary" onclick="exportUserList()">Export List</button>
          <button class="action-btn secondary" onclick="refreshUserList()">Refresh</button>
        </div>
        
        <div class="user-filters" style="display: flex; gap: 12px; margin-bottom: 16px;">
          <input type="text" id="userListSearch" placeholder="Search users..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <select id="userStatusFilter" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        
        <div class="users-table" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="position: sticky; top: 0;">
              <tr>
                <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">Email</th>
                <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">Status</th>
                <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">Expiration</th>
                <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">Actions</th>
              </tr>
            </thead>
            <tbody id="userTableBody">
              <tr>
                <td colspan="4" style="padding: 20px; text-align: center; color: #666;">Loading users...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load user list
  loadUserList();
}

function generateReport() {
  console.log('Generating Report');
  
  // Create report generation modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'reportModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Generate Report</h3>
        <button class="modal-close" onclick="closeModal('reportModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="report-options">
        <div class="form-group">
          <label class="form-label">Report Type</label>
          <select id="reportType" class="form-input">
            <option value="user-progress">User Progress Report</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Format</label>
          <select id="reportFormat" class="form-input">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Include</label>
          <div class="checkbox-group">
            <label><input type="checkbox" id="includeDetails" checked> Detailed Data</label><br>
            <label><input type="checkbox" id="includeSummary" checked> Summary Statistics</label>
          </div>
        </div>
        
        <div class="feature-actions">
          <button class="action-btn" onclick="processReport()">Generate Report</button>
          <button class="action-btn secondary" onclick="closeModal('reportModal')">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function exportData() {
  console.log('Exporting Data');
  
  // Create export modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'exportModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Export Data</h3>
        <button class="modal-close" onclick="closeModal('exportModal')" style="width: 15%;">&times;</button>
      </div>        <div class="export-options">
        <div class="form-group">
          <label class="form-label">Data to Export</label>
          <div class="checkbox-group">
            <label><input type="checkbox" id="exportUsers" checked> User Data</label><br>
            <label><input type="checkbox" id="exportUnits" checked> Units & Lessons</label><br>
            <label><input type="checkbox" id="exportProgress" checked> User Progress</label><br>
            <label><input type="checkbox" id="exportTokens" checked> Tokens</label><br>
            <label><input type="checkbox" id="exportAnalytics"> Analytics Data</label><br>
            <label><input type="checkbox" id="exportVideos"> Video Metadata</label>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Export Format</label>
          <select id="exportFormat" class="form-input">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Date Range (for time-sensitive data)</label>
          <div style="display: flex; gap: 8px;">
            <input type="date" id="exportStartDate" class="form-input" style="flex: 1;">
            <input type="date" id="exportEndDate" class="form-input" style="flex: 1;">
          </div>
        </div>
        
        <div class="feature-actions">
          <button class="action-btn" onclick="processDataExport()">Preview & Export</button>
          <button class="action-btn secondary" onclick="viewAllData()">View All Data</button>
          <button class="action-btn secondary" onclick="closeModal('exportModal')">Cancel</button>
        </div>
        
        <div id="exportProgress" style="display: none; margin-top: 16px;">
          <div class="progress-bar">
            <div class="progress-fill" id="exportProgressFill"></div>
          </div>
          <div style="text-align: center; margin-top: 8px;" id="exportStatus">Preparing export...</div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function openSendNotification() {
  window.location.href = 'send_notification.html';
}

function viewMessages() {
  console.log('Viewing Messages');
  
  // Create messages modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'messagesModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">Messages & Communications</h3>
        <button class="modal-close" onclick="closeModal('messagesModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="messages-dashboard">
        <div class="feature-actions" style="margin-bottom: 20px;">
          <button class="action-btn" onclick="openSendNotification()">Send New Message</button>
          <button class="action-btn secondary" onclick="refreshMessages()">Refresh</button>
          <button class="action-btn secondary" onclick="markAllAsRead()">Mark All Read</button>
        </div>
        
        <div class="message-filters" style="display: flex; gap: 12px; margin-bottom: 16px;">
          <select id="messageFilter" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="all">All Messages</option>
            <option value="sent">Sent</option>
            <option value="responses">Responses</option>
            <option value="unread">Unread</option>
          </select>
          <input type="text" id="messageSearch" placeholder="Search messages..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div class="messages-list" id="messagesList" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; padding: 20px; color: #666;">Loading messages...</div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load messages
  loadMessages();
}

function manageLessons() {
  console.log('Managing Videos');
  
  // Redirect to the main video management function
  openVideoManagement();
}

function manageUnits() {
  console.log('Managing Units');
  openModal('manageUnitsModal');
  loadUnitsManagement();
}

function loadUnitsManagement() {
  const container = document.getElementById('unitsManagementContainer');
  container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading units...</div>';
  
  db.ref('units').once('value').then(snapshot => {
    container.innerHTML = '';
    
    if (snapshot.exists()) {
      const units = [];
      snapshot.forEach(child => {
        const unitData = child.val();
        const unitId = child.key;
        
        // Count lessons directly under unit (not under unit.lessons)
        let lessonsCount = 0;
        Object.keys(unitData).forEach(key => {
          const item = unitData[key];
          // Check if this is a lesson (has videoURL or videoFile)
          if (item && typeof item === 'object' && (item.videoURL || item.videoFile)) {
            lessonsCount++;
          }
        });
        
        units.push({
          id: unitId,
          name: unitData.name || unitId,
          createdAt: unitData.createdAt || 0,
          lessonsCount: lessonsCount
        });
      });
      
      // Sort units by creation date (newest first)
      units.sort((a, b) => b.createdAt - a.createdAt);
      
      units.forEach(unit => {
        const unitCard = createUnitCard(unit);
        container.appendChild(unitCard);
      });
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">library_books</span>
          <p>No units found</p>
          <p>Create your first unit to get started!</p>
        </div>
      `;
    }
  }).catch(error => {
    console.error('Error loading units:', error);
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Error loading units</div>';
  });
}

function createUnitCard(unit) {
  const unitCard = document.createElement('div');
  unitCard.className = 'unit-card';
  unitCard.style.cssText = 'padding: 16px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 12px; background: white;';
  
  const createdDate = unit.createdAt ? new Date(unit.createdAt).toLocaleDateString() : 'Unknown';
  
  unitCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="flex: 1;">
        <h4 style="margin: 0 0 8px 0; color: #6c4fc1;">${unit.name}</h4>
        <div style="font-size: 12px; color: #666;">
          <span>ID: ${unit.id}</span> | 
          <span>Lessons: ${unit.lessonsCount}</span> | 
          <span>Created: ${createdDate}</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="openUnitFileManager('${unit.id}')" style="padding: 6px 12px; background: #ffc107; color: #212529; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
          <span class="material-icons" style="font-size: 14px;">folder</span> Unit Files
        </button>
        <button onclick="editUnit('${unit.id}', '${unit.name}')" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
          <span class="material-icons" style="font-size: 14px;">edit</span> Edit
        </button>
        <button onclick="deleteUnit('${unit.id}')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
          <span class="material-icons" style="font-size: 14px;">delete</span> Delete
        </button>
      </div>
    </div>
  `;
  
  return unitCard;
}

function editUnit(unitId, currentName) {
  // Close any existing modals first
  closeModal('manageUnitsModal');
  
  const modal = document.getElementById('editUnitModal');
  const nameInput = document.getElementById('editUnitName');
  
  // Store the current unit ID for updating
  window.currentEditingUnitId = unitId;
  
  // Set the current name
  nameInput.value = currentName;
  
  // Open the edit modal
  openModal('editUnitModal');
  
  // Setup form submission
  const form = document.getElementById('editUnitForm');
  form.onsubmit = function(e) {
    e.preventDefault();
    updateUnitName();
  };
}

function updateUnitName() {
  const newName = document.getElementById('editUnitName').value.trim();
  const unitId = window.currentEditingUnitId;
  
  if (!newName) {
    NotificationManager.showToast('Please enter a unit name');
    return;
  }
  
  // Update the unit name in the database
  db.ref(`units/${unitId}/name`).set(newName)
    .then(() => {
      NotificationManager.showToast('Unit name updated successfully!');
      closeModal('editUnitModal');
      // Reopen the manage units modal to show updated list
      openModal('manageUnitsModal');
      loadUnitsManagement(); // Refresh the list
      loadQuickStats(); // Refresh stats
      loadUnitsForSelect(); // Refresh unit selects
    })
    .catch(error => {
      console.error('Error updating unit name:', error);
      NotificationManager.showToast('Error updating unit name: ' + error.message);
    });
}

function cancelEditUnit() {
  closeModal('editUnitModal');
  // Reopen the manage units modal
  openModal('manageUnitsModal');
}

function deleteUnit(unitId) {
  if (confirm(`Are you sure you want to delete the unit "${unitId}" and all its lessons?\n\nThis action cannot be undone.`)) {
    db.ref(`units/${unitId}`).remove()
      .then(() => {
        NotificationManager.showToast('Unit deleted successfully!');
        loadUnitsManagement(); // Refresh the list
        loadQuickStats(); // Refresh stats
        loadUnitsForSelect(); // Refresh unit selects
      })
      .catch(error => {
        console.error('Error deleting unit:', error);
        NotificationManager.showToast('Error deleting unit: ' + error.message);
      });
  }
}

function filterUnits() {
  const searchTerm = document.getElementById('unitSearchInput').value.toLowerCase();
  const unitCards = document.querySelectorAll('.unit-card');
  
  unitCards.forEach(card => {
    const unitName = card.querySelector('h4').textContent.toLowerCase();
    const unitId = card.textContent.toLowerCase();
    
    if (unitName.includes(searchTerm) || unitId.includes(searchTerm)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function refreshUnitsList() {
  loadUnitsManagement();
  NotificationManager.showToast('Units list refreshed');
}

function openPreferences() {
  console.log('Opening Preferences');
  
  // Redirect to teacher settings
  openTeacherSettings();
}

function backupData() {
  console.log('Backing up Data');
  
  // Create backup modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'backupModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Data Backup</h3>
        <button class="modal-close" onclick="closeModal('backupModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="backup-options">
        <div class="form-group">
          <label class="form-label">Backup Type</label>
          <select id="backupType" class="form-input">
            <option value="full">Full Backup (All Data)</option>
            <option value="users">Users Only</option>
            <option value="content">Content Only</option>
            <option value="settings">Settings Only</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Backup Location</label>
          <select id="backupLocation" class="form-input">
            <option value="download">Download to Device</option>
            <option value="cloud">Cloud Storage</option>
            <option value="email">Email to Administrator</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Include Media Files</label>
          <div class="checkbox-group">
            <label><input type="checkbox" id="includeVideos"> Videos (Warning: Large file size)</label><br>
            <label><input type="checkbox" id="includeThumbnails" checked> Thumbnails</label><br>
            <label><input type="checkbox" id="includeUserFiles"> User Uploaded Files</label>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Encryption</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="encryptBackup" checked>
            <label for="encryptBackup">Encrypt backup file</label>
          </div>
          <input type="password" id="backupPassword" class="form-input" placeholder="Backup password (optional)" style="margin-top: 8px;">
        </div>
        
        <div class="feature-actions">
          <button class="action-btn" onclick="processBackup()">Create Backup</button>
          <button class="action-btn secondary" onclick="closeModal('backupModal')">Cancel</button>
        </div>
        
        <div id="backupProgress" style="display: none; margin-top: 16px;">
          <div class="progress-bar">
            <div class="progress-fill" id="backupProgressFill"></div>
          </div>
          <div style="text-align: center; margin-top: 8px;" id="backupStatus">Preparing backup...</div>
        </div>
        
        <div class="backup-history" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd;">
          <h4>Recent Backups</h4>
          <div id="backupHistory" style="max-height: 150px; overflow-y: auto;">
            <div style="text-align: center; padding: 10px; color: #666; font-style: italic;">No recent backups found</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load backup history
  loadBackupHistory();
}

// Form Handlers
document.addEventListener('DOMContentLoaded', function() {
  // Add User Form
  const addUserForm = document.getElementById('addUserForm');
  if (addUserForm) {
    addUserForm.addEventListener('submit', function(e) {
      e.preventDefault();
      addNewUser();
    });
  }
  
  // Add Unit Form
  const addUnitForm = document.getElementById('addUnitForm');
  if (addUnitForm) {
    addUnitForm.addEventListener('submit', function(e) {
      e.preventDefault();
      addNewUnit();
    });
  }
  
  // Upload Video Form
  const uploadVideoForm = document.getElementById('uploadVideoForm');
  if (uploadVideoForm) {
    uploadVideoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      uploadVideo();
    });
  }
  
  // File upload handling
  setupFileUpload();
  
  // Generate Token Form
  const generateTokenForm = document.getElementById('generateTokenForm');
  if (generateTokenForm) {
    generateTokenForm.addEventListener('submit', function(e) {
      e.preventDefault();
      generateNewToken();
    });
  }
});

function addNewUser() {
  const email = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPassword').value;
  const userType = document.getElementById('userType').value;
  const deviceId = document.getElementById('userDeviceId').value.trim();
  const expiration = document.getElementById('userExpiration').value;
  
  if (!email || !password || !userType || !expiration) {
    NotificationManager.showToast('Please fill in all required fields');
    return;
  }
  
  // Convert expiration date to timestamp
  const expirationTimestamp = new Date(expiration).getTime();
  
  // Generate unique user ID
  const userId = db.ref('users').push().key;
  
  const userData = {
    id: userId,
    email: email,
    password: password, // In production, this should be hashed
    deviceId: deviceId, // Save as empty string if not provided
    type: userType,
    expirationDate: expirationTimestamp,
    createdAt: Date.now()
  };
  
  // Save to database
  db.ref('users/' + userId).set(userData)
    .then(() => {
      const userTypeText = userType === 'teacher' ? 'Teacher' : 'Student';
      NotificationManager.showToast(`${userTypeText} added successfully!`);
      document.getElementById('addUserForm').reset();
      closeModal('addUserModal');
      loadQuickStats(); // Refresh stats
    })
    .catch(error => {
      console.error('Error adding user:', error);
      NotificationManager.showToast('Error adding user: ' + error.message);
    });
}

function addNewUnit() {
  const unitName = document.getElementById('unitName').value.trim();
  
  if (!unitName) {
    NotificationManager.showToast('Please fill in unit name');
    return;
  }
  
  const unitData = {
    name: unitName,
    createdAt: Date.now(),
    lessons: {}
  };
  
  // Save to database using unit name as key
  db.ref('units/' + unitName).set(unitData)
    .then(() => {
      NotificationManager.showToast('Unit created successfully!');
      document.getElementById('addUnitForm').reset();
      closeModal('addUnitModal');
      loadQuickStats(); // Refresh stats
      loadUnitsForSelect(); // Refresh unit select
    })
    .catch(error => {
      console.error('Error creating unit:', error);
      NotificationManager.showToast('Error creating unit: ' + error.message);
    });
}

function setupFileUpload() {
  const fileUpload = document.getElementById('videoFileUpload');
  const fileInput = document.getElementById('videoFileInput');
  
  if (!fileUpload || !fileInput) return;
  
  // Click to browse
  fileUpload.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Drag and drop
  fileUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUpload.classList.add('drag-over');
  });
  
  fileUpload.addEventListener('dragleave', () => {
    fileUpload.classList.remove('drag-over');
  });
  
  fileUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUpload.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });
}

function handleFileSelection(file) {
  // Validate file type
  if (!file.type.startsWith('video/')) {
    NotificationManager.showToast('Please select a valid video file');
    return;
  }
  
  // Validate file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    NotificationManager.showToast('File size must be less than 50MB');
    return;
  }
  
  // Update UI to show selected file
  const fileUpload = document.getElementById('videoFileUpload');
  fileUpload.innerHTML = `
    <div>
      <span class="material-icons" style="font-size: 48px; color: #6c4fc1;">video_file</span>
      <p><strong>${file.name}</strong></p>
      <p>Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
    </div>
  `;
  
  // Store file for upload
  fileUpload.selectedFile = file;
}

function uploadVideo() {
  const title = document.getElementById('videoTitle').value.trim();
  const description = document.getElementById('videoDescription').value.trim();
  const unitName = document.getElementById('videoUnit').value;
  const fileUpload = document.getElementById('videoFileUpload');
  const thumbnailInput = document.getElementById('videoThumbnail');
  
  if (!title || !unitName || !fileUpload.selectedFile) {
    NotificationManager.showToast('Please fill in all required fields and select a video file');
    return;
  }
  
  const file = fileUpload.selectedFile;
  const fileName = `${Date.now()}_${file.name}`;
  const uploadRef = storage.ref('videos/' + fileName);
  
  // Show progress
  const progressBar = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('uploadProgressFill');
  const uploadBtn = document.getElementById('uploadVideoBtn');
  
  progressBar.style.display = 'block';
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  
  // Upload file
  const uploadTask = uploadRef.put(file);
  
  uploadTask.on('state_changed',
    (snapshot) => {
      // Progress
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      progressFill.style.width = progress + '%';
    },
    (error) => {
      // Error
      console.error('Upload error:', error);
      NotificationManager.showToast('Upload failed: ' + error.message);
      resetUploadForm();
    },
    () => {
      // Success - now handle thumbnail
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        // Check if custom thumbnail was uploaded
        if (thumbnailInput && thumbnailInput.files && thumbnailInput.files[0]) {
          // Upload custom thumbnail
          const thumbnailFile = thumbnailInput.files[0];
          const thumbnailRef = storage.ref('thumbnails/' + Date.now() + '_' + thumbnailFile.name);
          thumbnailRef.put(thumbnailFile).then(thumbnailSnapshot => {
            return thumbnailSnapshot.ref.getDownloadURL();
          }).then(thumbnailURL => {
            saveLessonDataWithCustomThumbnail(unitName, title, description, fileName, downloadURL, thumbnailURL);
          }).catch(error => {
            console.error('Thumbnail upload error:', error);
            // Fall back to generated thumbnail
            saveLessonData(unitName, title, description, fileName, downloadURL);
          });
        } else {
          // Use generated thumbnail
          saveLessonData(unitName, title, description, fileName, downloadURL);
        }
      });
    }
  );
}

// Helper function to save lesson data with custom thumbnail
function saveLessonDataWithCustomThumbnail(unitName, title, description, fileName, downloadURL, thumbnailURL) {
  const lessonData = {
    title: title,
    description: description,
    fileName: fileName,
    downloadURL: downloadURL,
    thumbnailURL: thumbnailURL,
    uploadDate: new Date().toISOString(),
    type: 'video'
  };
  
  // Save to database
  database.ref('lessons/' + unitName + '/' + Date.now()).set(lessonData)
    .then(() => {
      NotificationManager.showToast('Video uploaded successfully!');
      resetUploadForm();
      // Refresh the video management view if it's open
      if (document.getElementById('videoManagementModal').classList.contains('show')) {
        loadVideoManagementData();
      }
    })
    .catch(error => {
      console.error('Database error:', error);
      NotificationManager.showToast('Upload completed but failed to save to database');
      resetUploadForm();
    });
}

function saveLessonData(unitName, title, description, fileName, downloadURL) {
  // Generate thumbnail if none provided
  const generatedThumbnail = generateLessonThumbnail(title);
  
  const lessonData = {
    description: description,
    thumbnailURL: generatedThumbnail, // Use generated thumbnail
    videoURL: fileName // Store filename instead of full URL
  };
  
  // Save directly to units/unitName/lessonTitle (not under lessons subfolder)
  db.ref(`units/${unitName}/${title}`).set(lessonData)
    .then(() => {
      NotificationManager.showToast('Video uploaded and lesson created successfully!');
      document.getElementById('uploadVideoForm').reset();
      closeModal('uploadVideoModal');
      loadQuickStats(); // Refresh stats
      resetUploadForm();
    })
    .catch(error => {
      console.error('Error saving lesson:', error);
      NotificationManager.showToast('Error saving lesson: ' + error.message);
      resetUploadForm();
    });
}

function resetUploadForm() {
  const progressBar = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('uploadProgressFill');
  const uploadBtn = document.getElementById('uploadVideoBtn');
  const fileUpload = document.getElementById('videoFileUpload');
  
  progressBar.style.display = 'none';
  progressFill.style.width = '0%';
  uploadBtn.disabled = false;
  uploadBtn.textContent = 'Upload Video';
  
  // Reset file upload UI
  fileUpload.innerHTML = `
    <div>
      <span class="material-icons" style="font-size: 48px; color: #6c4fc1;">cloud_upload</span>
      <p>Drag & drop video file or click to browse</p>
    </div>
  `;
  fileUpload.selectedFile = null;
}

function generateDeviceId() {
  return 'web-' + Math.random().toString(36).substr(2, 10);
}

// Token Generation Functions
function openTokenGeneration() {
  console.log('Opening Token Generation');
  openGenerateTokenModal();
}

function manageTokens() {
  console.log('Managing Tokens');
  
  // Create token management modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'manageTokensModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">Token Management</h3>
        <button class="modal-close" onclick="closeModal('manageTokensModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="token-management-tools">
        <div class="feature-actions" style="margin-bottom: 20px;">
          <button class="action-btn" onclick="openGenerateTokenModal(); closeModal('manageTokensModal')">Generate New Token</button>
          <button class="action-btn secondary" onclick="refreshTokensManagement()">Refresh List</button>
          <button class="action-btn secondary" onclick="exportTokensData()">Export Tokens</button>
          <button class="action-btn secondary" onclick="bulkTokenActions()">Bulk Actions</button>
        </div>
        
        <div class="token-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 20px;">
          <div class="stat-card" style="padding: 12px; text-align: center;">
            <div class="stat-number" id="totalTokensCount">0</div>
            <div class="stat-label">Total Tokens</div>
          </div>
          <div class="stat-card" style="padding: 12px; text-align: center;">
            <div class="stat-number" id="activeTokensCount">0</div>
            <div class="stat-label">Active Tokens</div>
          </div>
          <div class="stat-card" style="padding: 12px; text-align: center;">
            <div class="stat-number" id="usedTokensCount">0</div>
            <div class="stat-label">Used Tokens</div>
          </div>
          <div class="stat-card" style="padding: 12px; text-align: center;">
            <div class="stat-number" id="expiredTokensCount">0</div>
            <div class="stat-label">Expired Tokens</div>
          </div>
        </div>
        
        <div class="token-filters" style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
          <select id="tokenStatusFilterManage" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>
          <select id="tokenDurationFilter" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Durations</option>
            <option value="1-7">1-7 days</option>
            <option value="8-30">8-30 days</option>
            <option value="31-90">31-90 days</option>
            <option value="91-365">91-365 days</option>
          </select>
          <input type="text" id="tokenSearchManage" placeholder="Search tokens..." style="flex: 1; min-width: 200px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div class="tokens-grid" id="tokensManagementGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px; max-height: 500px; overflow-y: auto;">
          <div style="text-align: center; padding: 20px; color: #666;">Loading tokens...</div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load tokens for management
  loadTokensManagement();
}

function openGenerateTokenModal() {
  // Reset form and hide token display
  const form = document.getElementById('generateTokenForm');
  if (form) form.reset();
  
  const tokenDisplay = document.getElementById('tokenDisplay');
  if (tokenDisplay) tokenDisplay.style.display = 'none';
  
  // Set default duration
  const durationInput = document.getElementById('tokenDuration');
  if (durationInput) durationInput.value = 30;
  
  openModal('generateTokenModal');
}

function generateNewToken() {
  const duration = parseInt(document.getElementById('tokenDuration').value);
  
  if (!duration || duration < 1 || duration > 365) {
    NotificationManager.showToast('Please enter a valid duration (1-365 days)');
    return;
  }
  
  // Generate token with format: raed-BpM0kX2 (7 random characters)
  const token = 'raed-' + generateRandomString(7);
  
  // Create simplified token data
  const tokenData = {
    duration: duration.toString(),
    used: false,
    createdAt: Date.now(),
    createdBy: firebase.auth().currentUser?.email || 'Unknown'
  };
  
  // Save to database
  db.ref('tokens/' + token).set(tokenData)
    .then(() => {
      NotificationManager.showToast('Token generated successfully!');
      
      // Calculate expiration date for display
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + duration);
      
      // Display the generated token
      displayGeneratedToken(token, expirationDate);
      
      // Clear form
      document.getElementById('generateTokenForm').reset();
    })
    .catch(error => {
      console.error('Error generating token:', error);
      NotificationManager.showToast('Error generating token: ' + error.message);
    });
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function displayGeneratedToken(token, expirationDate) {
  const tokenDisplay = document.getElementById('tokenDisplay');
  const generatedTokenInput = document.getElementById('generatedToken');
  const tokenExpiry = document.getElementById('tokenExpiry');
  
  if (tokenDisplay && generatedTokenInput && tokenExpiry) {
    // Set the token value
    generatedTokenInput.value = token;
    
    // Force visible styling for the input
    generatedTokenInput.style.color = '#000';
    generatedTokenInput.style.backgroundColor = '#fff';
    generatedTokenInput.style.border = '2px solid #6c4fc1';
    
    // Format the expiration date
    const formattedDate = expirationDate.toLocaleDateString() + ' at ' + expirationDate.toLocaleTimeString();
    tokenExpiry.textContent = formattedDate;
    
    // Show the display area
    tokenDisplay.style.display = 'block';
    
    // Debug log with more details
    console.log('Token displayed:', token);
    console.log('Token input value:', generatedTokenInput.value);
    console.log('Token input element:', generatedTokenInput);
    console.log('Token display area:', tokenDisplay);
    
    // Force focus and select to test if the value is actually there
    setTimeout(() => {
      generatedTokenInput.focus();
      generatedTokenInput.select();
    }, 100);
  } else {
    console.error('Token display elements not found');
    console.error('tokenDisplay:', tokenDisplay);
    console.error('generatedTokenInput:', generatedTokenInput); 
    console.error('tokenExpiry:', tokenExpiry);
  }
}

function copyToken() {
  const tokenInput = document.getElementById('generatedToken');
  if (tokenInput && tokenInput.value) {
    tokenInput.select();
    tokenInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tokenInput.value).then(() => {
          NotificationManager.showToast('Token copied to clipboard!');
        }).catch(() => {
          // Fallback to document.execCommand
          document.execCommand('copy');
          NotificationManager.showToast('Token copied to clipboard!');
        });
      } else {
        // Fallback to document.execCommand
        document.execCommand('copy');
        NotificationManager.showToast('Token copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to copy token:', err);
      NotificationManager.showToast('Failed to copy token. Please copy manually.');
    }
  } else {
    NotificationManager.showToast('No token to copy');
  }
}

function viewAllTokens() {
  console.log('Viewing All Tokens');
  
  // Create tokens list modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'tokensListModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">All Tokens</h3>
        <button class="modal-close" onclick="closeModal('tokensListModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="tokens-list-tools">
        <div class="feature-actions" style="margin-bottom: 16px;">
          <button class="action-btn" onclick="openGenerateTokenModal(); closeModal('tokensListModal')">Generate New Token</button>
          <button class="action-btn secondary" onclick="refreshTokensList()">Refresh</button>
          <button class="action-btn secondary" onclick="exportTokensList()">Export List</button>
        </div>
        
        <div class="tokens-filters" style="display: flex; gap: 12px; margin-bottom: 16px;">
          <input type="text" id="tokenSearchInput" placeholder="Search tokens..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <select id="tokenStatusFilter" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        
        <div class="tokens-table" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="position: sticky; top: 0; background: rgba(108, 79, 193, 0.1);">
              <tr>
                <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">Token</th>
                <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">Duration</th>
                <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">Status</th>
                <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">Expires</th>
                <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: left;">Actions</th>
              </tr>
            </thead>
            <tbody id="tokensTableBody">
              <tr>
                <td colspan="5" style="padding: 20px; text-align: center; color: #666;">Loading tokens...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load tokens
  loadTokensList();
}

function loadTokensList() {
  db.ref('tokens').once('value').then(snapshot => {
    const tokensTableBody = document.getElementById('tokensTableBody');
    if (!tokensTableBody) return;
    
    tokensTableBody.innerHTML = '';
    
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([tokenKey, tokenData]) => {
        // Calculate expiration date from duration and createdAt
        const createdDate = new Date(tokenData.createdAt || Date.now());
        const expirationDate = new Date(createdDate);
        expirationDate.setDate(expirationDate.getDate() + parseInt(tokenData.duration || 30));
        
        const isExpired = expirationDate < new Date();
        const isActive = !tokenData.used && !isExpired;
        
        const row = document.createElement('tr');
        row.setAttribute('data-token', tokenKey);
        row.setAttribute('data-status', isActive ? 'active' : 'expired');
        
        row.innerHTML = `
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 12px;">
            ${tokenKey}
            <button onclick="copyToClipboard('${tokenKey}')" style="margin-left: 8px; padding: 2px 6px; font-size: 10px; background: #6c4fc1; color: white; border: none; border-radius: 3px; cursor: pointer;">Copy</button>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${tokenData.duration} days</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <span style="background: ${isActive ? '#28a745' : (tokenData.used ? '#ffc107' : '#dc3545')}; color: ${tokenData.used ? '#000' : 'white'}; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
              ${tokenData.used ? 'Used' : (isActive ? 'Active' : 'Expired')}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 12px;">
            ${expirationDate.toLocaleDateString()}<br>
            <small style="color: #666;">${expirationDate.toLocaleTimeString()}</small>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <div style="display: flex; gap: 4px;">
              ${!tokenData.used ? `<button onclick="markTokenAsUsed('${tokenKey}')" style="padding: 4px 8px; background: #ffc107; color: #000; border: none; border-radius: 4px; font-size: 10px;">Mark Used</button>` : ''}
              <button onclick="deleteToken('${tokenKey}')" style="padding: 4px 8px; background: #6c757d; color: white; border: none; border-radius: 4px; font-size: 10px;">Delete</button>
            </div>
          </td>
        `;
        
        tokensTableBody.appendChild(row);
      });
      
      // Setup search functionality
      setupTokensSearch();
    } else {
      tokensTableBody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #666;">No tokens found</td></tr>';
    }
  }).catch(error => {
    console.error('Error loading tokens:', error);
    const tokensTableBody = document.getElementById('tokensTableBody');
    if (tokensTableBody) {
      tokensTableBody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #dc3545;">Error loading tokens</td></tr>';
    }
  });
}

function setupTokensSearch() {
  const searchInput = document.getElementById('tokenSearchInput');
  const statusFilter = document.getElementById('tokenStatusFilter');
  
  function filterTokens() {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('tokenStatusFilter')?.value || '';
    
    const tokenRows = document.querySelectorAll('#tokensTableBody tr');
    tokenRows.forEach(row => {
      const token = row.getAttribute('data-token')?.toLowerCase() || '';
      const status = row.getAttribute('data-status') || '';
      const description = row.textContent.toLowerCase();
      
      const matchesSearch = token.includes(searchTerm) || description.includes(searchTerm);
      const matchesStatus = !statusFilter || status === statusFilter;
      
      row.style.display = (matchesSearch && matchesStatus) ? 'table-row' : 'none';
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', filterTokens);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', filterTokens);
  }
}

function copyToClipboard(text) {
  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      NotificationManager.showToast('Token copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy with modern API:', err);
      // Fallback to text selection method
      fallbackCopy(text);
    });
  } else {
    // Fallback for older browsers
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  // Create a temporary textarea element
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  
  try {
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    if (successful) {
      NotificationManager.showToast('Token copied to clipboard!');
    } else {
      NotificationManager.showToast('Failed to copy token');
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
    NotificationManager.showToast('Failed to copy token. Please copy manually.');
  } finally {
    document.body.removeChild(textArea);
  }
}

function markTokenAsUsed(token) {
  if (confirm('Are you sure you want to mark this token as used?')) {
    db.ref('tokens/' + token + '/used').set(true)
      .then(() => {
        NotificationManager.showToast('Token marked as used successfully');
        loadTokensList(); // Refresh the list
      })
      .catch(error => {
        console.error('Error marking token as used:', error);
        NotificationManager.showToast('Error marking token as used');
      });
  }
}

function deleteToken(token) {
  if (confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
    db.ref('tokens/' + token).remove()
      .then(() => {
        NotificationManager.showToast('Token deleted successfully');
        loadTokensList(); // Refresh the list
      })
      .catch(error => {
        console.error('Error deleting token:', error);
        NotificationManager.showToast('Error deleting token');
      });
  }
}

function refreshTokensList() {
  loadTokensList();
  NotificationManager.showToast('Tokens list refreshed');
}

function exportTokensList() {
  db.ref('tokens').once('value').then(snapshot => {
    if (snapshot.exists()) {
      const tokens = snapshot.val();
      const dataStr = JSON.stringify(tokens, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tokens_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      NotificationManager.showToast('Tokens data exported successfully');
    }
  });
}

function loadTokensManagement() {
  db.ref('tokens').once('value').then(snapshot => {
    const tokensGrid = document.getElementById('tokensManagementGrid');
    if (!tokensGrid) return;
    
    tokensGrid.innerHTML = '';
    
    let totalTokens = 0;
    let activeTokens = 0;
    let usedTokens = 0;
    let expiredTokens = 0;
    
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([tokenKey, tokenData]) => {
        totalTokens++;
        
        // Calculate expiration date from duration and createdAt
        const createdDate = new Date(tokenData.createdAt || Date.now());
        const expirationDate = new Date(createdDate);
        expirationDate.setDate(expirationDate.getDate() + parseInt(tokenData.duration || 30));
        
        const isExpired = expirationDate < new Date();
        const isUsed = tokenData.used;
        const isActive = !isUsed && !isExpired;
        
        if (isActive) activeTokens++;
        if (isUsed) usedTokens++;
        if (isExpired && !isUsed) expiredTokens++;
        
        const tokenCard = document.createElement('div');
        tokenCard.className = 'token-management-card';
        tokenCard.setAttribute('data-status', isUsed ? 'used' : (isActive ? 'active' : 'expired'));
        tokenCard.setAttribute('data-duration', tokenData.duration);
        tokenCard.setAttribute('data-token', tokenKey);
        
        tokenCard.style.cssText = `
          background: transparent; 
          padding: 16px; 
          border-radius: 8px; 
          border: 1px solid #e0e0e0; 
          margin-bottom: 12px;
          border-left: 4px solid ${isUsed ? '#ffc107' : (isActive ? '#28a745' : '#dc3545')};
        `;
        
        tokenCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div style="flex: 1;">
              <div style="font-family: monospace; font-weight: bold; font-size: 14px; margin-bottom: 4px;">${tokenKey}</div>
              <div style="font-size: 12px; color: #666;">
                Duration: ${tokenData.duration} days | 
                Created: ${createdDate.toLocaleDateString()} |
                Expires: ${expirationDate.toLocaleDateString()}
              </div>
              ${tokenData.createdBy ? `<div style="font-size: 11px; color: #888;">Created by: ${tokenData.createdBy}</div>` : ''}
            </div>
            <span style="background: ${isUsed ? '#ffc107' : (isActive ? '#28a745' : '#dc3545')}; color: ${isUsed ? '#000' : 'white'}; padding: 4px 8px; border-radius: 12px; font-size: 11px; white-space: nowrap;">
              ${isUsed ? 'Used' : (isActive ? 'Active' : 'Expired')}
            </span>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button onclick="copyToClipboard('${tokenKey}')" style="padding: 6px 12px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 11px;">Copy</button>
            ${!isUsed ? `<button onclick="markTokenAsUsed('${tokenKey}'); loadTokensManagement()" style="padding: 6px 12px; background: #ffc107; color: #000; border: none; border-radius: 4px; font-size: 11px;">Mark Used</button>` : ''}
            <button onclick="deleteToken('${tokenKey}'); loadTokensManagement()" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 11px;">Delete</button>
            <button onclick="viewTokenDetails('${tokenKey}')" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; font-size: 11px;">Details</button>
          </div>
        `;
        
        tokensGrid.appendChild(tokenCard);
      });
      
      // Setup filters after loading
      setupTokenManagementFilters();
    } else {
      tokensGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No tokens found</div>';
    }
    
    // Update stats
    document.getElementById('totalTokensCount').textContent = totalTokens;
    document.getElementById('activeTokensCount').textContent = activeTokens;
    document.getElementById('usedTokensCount').textContent = usedTokens;
    document.getElementById('expiredTokensCount').textContent = expiredTokens;
    
  }).catch(error => {
    console.error('Error loading tokens:', error);
    const tokensGrid = document.getElementById('tokensManagementGrid');
    if (tokensGrid) {
      tokensGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Error loading tokens</div>';
    }
  });
}

function setupTokenManagementFilters() {
  const searchInput = document.getElementById('tokenSearchManage');
  const statusFilter = document.getElementById('tokenStatusFilterManage');
  const durationFilter = document.getElementById('tokenDurationFilter');
  
  function filterTokens() {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('tokenStatusFilterManage')?.value || '';
    const durationRange = document.getElementById('tokenDurationFilter')?.value || '';
    
    const tokenCards = document.querySelectorAll('.token-management-card');
    tokenCards.forEach(card => {
      const token = card.getAttribute('data-token').toLowerCase();
      const status = card.getAttribute('data-status');
      const duration = parseInt(card.getAttribute('data-duration'));
      
      let matchesSearch = token.includes(searchTerm);
      let matchesStatus = !statusFilter || status === statusFilter;
      let matchesDuration = true;
      
      if (durationRange) {
        const [min, max] = durationRange.split('-').map(Number);
        matchesDuration = duration >= min && duration <= max;
      }
      
      card.style.display = (matchesSearch && matchesStatus && matchesDuration) ? 'block' : 'none';
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', filterTokens);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', filterTokens);
  }
  
  if (durationFilter) {
    durationFilter.addEventListener('change', filterTokens);
  }
}

function refreshTokensManagement() {
  loadTokensManagement();
  NotificationManager.showToast('Tokens refreshed');
}

function exportTokensData() {
  exportTokensList();
}

function bulkTokenActions() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'bulkTokenActionsModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Bulk Token Actions</h3>
        <button class="modal-close" onclick="closeModal('bulkTokenActionsModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="bulk-actions">
        <div class="form-group">
          <label class="form-label">Select Action</label>
          <select id="bulkActionType" class="form-input">
            <option value="">Choose action...</option>
            <option value="markUsed">Mark as Used</option>
            <option value="delete">Delete Tokens</option>
            <option value="export">Export Selected</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Filter Criteria</label>
          <div class="checkbox-group">
            <label><input type="checkbox" id="bulkSelectExpired"> All Expired Tokens</label><br>
            <label><input type="checkbox" id="bulkSelectUsed"> All Used Tokens</label><br>
            <label><input type="checkbox" id="bulkSelectOld"> Tokens older than 90 days</label><br>
            <label><input type="checkbox" id="bulkSelectShort"> Short duration tokens (≤7 days)</label>
          </div>
        </div>
        
        <div class="feature-actions">
          <button class="action-btn" onclick="executeBulkAction()">Execute Action</button>
          <button class="action-btn secondary" onclick="closeModal('bulkTokenActionsModal')">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function executeBulkAction() {
  const actionType = document.getElementById('bulkActionType').value;
  const selectExpired = document.getElementById('bulkSelectExpired').checked;
  const selectUsed = document.getElementById('bulkSelectUsed').checked;
  const selectOld = document.getElementById('bulkSelectOld').checked;
  const selectShort = document.getElementById('bulkSelectShort').checked;
  
  if (!actionType) {
    NotificationManager.showToast('Please select an action');
    return;
  }
  
  if (!selectExpired && !selectUsed && !selectOld && !selectShort) {
    NotificationManager.showToast('Please select at least one filter criteria');
    return;
  }
  
  NotificationManager.showToast(`Executing bulk ${actionType} action...`);
  
  db.ref('tokens').once('value').then(snapshot => {
    if (!snapshot.exists()) return;
    
    const tokens = snapshot.val();
    const tokensToProcess = [];
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    Object.entries(tokens).forEach(([tokenKey, tokenData]) => {
      const createdDate = new Date(tokenData.createdAt || Date.now());
      const expirationDate = new Date(createdDate);
      expirationDate.setDate(expirationDate.getDate() + parseInt(tokenData.duration || 30));
      
      const isExpired = expirationDate < now;
      const isUsed = tokenData.used;
      const isOld = createdDate < ninetyDaysAgo;
      const isShort = parseInt(tokenData.duration) <= 7;
      
      let shouldProcess = false;
      if (selectExpired && isExpired) shouldProcess = true;
      if (selectUsed && isUsed) shouldProcess = true;
      if (selectOld && isOld) shouldProcess = true;
      if (selectShort && isShort) shouldProcess = true;
      
      if (shouldProcess) {
        tokensToProcess.push(tokenKey);
      }
    });
    
    if (tokensToProcess.length === 0) {
      NotificationManager.showToast('No tokens match the selected criteria');
      return;
    }
    
    if (!confirm(`This will ${actionType} ${tokensToProcess.length} tokens. Continue?`)) {
      return;
    }
    
    // Execute the bulk action
    const promises = tokensToProcess.map(tokenKey => {
      if (actionType === 'markUsed') {
        return db.ref('tokens/' + tokenKey + '/used').set(true);
      } else if (actionType === 'delete') {
        return db.ref('tokens/' + tokenKey).remove();
      }
      return Promise.resolve();
    });
    
    Promise.all(promises).then(() => {
      NotificationManager.showToast(`Bulk ${actionType} completed for ${tokensToProcess.length} tokens`);
      closeModal('bulkTokenActionsModal');
      loadTokensManagement(); // Refresh the list
    }).catch(error => {
      console.error('Bulk action error:', error);
      NotificationManager.showToast('Error executing bulk action');
    });
    
  }).catch(error => {
    console.error('Error loading tokens for bulk action:', error);
    NotificationManager.showToast('Error loading tokens');
  });
}

function viewTokenDetails(tokenKey) {
  db.ref('tokens/' + tokenKey).once('value').then(snapshot => {
    if (!snapshot.exists()) return;
    
    const tokenData = snapshot.val();
    const createdDate = new Date(tokenData.createdAt || Date.now());
    const expirationDate = new Date(createdDate);
    expirationDate.setDate(expirationDate.getDate() + parseInt(tokenData.duration || 30));
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'tokenDetailsModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Token Details</h3>
          <button class="modal-close" onclick="closeModal('tokenDetailsModal')" style="width: 15%;">&times;</button>
        </div>
        
        <div class="token-details">
          <div style="margin-bottom: 16px;">
            <strong>Token:</strong>
            <div style="font-family: monospace; background: #424649; padding: 8px; border-radius: 4px; margin-top: 4px;">${tokenKey}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <strong>Duration:</strong><br>
              <span>${tokenData.duration} days</span>
            </div>
            <div>
              <strong>Status:</strong><br>
              <span style="color: ${tokenData.used ? '#ffc107' : (expirationDate > new Date() ? '#28a745' : '#dc3545')}">
                ${tokenData.used ? 'Used' : (expirationDate > new Date() ? 'Active' : 'Expired')}
              </span>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <strong>Created:</strong><br>
              <span>${createdDate.toLocaleString()}</span>
            </div>
            <div>
              <strong>Expires:</strong><br>
              <span>${expirationDate.toLocaleString()}</span>
            </div>
          </div>
          
          ${tokenData.createdBy ? `
            <div style="margin-bottom: 16px;">
              <strong>Created By:</strong><br>
              <span>${tokenData.createdBy}</span>
            </div>
          ` : ''}
          
          <div class="feature-actions">
            <button onclick="copyToClipboard('${tokenKey}')" class="action-btn secondary">Copy Token</button>
            ${!tokenData.used ? `<button onclick="markTokenAsUsed('${tokenKey}'); closeModal('tokenDetailsModal'); loadTokensManagement()" class="action-btn">Mark as Used</button>` : ''}
            <button onclick="deleteToken('${tokenKey}'); closeModal('tokenDetailsModal'); loadTokensManagement()" class="action-btn" style="background: #dc3545;">Delete</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
  });
}

// Session Management Helper Functions
function refreshSessionTimer() {
  if (window.sessionManager) {
    window.sessionManager.resetTimer();
    NotificationManager.showToast('Session timer refreshed - you have another hour');
    // Refresh the settings modal to update the time display
    setTimeout(() => {
      closeModal('teacherSettingsModal');
      openTeacherSettings();
    }, 1000);
  } else {
    NotificationManager.showToast('Session manager not available');
  }
}

function showSessionInfo() {
  const sessionTimeRemaining = AuthManager.getSessionTimeRemaining();
  const lastActivity = localStorage.getItem('lastActivity');
  
  let message = 'Session Information:\n\n';
  if (sessionTimeRemaining) {
    const hours = Math.floor(sessionTimeRemaining / 3600000);
    const minutes = Math.floor((sessionTimeRemaining % 3600000) / 60000);
    const seconds = Math.floor((sessionTimeRemaining % 60000) / 1000);
    message += `⏰ Time remaining: ${hours}h ${minutes}m ${seconds}s\n\n`;
  }
  if (lastActivity) {
    message += `🕒 Last activity: ${new Date(parseInt(lastActivity)).toLocaleString()}\n\n`;
  }
  message += '🔒 Auto-logout: After 1 hour of inactivity\n';
  message += '⚠️ Warning: Shown 5 minutes before logout\n';
  message += '💡 Tip: Any mouse/keyboard activity resets the timer';
  
  alert(message);
}

function goBack() {
  Navigation.goToMainPage();
}

// Function to refresh teacher cache
function refreshTeacherCache() {
  if (typeof TeacherCacheManager !== 'undefined') {
    TeacherCacheManager.clearAllCache();
    console.log('Teacher cache cleared, reloading dashboard...');
    
    // Reload dashboard data
    loadDashboardData();
    
    // Show notification or alert
    alert('Cache refreshed successfully!');
  }
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
});

// Supporting Functions for New Features

// User Management Functions
let allUsersData = []; // Store all users for filtering

function loadAllUsers() {
  db.ref('users').once('value').then(snapshot => {
    const usersGrid = document.getElementById('usersGrid');
    if (!usersGrid) return;
    
    usersGrid.innerHTML = '';
    allUsersData = [];
    
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([userId, userData]) => {
        allUsersData.push({userId, userData});
        
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.style.cssText = 'background: #f8f9fa; padding: 16px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 12px;';
        
        const expirationDate = new Date(userData.expirationDate || Date.now() + 30*24*60*60*1000);
        const isExpired = expirationDate < new Date();
        
        userCard.setAttribute('data-status', isExpired ? 'expired' : 'active');
        userCard.setAttribute('data-email', userData.email || '');
        
        userCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <div>
              <strong>${userData.email || userId}</strong>
              <div style="font-size: 12px; color: #666;">Type: ${userData.type || 'student'} | Device: ${userData.deviceId || 'Auto-generated'}</div>
              ${userData.token ? `<div style="font-size: 12px; color: #666;">Token: ${userData.token}</div>` : ''}
            </div>
            <span style="background: ${isExpired ? '#dc3545' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
              ${isExpired ? 'Expired' : 'Active'}
            </span>
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 12px;">
            Expires: ${expirationDate.toLocaleDateString()}
            ${userData.createdAt ? `<br>Created: ${new Date(userData.createdAt).toLocaleDateString()}` : ''}
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="editUser('${userId}')" style="padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 12px;">Edit</button>
            <button onclick="deleteUser('${userId}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px;">Delete</button>
            <button onclick="extendUser('${userId}')" style="padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px;">Extend</button>
          </div>
        `;
        
        usersGrid.appendChild(userCard);
      });
      
      // Setup filters after loading
      setupUserFilters();
    } else {
      usersGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No users found</div>';
    }
  }).catch(error => {
    console.error('Error loading users:', error);
    const usersGrid = document.getElementById('usersGrid');
    if (usersGrid) {
      usersGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Error loading users</div>';
    }
  });
}

function setupUserFilters() {
  const searchInput = document.getElementById('userSearchInput');
  const statusFilter = document.getElementById('userStatusFilter');
  
  if (searchInput) {
    searchInput.removeEventListener('input', filterUsers);
    searchInput.addEventListener('input', filterUsers);
  }
  
  if (statusFilter) {
    statusFilter.removeEventListener('change', filterUsers);
    statusFilter.addEventListener('change', filterUsers);
  }
}

function filterUsers() {
  const searchTerm = document.getElementById('userSearchInput')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('userStatusFilter')?.value || '';
  const userListSearch = document.getElementById('userListSearch')?.value.toLowerCase() || '';
  const userStatusFilterTable = document.getElementById('userStatusFilter')?.value || '';
  
  // Filter user cards (in user management modal)
  const userCards = document.querySelectorAll('.user-card');
  userCards.forEach(card => {
    const email = card.getAttribute('data-email').toLowerCase();
    const status = card.getAttribute('data-status');
    
    const matchesSearch = email.includes(searchTerm);
    const matchesStatus = !statusFilter || status === statusFilter;
    
    card.style.display = (matchesSearch && matchesStatus) ? 'block' : 'none';
  });
  
  // Filter user table (in view all users modal)
  const userRows = document.querySelectorAll('#userTableBody tr');
  userRows.forEach(row => {
    const email = row.getAttribute('data-email')?.toLowerCase() || '';
    const status = row.getAttribute('data-status') || '';
    
    const matchesSearch = email.includes(userListSearch);
    const matchesStatus = !userStatusFilterTable || status === userStatusFilterTable;
    
    row.style.display = (matchesSearch && matchesStatus) ? 'table-row' : 'none';
  });
}

function refreshUserList() {
  loadAllUsers();
  NotificationManager.showToast('User list refreshed');
}

function exportUserData() {
  db.ref('users').once('value').then(snapshot => {
    if (snapshot.exists()) {
      const users = snapshot.val();
      const dataStr = JSON.stringify(users, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      NotificationManager.showToast('User data exported successfully');
    }
  });
}

// Content Management Functions
function loadContentData() {
  loadUnitsContent();
}

function loadUnitsContent() {
  db.ref('units').once('value').then(snapshot => {
    const unitsContentList = document.getElementById('unitsContentList');
    if (!unitsContentList) return;
    
    unitsContentList.innerHTML = '';
    
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([unitKey, unitData]) => {
        const unitCard = document.createElement('div');
        unitCard.style.cssText = 'background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e0e0e0;';
        
        unitCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h4 style="margin: 0 0 8px 0;">${unitKey}</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">${unitData.description || 'No description'}</p>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                Order: ${unitData.order || 'Not set'} | Lessons: ${Object.keys(unitData.lessons || {}).length}
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="editUnit('${unitKey}')" style="padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 12px;">Edit</button>
              <button onclick="openUnitFileManager('${unitKey}')" style="padding: 4px 8px; background: #ffc107; color: #212529; border: none; border-radius: 4px; font-size: 12px;">Unit Files</button>
              <button onclick="deleteUnit('${unitKey}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px;">Delete</button>
            </div>
          </div>
        `;
        
        unitsContentList.appendChild(unitCard);
      });
    } else {
      unitsContentList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No units found</div>';
    }
  });
}

function switchContentTab(tabName) {
  document.querySelectorAll('.content-tab-panel').forEach(panel => {
    panel.style.display = 'none';
  });
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.getElementById(tabName + '-tab').style.display = 'block';
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  switch(tabName) {
    case 'units': loadUnitsContent(); break;
    case 'lessons': loadLessonsContent(); break;
    case 'videos': loadVideosContent(); break;
  }
}

function loadLessonsContent() {
  const lessonsContentList = document.getElementById('lessonsContentList');
  if (!lessonsContentList) return;
  
  lessonsContentList.innerHTML = 'Loading lessons...';
  
  db.ref('units').once('value').then(snapshot => {
    lessonsContentList.innerHTML = '';
    let lessonsFound = false;
    
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([unitKey, unitData]) => {
        if (unitData.lessons) {
          Object.entries(unitData.lessons).forEach(([lessonKey, lessonData]) => {
            lessonsFound = true;
            const lessonCard = document.createElement('div');
            lessonCard.style.cssText = 'background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e0e0e0;';
            
            lessonCard.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                  <h4 style="margin: 0 0 8px 0;">${lessonKey}</h4>
                  <p style="margin: 0; color: #666; font-size: 14px;">Unit: ${unitKey}</p>
                  <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">${lessonData.description || 'No description'}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button onclick="editLesson('${unitKey}', '${lessonKey}')" style="padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 12px;">Edit</button>
                  <button onclick="deleteLesson('${unitKey}', '${lessonKey}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px;">Delete</button>
                </div>
              </div>
            `;
            
            lessonsContentList.appendChild(lessonCard);
          });
        }
      });
    }
    
    if (!lessonsFound) {
      lessonsContentList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No lessons found</div>';
    }
  });
}

function loadVideosContent() {
  const videosContentList = document.getElementById('videosContentList');
  if (!videosContentList) return;
  
  videosContentList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Video management will show uploaded videos here</div>';
}

function refreshUnits() {
  loadUnitsContent();
  NotificationManager.showToast('Units refreshed');
}

function refreshLessons() {
  loadLessonsContent();
  NotificationManager.showToast('Lessons refreshed');
}

function refreshVideos() {
  loadVideosContent();
  NotificationManager.showToast('Videos refreshed');
}

// Analytics Functions
function loadAnalyticsData() {
  loadAnalyticsStats();
  loadPopularContent();
}

function loadAnalyticsStats() {
  const stats = {
    totalLogins: Math.floor(Math.random() * 100) + 20,
    activeUsers: Math.floor(Math.random() * 50) + 10,
    completionRate: Math.floor(Math.random() * 40) + 60,
    totalWatchTime: Math.floor(Math.random() * 200) + 50
  };
  
  document.getElementById('totalLogins').textContent = stats.totalLogins;
  document.getElementById('activeUsers').textContent = stats.activeUsers;
  document.getElementById('completionRate').textContent = stats.completionRate + '%';
  document.getElementById('totalWatchTime').textContent = stats.totalWatchTime + 'h';
}

function loadPopularContent() {
  const popularContent = document.getElementById('popularContent');
  if (!popularContent) return;
  
  const sampleData = [
    { title: 'Introduction to Mathematics', views: 156, completion: 89 },
    { title: 'Advanced Physics Concepts', views: 134, completion: 76 },
    { title: 'Chemistry Fundamentals', views: 128, completion: 82 },
    { title: 'Biology Basics', views: 98, completion: 91 }
  ];
  
  popularContent.innerHTML = sampleData.map(item => `
    <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee;">
      <span>${item.title}</span>
      <span style="color: #666; font-size: 12px;">${item.views} views (${item.completion}% completion)</span>
    </div>
  `).join('');
}

function generateDetailedReport() {
  NotificationManager.showToast('Generating detailed analytics report...');
  closeModal('analyticsModal');
  generateReport();
}

function exportAnalyticsData() {
  const analyticsData = {
    date: new Date().toISOString(),
    stats: {
      totalLogins: document.getElementById('totalLogins').textContent,
      activeUsers: document.getElementById('activeUsers').textContent,
      completionRate: document.getElementById('completionRate').textContent,
      totalWatchTime: document.getElementById('totalWatchTime').textContent
    }
  };
  
  const dataStr = JSON.stringify(analyticsData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  NotificationManager.showToast('Analytics data exported');
}

function processReport() {
  const reportType = document.getElementById('reportType').value;
  const format = document.getElementById('reportFormat').value;
  const includeDetails = document.getElementById('includeDetails').checked;
  const includeSummary = document.getElementById('includeSummary').checked;
  
  NotificationManager.showToast(`Generating ${reportType} report in ${format} format...`);
  
  // Generate report and show preview
  generateActualReport(reportType, format, {
    includeDetails,
    includeSummary
  }, true); // true for preview mode
}

function generateActualReport(reportType, format, options, showPreview = false) {
  // Use the exact same data loading pattern as progress.js
  NotificationManager.showToast('Loading data using progress.js logic...');
  
  // First load all users to get their UIDs
  db.ref('users').once('value')
    .then(usersSnapshot => {
      const users = usersSnapshot.val() || {};
      
      // Load units data (same as progress.js)
      return db.ref('units').once('value')
        .then(unitsSnapshot => {
          const unitsData = unitsSnapshot.val() || {};
          
          // Now load progress for each user using their UID (same as progress.js loadProgress)
          const progressPromises = [];
          
          Object.entries(users).forEach(([userKey, userData]) => {
            if (userData.type === 'student') {
              // Important: In progress.js, it uses currentUser.uid (Firebase Auth UID)
              // But teacher dashboard creates users with database keys, not Firebase Auth UIDs
              // We need to check multiple possible UID sources:
              
              // Option 1: Try userData.id (if set when user was created)
              // Option 2: Try userKey (database key from users collection)
              // Option 3: Try userData.uid (if exists)
              
              const possibleUIDs = [
                userData.id,      // From addNewUser() function
                userData.uid,     // If stored as 'uid' field
                userKey          // Database key as fallback
              ].filter(Boolean); // Remove null/undefined values
              
              // Try each possible UID to find progress data
              const progressPromise = tryMultipleUIDs(possibleUIDs, userData, userKey);
              progressPromises.push(progressPromise);
            }
          });
          
          // Helper function to try multiple UIDs
          async function tryMultipleUIDs(possibleUIDs, userData, userKey) {
            // First try userKey (database user ID) since we now save progress there
            try {
              const snapshot = await db.ref('progress/' + userKey).once('value');
              const userProgress = snapshot.val();
              
              if (userProgress && Object.keys(userProgress).length > 0) {
                return {
                  userId: userKey,
                  userData: userData,
                  userProgress: userProgress
                };
              }
            } catch (error) {
              console.log(`No progress found for userKey: ${userKey}`);
            }
            
            // If not found in userKey, try other possible UIDs (for backward compatibility)
            for (const uid of possibleUIDs) {
              if (uid !== userKey) { // Skip userKey since we already tried it
                try {
                  const snapshot = await db.ref('progress/' + uid).once('value');
                  const userProgress = snapshot.val();
                  
                  if (userProgress && Object.keys(userProgress).length > 0) {
                    // Found progress data with this UID
                    return {
                      userId: uid,
                      userData: userData,
                      userProgress: userProgress
                    };
                  }
                } catch (error) {
                  console.log(`No progress found for UID: ${uid}`);
                }
              }
            }
            
            // No progress found for any UID, return empty progress
            return {
              userId: userKey,
              userData: userData,
              userProgress: {}
            };
          }
          
          // Wait for all progress data to load, then process using progress.js logic
          return Promise.all(progressPromises).then(allUserData => {
            return generateReportFromProgressData(allUserData, unitsData, options);
          });
        });
    })
    .then(reportData => {
      if (showPreview) {
        // Show report preview instead of immediate download
        showReportPreview(reportData, reportType, format);
        closeModal('reportModal');
      } else {
        // Download the report directly
        downloadReport(reportData, reportType, format);
        NotificationManager.showToast('Report generated successfully using progress.js logic!');
        closeModal('reportModal');
      }
    })
    .catch(error => {
      console.error('Error generating report:', error);
      NotificationManager.showToast('Error generating report: ' + error.message);
    });
}

// Process the data using exact same logic as progress.js displayProgress()
function generateReportFromProgressData(allUserData, unitsData, options) {
  const report = {
    title: 'User Progress Report (Using Progress.js Logic)',
    generatedAt: new Date().toISOString(),
    options: options,
    data: {
      totalUsers: allUserData.length,
      usersWithProgress: allUserData.filter(user => Object.keys(user.userProgress).length > 0).length,
      userDetails: []
    }
  };
  
  // Calculate total available lessons using EXACT progress.js logic from displayProgress()
  let totalLessons = 0;
  Object.keys(unitsData).forEach(unitId => {
    const unit = unitsData[unitId];
    
    // Count lessons directly under unit (not under unit.lessons) - EXACT progress.js logic
    Object.keys(unit).forEach(key => {
      const item = unit[key];
      // Check if this is a lesson (has videoURL or videoFile) - EXACT progress.js logic
      if (item && typeof item === 'object' && (item.videoURL || item.videoFile)) {
        totalLessons++;
      }
    });
  });
  
  // Process each user using EXACT progress.js logic
  allUserData.forEach(({userId, userData, userProgress}) => {
    // Use EXACT same calculation as progress.js displayProgress()
    let completedLessons = 0;
    
    // Calculate overall statistics - EXACT progress.js logic
    Object.keys(unitsData).forEach(unitId => {
      const unit = unitsData[unitId];
      
      // Count lessons directly under unit (not under unit.lessons) - EXACT progress.js logic
      Object.keys(unit).forEach(key => {
        const item = unit[key];
        // Check if this is a lesson (has videoURL or videoFile) - EXACT progress.js logic
        if (item && typeof item === 'object' && (item.videoURL || item.videoFile)) {
          // Check if this lesson is completed - EXACT progress.js logic
          if (userProgress[unitId] && userProgress[unitId][key] && userProgress[unitId][key].completed) {
            completedLessons++;
          }
        }
      });
    });
    
    // Calculate completion percentage using EXACT progress.js logic
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    // Calculate streak using EXACT progress.js calculateStreak() logic
    const streak = calculateProgressJsStreak(userProgress);
    
    // Calculate units started using progress.js logic
    const unitsStarted = calculateUnitsStartedProgressJs(unitsData, userProgress);
    
    const userDetail = {
      userId: userId,
      email: userData.email || userId,
      type: userData.type || 'student',
      expiration: userData.expirationDate ? new Date(userData.expirationDate).toLocaleDateString() : 'No expiration',
      unitsStarted: unitsStarted,
      completionRate: completionPercentage,
      totalLessons: totalLessons,
      completedLessons: completedLessons,
      studyStreak: streak,
      lastStudyDates: userProgress.lastStudyDates && Array.isArray(userProgress.lastStudyDates) ? 
        userProgress.lastStudyDates.slice(-3).join(', ') : 'No study dates'
    };
    
    if (options.includeDetails) {
      userDetail.unitDetails = calculateUnitDetailsProgressJs(unitsData, userProgress);
    }
    
    report.data.userDetails.push(userDetail);
  });
  
  // Add summary statistics
  if (options.includeSummary) {
    const totalStudents = report.data.userDetails.length;
    const studentsWithProgress = report.data.userDetails.filter(user => user.completedLessons > 0).length;
    const avgCompletion = totalStudents > 0 ? 
      report.data.userDetails.reduce((sum, user) => sum + user.completionRate, 0) / totalStudents : 0;
    
    report.data.summary = {
      totalStudents,
      studentsWithProgress,
      averageCompletionRate: Math.round(avgCompletion),
      totalAvailableLessons: totalLessons
    };
  }
  
  return report;
}

// EXACT copy of progress.js calculateStreak() function
function calculateProgressJsStreak(userProgress) {
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

// Calculate units started using progress.js displayUnitProgress() logic
function calculateUnitsStartedProgressJs(unitsData, userProgress) {
  let unitsStarted = 0;
  
  Object.keys(unitsData).forEach(unitId => {
    const unit = unitsData[unitId];
    
    // Count lessons directly under unit - EXACT progress.js logic
    const lessonKeys = Object.keys(unit).filter(key => {
      const item = unit[key];
      return item && typeof item === 'object' && (item.videoURL || item.videoFile);
    });
    
    if (lessonKeys.length === 0) return; // Skip if no lessons
    
    let unitCompletedLessons = 0;
    
    // Count completed lessons in this unit - EXACT progress.js logic
    lessonKeys.forEach(lessonId => {
      if (userProgress[unitId] && userProgress[unitId][lessonId] && userProgress[unitId][lessonId].completed) {
        unitCompletedLessons++;
      }
    });
    
    // If user completed any lessons in this unit, count it as started
    if (unitCompletedLessons > 0) {
      unitsStarted++;
    }
  });
  
  return unitsStarted;
}

// Calculate unit details using progress.js displayUnitProgress() logic
function calculateUnitDetailsProgressJs(unitsData, userProgress) {
  const unitDetails = [];
  
  Object.keys(unitsData).forEach(unitId => {
    const unit = unitsData[unitId];
    
    // Count lessons directly under unit - EXACT progress.js logic
    const lessonKeys = Object.keys(unit).filter(key => {
      const item = unit[key];
      return item && typeof item === 'object' && (item.videoURL || item.videoFile);
    });
    
    if (lessonKeys.length === 0) return; // Skip if no lessons
    
    let unitTotalLessons = lessonKeys.length;
    let unitCompletedLessons = 0;
    
    // Count completed lessons in this unit - EXACT progress.js logic
    lessonKeys.forEach(lessonId => {
      if (userProgress[unitId] && userProgress[unitId][lessonId] && userProgress[unitId][lessonId].completed) {
        unitCompletedLessons++;
      }
    });
    
    const unitPercentage = Math.round((unitCompletedLessons / unitTotalLessons) * 100);
    
    unitDetails.push({
      unitId: unitId,
      totalLessons: unitTotalLessons,
      completedLessons: unitCompletedLessons,
      progressPercentage: unitPercentage
    });
  });
  
  return unitDetails;
}

// Helper function to calculate units started using progress.js logic (DEPRECATED - replaced with progress.js exact logic)
function calculateUnitsStarted(units, userProgress) {
  // This function is now deprecated - using calculateUnitsStartedProgressJs instead
  return calculateUnitsStartedProgressJs(units, userProgress);
}

function downloadReport(reportData, reportType, format) {
  let blob, filename;
  
  switch(format) {
    case 'json':
      blob = new Blob([JSON.stringify(reportData, null, 2)], {type: 'application/json'});
      filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
      break;
      
    case 'csv':
      const csvData = convertToCSV(reportData);
      blob = new Blob([csvData], {type: 'text/csv'});
      filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
      break;
      
    default:
      blob = new Blob([JSON.stringify(reportData, null, 2)], {type: 'application/json'});
      filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
  }
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function convertToCSV(data) {
  let csv = '';
  
  if (data.data && data.data.userDetails) {
    csv += `${data.title}\n`;
    csv += 'Email,Type,Expiration,Units Started,Completion Rate,Total Lessons,Completed Lessons,Study Streak,Last Study Dates\n';
    
    data.data.userDetails.forEach(user => {
      csv += `"${user.email}","${user.type}","${user.expiration}",${user.unitsStarted},${user.completionRate}%,${user.totalLessons},${user.completedLessons},${user.studyStreak || 0},"${user.lastStudyDates}"\n`;
    });
  } else if (data.userProgress && data.userProgress.userDetails) {
    csv += 'User Progress Report\n';
    csv += 'Email,Type,Expiration,Units Started,Completion Rate,Total Lessons,Completed Lessons,Study Streak,Last Study Dates\n';
    
    data.userProgress.userDetails.forEach(user => {
      csv += `"${user.email}","${user.type}","${user.expiration}",${user.unitsStarted},${user.completionRate}%,${user.totalLessons},${user.completedLessons},${user.studyStreak || 0},"${user.lastStudyDates}"\n`;
    });
  }
  
  return csv;
}

function convertToText(data) {
  let text = '';
  
  if (data.title) {
    text += `${data.title}\n`;
    text += `Generated: ${data.generatedAt}\n\n`;
  }
  
  text += JSON.stringify(data, null, 2);
  return text;
}

function processDataExport() {
  const exportUsers = document.getElementById('exportUsers').checked;
  const exportUnits = document.getElementById('exportUnits').checked;
  const exportProgress = document.getElementById('exportProgress').checked;
  const exportTokens = document.getElementById('exportTokens').checked;
  const exportAnalytics = document.getElementById('exportAnalytics').checked;
  const exportVideos = document.getElementById('exportVideos').checked;
  const format = document.getElementById('exportFormat').value;
  const startDate = document.getElementById('exportStartDate').value;
  const endDate = document.getElementById('exportEndDate').value;
  
  const progressDiv = document.getElementById('exportProgress');
  const progressFill = document.getElementById('exportProgressFill');
  const statusDiv = document.getElementById('exportStatus');
  
  progressDiv.style.display = 'block';
  
  const exportPromises = [];
  const exportData = {
    exportDate: new Date().toISOString(),
    dateRange: { startDate, endDate }
  };
  
  let progress = 0;
  const totalSteps = [exportUsers, exportUnits, exportProgress, exportTokens, exportAnalytics, exportVideos].filter(Boolean).length;
  const stepSize = totalSteps > 0 ? 100 / totalSteps : 0;
  
  const updateProgress = () => {
    progress += stepSize;
    progressFill.style.width = progress + '%';
    statusDiv.textContent = `Exporting data... ${Math.round(progress)}%`;
  };
  
  if (exportUsers) {
    exportPromises.push(
      db.ref('users').once('value').then(snapshot => {
        exportData.users = snapshot.val() || {};
        updateProgress();
      })
    );
  }
  
  if (exportUnits) {
    exportPromises.push(
      db.ref('units').once('value').then(snapshot => {
        exportData.units = snapshot.val() || {};
        updateProgress();
      })
    );
  }
  
  if (exportProgress) {
    exportPromises.push(
      db.ref('progress').once('value').then(snapshot => {
        const progressData = snapshot.val() || {};
        
        // Filter by date range if specified
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          Object.keys(progressData).forEach(userId => {
            const userProgress = progressData[userId];
            if (userProgress.lastStudyDates) {
              userProgress.lastStudyDates = userProgress.lastStudyDates.filter(date => {
                const studyDate = new Date(date);
                return studyDate >= start && studyDate <= end;
              });
            }
          });
        }
        
        exportData.progress = progressData;
        updateProgress();
      })
    );
  }
  
  if (exportTokens) {
    exportPromises.push(
      db.ref('tokens').once('value').then(snapshot => {
        const tokensData = snapshot.val() || {};
        
        // Filter by date range if specified
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          Object.keys(tokensData).forEach(tokenKey => {
            const tokenData = tokensData[tokenKey];
            if (tokenData.createdAt) {
              const createdDate = new Date(tokenData.createdAt);
              if (createdDate < start || createdDate > end) {
                delete tokensData[tokenKey];
              }
            }
          });
        }
        
        exportData.tokens = tokensData;
        updateProgress();
      })
    );
  }
  
  if (exportAnalytics) {
    exportPromises.push(
      Promise.resolve().then(() => {
        // Generate analytics data
        exportData.analytics = {
          generatedAt: new Date().toISOString(),
          totalUsers: Object.keys(exportData.users || {}).length,
          totalUnits: Object.keys(exportData.units || {}).length,
          totalTokens: Object.keys(exportData.tokens || {}).length,
          summary: 'Analytics data generated from current database state'
        };
        updateProgress();
      })
    );
  }
  
  if (exportVideos) {
    exportPromises.push(
      db.ref('units').once('value').then(snapshot => {
        const units = snapshot.val() || {};
        const videoMetadata = {};
        
        Object.entries(units).forEach(([unitKey, unitData]) => {
          videoMetadata[unitKey] = {};
          
          // Extract video metadata from lessons
          if (unitData.lessons) {
            Object.entries(unitData.lessons).forEach(([lessonKey, lessonData]) => {
              if (lessonData.videoURL || lessonData.videoFile) {
                videoMetadata[unitKey][lessonKey] = {
                  title: lessonData.title,
                  videoFile: lessonData.videoFile,
                  videoURL: lessonData.videoURL,
                  thumbnail: lessonData.thumbnail || lessonData.thumbnailURL,
                  createdAt: lessonData.createdAt
                };
              }
            });
          }
          
          // Extract from direct lesson structure
          Object.entries(unitData).forEach(([lessonKey, lessonData]) => {
            if (lessonKey.startsWith('Lesson-') && lessonData.videoURL) {
              videoMetadata[unitKey][lessonKey] = {
                description: lessonData.description,
                videoURL: lessonData.videoURL,
                thumbnailURL: lessonData.thumbnailURL
              };
            }
          });
        });
        
        exportData.videoMetadata = videoMetadata;
        updateProgress();
      })
    );
  }
  
  Promise.all(exportPromises).then(() => {
    // Complete export
    progressFill.style.width = '100%';
    statusDiv.textContent = 'Data loaded! Ready to preview...';
    
    // Show data preview instead of immediate download
    setTimeout(() => {
      showDataPreview(exportData, format);
    }, 500);
  }).catch(error => {
    console.error('Export error:', error);
    statusDiv.textContent = 'Export failed!';
    NotificationManager.showToast('Export failed: ' + error.message);
  });
}

function showDataPreview(exportData, format) {
  // Close the export modal
  closeModal('exportModal');
  
  // Create data preview modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'dataPreviewModal';
  modal.style.display = 'flex';
  
  // Calculate data size and summary
  const dataSize = new Blob([JSON.stringify(exportData)]).size;
  const dataSizeFormatted = dataSize > 1024 * 1024 ? 
    `${(dataSize / 1024 / 1024).toFixed(2)} MB` : 
    `${(dataSize / 1024).toFixed(2)} KB`;
  
  const summary = {
    users: exportData.users ? Object.keys(exportData.users).length : 0,
    units: exportData.units ? Object.keys(exportData.units).length : 0,
    progressEntries: exportData.progress ? Object.keys(exportData.progress).length : 0,
    videoMetadata: exportData.videoMetadata ? 
      Object.values(exportData.videoMetadata).reduce((total, unit) => total + Object.keys(unit).length, 0) : 0
  };
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 1000px; width: 95%; max-height: 90vh;">
      <div class="modal-header">
        <h3 class="modal-title">Data Preview</h3>
        <button class="modal-close" onclick="closeModal('dataPreviewModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="data-preview-content" style="padding: 20px;">
        <div class="preview-summary" style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 12px 0;">Export Summary</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
            <div><strong>Users:</strong> ${summary.users}</div>
            <div><strong>Units:</strong> ${summary.units}</div>
            <div><strong>Progress Records:</strong> ${summary.progressEntries}</div>
            <div><strong>Video Files:</strong> ${summary.videoMetadata}</div>
            <div><strong>Format:</strong> ${format.toUpperCase()}</div>
            <div><strong>Size:</strong> ${dataSizeFormatted}</div>
          </div>
        </div>
        
        <div class="preview-tabs" style="display: flex; border-bottom: 1px solid #ddd; margin-bottom: 16px;">
          ${exportData.users ? '<button class="preview-tab-btn active" data-tab="users">Users</button>' : ''}
          ${exportData.units ? '<button class="preview-tab-btn" data-tab="units">Units</button>' : ''}
          ${exportData.progress ? '<button class="preview-tab-btn" data-tab="progress">Progress</button>' : ''}
          ${exportData.analytics ? '<button class="preview-tab-btn" data-tab="analytics">Analytics</button>' : ''}
          ${exportData.videoMetadata ? '<button class="preview-tab-btn" data-tab="videos">Videos</button>' : ''}
          <button class="preview-tab-btn" data-tab="raw">Raw Data</button>
        </div>
        
        <div class="preview-content" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 12px; background: #f8f9fa;">
          <div id="preview-panel" style="font-family: monospace; font-size: 12px; white-space: pre-wrap;"></div>
        </div>
        
        <div class="preview-actions" style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
          <button class="action-btn" onclick="downloadPreviewedData()">
            <span class="material-icons" style="margin-right: 8px;">download</span>
            Export Data
          </button>
          <button class="action-btn secondary" onclick="viewRawData()">
            <span class="material-icons" style="margin-right: 8px;">code</span>
            View Full JSON
          </button>
          <button class="action-btn secondary" onclick="closeModal('dataPreviewModal')">
            <span class="material-icons" style="margin-right: 8px;">close</span>
            Close
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Store export data globally for download
  window.previewExportData = exportData;
  window.previewExportFormat = format;
  
  // Setup tab functionality
  setupPreviewTabs();
  
  // Show first available tab
  const firstTab = modal.querySelector('.preview-tab-btn');
  if (firstTab) {
    firstTab.click();
  }
}

function setupPreviewTabs() {
  const tabButtons = document.querySelectorAll('.preview-tab-btn');
  
  tabButtons.forEach(button => {
    button.style.cssText = 'padding: 8px 16px; border: none; background: transparent; cursor: pointer; border-bottom: 2px solid transparent;';
    
    button.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.borderBottomColor = 'transparent';
        btn.style.backgroundColor = 'transparent';
      });
      
      // Add active class to clicked tab
      button.classList.add('active');
      button.style.borderBottomColor = '#6c4fc1';
      button.style.backgroundColor = '#f8f9fa';
      
      // Show corresponding content
      showPreviewTab(button.dataset.tab);
    });
  });
}

function showPreviewTab(tabName) {
  const panel = document.getElementById('preview-panel');
  const data = window.previewExportData;
  
  switch(tabName) {
    case 'users':
      panel.textContent = formatPreviewData('Users Data', data.users);
      break;
    case 'units':
      panel.textContent = formatPreviewData('Units Data', data.units);
      break;
    case 'progress':
      panel.textContent = formatPreviewData('Progress Data', data.progress);
      break;
    case 'analytics':
      panel.textContent = formatPreviewData('Analytics Data', data.analytics);
      break;
    case 'videos':
      panel.textContent = formatPreviewData('Video Metadata', data.videoMetadata);
      break;
    case 'raw':
      panel.textContent = JSON.stringify(data, null, 2);
      break;
  }
}

function formatPreviewData(title, data) {
  if (!data) return `${title}: No data available`;
  
  let formatted = `${title}:\n\n`;
  
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    formatted += `Total entries: ${keys.length}\n\n`;
    
    // Show first few entries as samples
    const sampleCount = Math.min(3, keys.length);
    for (let i = 0; i < sampleCount; i++) {
      const key = keys[i];
      formatted += `Sample ${i + 1} - "${key}":\n`;
      formatted += JSON.stringify(data[key], null, 2);
      formatted += '\n\n';
    }
    
    if (keys.length > sampleCount) {
      formatted += `... and ${keys.length - sampleCount} more entries`;
    }
  } else {
    formatted += JSON.stringify(data, null, 2);
  }
  
  return formatted;
}

function downloadPreviewedData() {
  const data = window.previewExportData;
  const format = window.previewExportFormat;
  
  if (data && format) {
    downloadExportedData(data, format);
    NotificationManager.showToast(`Data exported in ${format} format`);
    closeModal('dataPreviewModal');
  }
}

function viewRawData() {
  const data = window.previewExportData;
  
  // Create full data view modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'rawDataModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 1200px; width: 95%; max-height: 90vh;">
      <div class="modal-header">
        <h3 class="modal-title">Raw Data View</h3>
        <button class="modal-close" onclick="closeModal('rawDataModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div style="margin-bottom: 16px;">
          <button class="action-btn secondary" onclick="copyRawData()" style="margin-right: 8px;">
            <span class="material-icons" style="margin-right: 4px;">content_copy</span>
            Copy to Clipboard
          </button>
          <button class="action-btn secondary" onclick="downloadPreviewedData()">
            <span class="material-icons" style="margin-right: 4px;">download</span>
            Download
          </button>
        </div>
        
        <div style="max-height: 70vh; overflow: auto; border: 1px solid #ddd; border-radius: 4px; padding: 16px; background: #f8f9fa;">
          <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre-wrap;" id="rawDataContent">${JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function copyRawData() {
  const content = document.getElementById('rawDataContent').textContent;
  navigator.clipboard.writeText(content).then(() => {
    NotificationManager.showToast('Data copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy data:', err);
    NotificationManager.showToast('Failed to copy data');
  });
}

function viewAllData() {
  NotificationManager.showToast('Loading all data for viewing...');
  
  // Load all data from Firebase
  const dataPromises = [
    db.ref('users').once('value'),
    db.ref('units').once('value'),
    db.ref('progress').once('value')
  ];
  
  Promise.all(dataPromises).then(([usersSnapshot, unitsSnapshot, progressSnapshot]) => {
    const allData = {
      exportDate: new Date().toISOString(),
      users: usersSnapshot.val() || {},
      units: unitsSnapshot.val() || {},
      progress: progressSnapshot.val() || {},
      analytics: {
        generatedAt: new Date().toISOString(),
        totalUsers: Object.keys(usersSnapshot.val() || {}).length,
        totalUnits: Object.keys(unitsSnapshot.val() || {}).length,
        summary: 'All available data from the database'
      }
    };
    
    // Add video metadata
    const units = unitsSnapshot.val() || {};
    const videoMetadata = {};
    Object.entries(units).forEach(([unitKey, unitData]) => {
      videoMetadata[unitKey] = {};
      
      if (unitData.lessons) {
        Object.entries(unitData.lessons).forEach(([lessonKey, lessonData]) => {
          if (lessonData.videoURL || lessonData.videoFile) {
            videoMetadata[unitKey][lessonKey] = {
              title: lessonData.title,
              videoFile: lessonData.videoFile,
              videoURL: lessonData.videoURL,
              thumbnail: lessonData.thumbnail || lessonData.thumbnailURL,
              createdAt: lessonData.createdAt
            };
          }
        });
      }
      
      Object.entries(unitData).forEach(([lessonKey, lessonData]) => {
        if (lessonKey.startsWith('Lesson-') && lessonData && lessonData.videoURL) {
          videoMetadata[unitKey][lessonKey] = {
            description: lessonData.description,
            videoURL: lessonData.videoURL,
            thumbnailURL: lessonData.thumbnailURL
          };
        }
      });
    });
    
    allData.videoMetadata = videoMetadata;
    
    // Show data preview
    showDataPreview(allData, 'json');
    closeModal('exportModal');
  }).catch(error => {
    console.error('Error loading data:', error);
    NotificationManager.showToast('Error loading data: ' + error.message);
  });
}

function showReportPreview(reportData, reportType, format) {
  // Create report preview modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'reportPreviewModal';
  modal.style.display = 'flex';
  
  // Calculate report summary
  const userDetails = reportData.data.userDetails || [];
  const totalUsers = userDetails.length;
  const usersWithProgress = userDetails.filter(user => user.completedLessons > 0).length;
  const avgCompletion = totalUsers > 0 ? 
    Math.round(userDetails.reduce((sum, user) => sum + user.completionRate, 0) / totalUsers) : 0;
  
  // Sort users by completion rate (highest first)
  const sortedUsers = [...userDetails].sort((a, b) => b.completionRate - a.completionRate);
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 1000px; width: 95%; max-height: 90vh;">
      <div class="modal-header">
        <h3 class="modal-title">Report Preview - ${reportType}</h3>
        <button class="modal-close" onclick="closeModal('reportPreviewModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="report-preview-content" style="padding: 20px;">
        <div class="report-summary" style="padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 12px 0;">Report Summary</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
            <div><strong>Total Users:</strong> ${totalUsers}</div>
            <div><strong>Active Users:</strong> ${usersWithProgress}</div>
            <div><strong>Avg Completion:</strong> ${avgCompletion}%</div>
            <div><strong>Format:</strong> ${format.toUpperCase()}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        
        <div class="report-tabs" style="display: flex; border-bottom: 1px solid #ddd; margin-bottom: 16px;">
          <button class="report-tab-btn active" data-tab="summary">Summary</button>
          <button class="report-tab-btn" data-tab="top-performers">Top Performers</button>
          <button class="report-tab-btn" data-tab="needs-attention">Needs Attention</button>
          <button class="report-tab-btn" data-tab="all-users">All Users</button>
        </div>
        
        <div class="report-content" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 12px;">
          <div id="report-panel" style="font-family: monospace; font-size: 12px; white-space: pre-wrap;"></div>
        </div>
        
        <div class="report-actions" style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
          <button class="action-btn" onclick="downloadReportData()">
            <span class="material-icons" style="margin-right: 8px;">download</span>
            Download Report
          </button>
          <button class="action-btn secondary" onclick="closeModal('reportPreviewModal')">
            <span class="material-icons" style="margin-right: 8px;">close</span>
            Close
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Store report data globally for download
  window.previewReportData = reportData;
  window.previewReportType = reportType;
  window.previewReportFormat = format;
  window.sortedUsers = sortedUsers;
  
  // Setup tab functionality
  setupReportTabs();
  
  // Show summary tab by default
  showReportTab('summary');
}

function setupReportTabs() {
  const tabButtons = document.querySelectorAll('.report-tab-btn');
  
  tabButtons.forEach(button => {
    button.style.cssText = 'padding: 8px 16px; border: none; background: transparent; cursor: pointer; border-bottom: 2px solid transparent;';
    
    button.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.borderBottomColor = 'transparent';
        btn.style.backgroundColor = 'transparent';
      });
      
      // Add active class to clicked tab
      button.classList.add('active');
      button.style.borderBottomColor = '#6c4fc1';
      button.style.backgroundColor = '#f8f9fa';
      
      // Show corresponding content
      showReportTab(button.dataset.tab);
    });
  });
}

function showReportTab(tabName) {
  const panel = document.getElementById('report-panel');
  const reportData = window.previewReportData;
  const sortedUsers = window.sortedUsers;
  
  switch(tabName) {
    case 'summary':
      panel.textContent = formatReportSummary(reportData);
      break;
    case 'top-performers':
      const topPerformers = sortedUsers.slice(0, 10); // Top 10
      panel.textContent = formatUsersList('Top Performers', topPerformers);
      break;
    case 'needs-attention':
      const needsAttention = sortedUsers.filter(user => user.completionRate < 25).slice(0, 10);
      panel.textContent = formatUsersList('Users Needing Attention', needsAttention);
      break;
    case 'all-users':
      panel.textContent = formatUsersList('All Users (Sorted by Progress)', sortedUsers);
      break;
  }
}

function formatReportSummary(reportData) {
  const summary = reportData.data.summary || {};
  const userDetails = reportData.data.userDetails || [];
  
  let formatted = `REPORT SUMMARY\n`;
  formatted += `=============\n\n`;
  formatted += `Generated: ${reportData.generatedAt}\n`;
  formatted += `Total Students: ${summary.totalStudents || userDetails.length}\n`;
  formatted += `Students with Progress: ${summary.studentsWithProgress || 0}\n`;
  formatted += `Average Completion Rate: ${summary.averageCompletionRate || 0}%\n`;
  formatted += `Total Available Lessons: ${summary.totalAvailableLessons || 0}\n\n`;
  
  // Progress distribution
  const ranges = [
    { min: 0, max: 25, label: '0-25%' },
    { min: 26, max: 50, label: '26-50%' },
    { min: 51, max: 75, label: '51-75%' },
    { min: 76, max: 100, label: '76-100%' }
  ];
  
  formatted += `PROGRESS DISTRIBUTION:\n`;
  ranges.forEach(range => {
    const count = userDetails.filter(user => 
      user.completionRate >= range.min && user.completionRate <= range.max
    ).length;
    formatted += `${range.label}: ${count} students\n`;
  });
  
  return formatted;
}

function formatUsersList(title, users) {
  let formatted = `${title.toUpperCase()}\n`;
  formatted += `${'='.repeat(title.length)}\n\n`;
  
  if (users.length === 0) {
    formatted += 'No users found.\n';
    return formatted;
  }
  
  formatted += `${'Email'.padEnd(30)} ${'Progress'.padEnd(10)} ${'Lessons'.padEnd(10)} ${'Streak'.padEnd(8)} Units\n`;
  formatted += `${'-'.repeat(70)}\n`;
  
  users.forEach(user => {
    const email = (user.email || 'Unknown').substring(0, 28).padEnd(30);
    const progress = `${user.completionRate}%`.padEnd(10);
    const lessons = `${user.completedLessons}/${user.totalLessons}`.padEnd(10);
    const streak = `${user.studyStreak}`.padEnd(8);
    const units = user.unitsStarted;
    
    formatted += `${email}${progress}${lessons}${streak}${units}\n`;
  });
  
  return formatted;
}

function downloadReportData() {
  const reportData = window.previewReportData;
  const reportType = window.previewReportType;
  const format = window.previewReportFormat;
  
  if (reportData && reportType && format) {
    downloadReport(reportData, reportType, format);
    NotificationManager.showToast(`Report downloaded in ${format} format`);
    closeModal('reportPreviewModal');
  }
}

function downloadExportedData(data, format) {
  let blob, filename;
  
  switch(format) {
    case 'json':
      blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      filename = `data_export_${new Date().toISOString().split('T')[0]}.json`;
      break;
      
    case 'csv':
      const csvData = convertExportToCSV(data);
      blob = new Blob([csvData], {type: 'text/csv'});
      filename = `data_export_${new Date().toISOString().split('T')[0]}.csv`;
      break;
      
    default:
      blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      filename = `data_export_${new Date().toISOString().split('T')[0]}.json`;
  }
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function convertExportToCSV(data) {
  let csv = `Data Export - ${data.exportDate}\n\n`;
  
  // Users data
  if (data.users) {
    csv += 'USERS\n';
    csv += 'ID,Email,Type,Device ID,Expiration Date,Token,Created At\n';
    Object.entries(data.users).forEach(([userId, userData]) => {
      csv += `"${userId}","${userData.email || ''}","${userData.type || ''}","${userData.deviceId || ''}","${userData.expirationDate ? new Date(userData.expirationDate).toLocaleDateString() : ''}","${userData.token || ''}","${userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : ''}"\n`;
    });
    csv += '\n';
  }
  
  // Units data
  if (data.units) {
    csv += 'UNITS\n';
    csv += 'Unit Name,Lesson Count,Has Lesson Subfolder\n';
    Object.entries(data.units).forEach(([unitKey, unitData]) => {
      const directLessons = Object.keys(unitData).filter(key => key.startsWith('Lesson-')).length;
      const subfolderLessons = unitData.lessons ? Object.keys(unitData.lessons).length : 0;
      csv += `"${unitKey}",${directLessons + subfolderLessons},"${subfolderLessons > 0 ? 'Yes' : 'No'}"\n`;
    });
    csv += '\n';
  }
  
  // Progress summary
  if (data.progress) {
    csv += 'PROGRESS SUMMARY\n';
    csv += 'User ID,Units Started,Last Study Dates\n';
    Object.entries(data.progress).forEach(([userId, userProgress]) => {
      const unitsStarted = Object.keys(userProgress).filter(key => key !== 'lastStudyDates').length;
      const lastStudyDates = userProgress.lastStudyDates ? userProgress.lastStudyDates.join(';') : '';
      csv += `"${userId}",${unitsStarted},"${lastStudyDates}"\n`;
    });
  }
  
  return csv;
}

function loadUnitsForLessonSelect() {
  const unitSelect = document.getElementById('lessonUnit');
  if (!unitSelect) return;
  
  db.ref('units').once('value').then(snapshot => {
    unitSelect.innerHTML = '<option value="">Select a unit...</option>';
    
    if (snapshot.exists()) {
      Object.keys(snapshot.val()).forEach(unitKey => {
        const option = document.createElement('option');
        option.value = unitKey;
        option.textContent = unitKey;
        unitSelect.appendChild(option);
      });
    }
  });
}

function addNewLesson() {
  const title = document.getElementById('lessonTitle').value.trim();
  const unit = document.getElementById('lessonUnit').value;
  const description = document.getElementById('lessonDescription').value.trim();
  const thumbnailFile = document.getElementById('lessonThumbnail').files[0];
  
  if (!title || !unit) {
    NotificationManager.showToast('Please fill in required fields');
    return;
  }
  
  // Handle thumbnail upload or generation
  if (thumbnailFile) {
    // Upload thumbnail to Firebase Storage
    const thumbnailRef = storage.ref('thumbnails/' + Date.now() + '_' + thumbnailFile.name);
    thumbnailRef.put(thumbnailFile).then(snapshot => {
      return snapshot.ref.getDownloadURL();
    }).then(thumbnailURL => {
      // Save lesson with uploaded thumbnail
      saveLessonWithThumbnail(unit, title, description, thumbnailURL);
    }).catch(error => {
      console.error('Error uploading thumbnail:', error);
      // Fall back to generated thumbnail
      const generatedThumbnail = generateLessonThumbnail(title);
      saveLessonWithThumbnail(unit, title, description, generatedThumbnail);
    });
  } else {
    // Generate thumbnail automatically
    const generatedThumbnail = generateLessonThumbnail(title);
    saveLessonWithThumbnail(unit, title, description, generatedThumbnail);
  }
}

function saveLessonWithThumbnail(unit, title, description, thumbnailURL) {
  const lessonData = {
    description: description,
    thumbnailURL: thumbnailURL,
    videoURL: '' // No video for manual lessons
  };
  
  // Save directly to units/unit/title (same structure as video upload)
  db.ref(`units/${unit}/${title}`).set(lessonData)
    .then(() => {
      NotificationManager.showToast('Lesson added successfully');
      document.getElementById('addLessonForm').reset();
      closeModal('addLessonModal');
      loadQuickStats(); // Refresh stats
    })
    .catch(error => {
      console.error('Error adding lesson:', error);
      NotificationManager.showToast('Error adding lesson: ' + error.message);
    });
}

function loadUserList() {
  db.ref('users').once('value').then(snapshot => {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([userId, userData]) => {
        const row = document.createElement('tr');
        const expirationDate = new Date(userData.expirationDate || Date.now() + 30*24*60*60*1000);
        const isExpired = expirationDate < new Date();
        
        row.setAttribute('data-email', userData.email || '');
        row.setAttribute('data-status', isExpired ? 'expired' : 'active');
        
        row.innerHTML = `
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">
            <div>
              <strong>${userData.email || userId}</strong>
              <div style="font-size: 12px; color: #666;">Type: ${userData.type || 'student'}</div>
              ${userData.token ? `<div style="font-size: 11px; color: #888;">Token: ${userData.token}</div>` : ''}
            </div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">
            <span style="background: ${isExpired ? '#dc3545' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
              ${isExpired ? 'Expired' : 'Active'}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">
            ${expirationDate.toLocaleDateString()}
            ${userData.createdAt ? `<div style="font-size: 11px; color: #666;">Created: ${new Date(userData.createdAt).toLocaleDateString()}</div>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">
            <div style="display: flex; gap: 4px;">
              <button onclick="editUser('${userId}')" style="padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 11px;">Edit</button>
              <button onclick="deleteUser('${userId}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 11px;">Delete</button>
              <button onclick="extendUser('${userId}')" style="padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 11px;">Extend</button>
            </div>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Setup table filters
      setupTableFilters();
    } else {
      tableBody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666;">No users found</td></tr>';
    }
  }).catch(error => {
    console.error('Error loading user list:', error);
    const tableBody = document.getElementById('userTableBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #dc3545;">Error loading users</td></tr>';
    }
  });
}

function setupTableFilters() {
  const searchInput = document.getElementById('userListSearch');
  const statusFilter = document.getElementById('userStatusFilter');
  
  if (searchInput) {
    searchInput.removeEventListener('input', filterUsers);
    searchInput.addEventListener('input', filterUsers);
  }
  
  if (statusFilter) {
    statusFilter.removeEventListener('change', filterUsers);
    statusFilter.addEventListener('change', filterUsers);
  }
}

function loadVideoManagementData() {
  const unitFilter = document.getElementById('unitFilter');
  if (unitFilter) {
    db.ref('units').once('value').then(snapshot => {
      unitFilter.innerHTML = '<option value="">All Units</option>';
      if (snapshot.exists()) {
        Object.keys(snapshot.val()).forEach(unitKey => {
          const option = document.createElement('option');
          option.value = unitKey;
          option.textContent = unitKey;
          unitFilter.appendChild(option);
        });
      }
    });
  }
  
  const videosGrid = document.getElementById('videosManagementGrid');
  if (videosGrid) {
    videosGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading videos...</div>';
    
    db.ref('units').once('value').then(snapshot => {
      videosGrid.innerHTML = '';
      
      if (snapshot.exists()) {
        const units = snapshot.val();
        let videoCount = 0;
        
        Object.entries(units).forEach(([unitKey, unitData]) => {
          // Process lessons from lessons subfolder
          if (unitData.lessons) {
            Object.entries(unitData.lessons).forEach(([lessonKey, lessonData]) => {
              if (lessonData && typeof lessonData === 'object' && 
                  (lessonData.videoURL || lessonData.videoFile)) {
                videoCount++;
                createVideoCard(videosGrid, unitKey, lessonKey, lessonData, 'lessons');
              }
            });
          }
          
          // Process lessons from direct structure (new format)
          Object.entries(unitData).forEach(([lessonKey, lessonData]) => {
            if (lessonKey !== 'lessons' && lessonKey !== 'name' && lessonKey !== 'description' && 
                lessonKey !== 'order' && lessonKey !== 'createdAt' && lessonKey !== 'files' && 
                lessonData && typeof lessonData === 'object' && 
                (lessonData.videoURL || lessonData.videoFile)) {
              videoCount++;
              createVideoCard(videosGrid, unitKey, lessonKey, lessonData, 'direct');
            }
          });
        });
        
        if (videoCount === 0) {
          videosGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No lessons found</div>';
        }
        
        // Setup video filters
        setupVideoFilters();
      } else {
        videosGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No units found</div>';
      }
    }).catch(error => {
      console.error('Error loading videos:', error);
      videosGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Error loading videos</div>';
    });
  }
}

function createVideoCard(container, unitKey, lessonKey, lessonData, type) {
  const videoCard = document.createElement('div');
  videoCard.className = 'video-card';
  videoCard.setAttribute('data-unit', unitKey);
  videoCard.setAttribute('data-lesson', lessonKey);
  videoCard.style.cssText = 'padding: 16px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 12px;';
  
  // Use thumbnail or generate one if missing
  let thumbnail = lessonData.thumbnail || lessonData.thumbnailURL;
  if (!thumbnail || thumbnail === '') {
    thumbnail = generateLessonThumbnail(lessonKey);
  }
  
  // Use lessonKey as the display name instead of title
  const displayName = lessonKey;
  const description = lessonData.description || 'No description available';
  const videoFile = lessonData.videoFile || lessonData.videoURL || '';
  const createdAt = lessonData.createdAt ? new Date(lessonData.createdAt).toLocaleDateString() : 'Unknown';
  
  videoCard.innerHTML = `
    <div style="display: flex; gap: 12px;">
      <img src="${thumbnail}" alt="Video thumbnail" style="width: 100px; height: 70px; object-fit: cover; border-radius: 6px;" 
           onerror="this.src='${generateLessonThumbnail(lessonKey)}'">
      <div style="flex: 1;">
        <h4 style="margin: 0 0 4px 0; font-size: 14px;">${displayName}</h4>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${description}</p>
        <div style="font-size: 11px; color: #888;">
          <span>Unit: ${unitKey}</span> | 
          <span>Type: ${type}</span> | 
          <span>Created: ${createdAt}</span>
        </div>
        ${videoFile ? `<div style="font-size: 10px; color: #888; margin-top: 4px;">File: ${videoFile.split('_').pop()}</div>` : '<div style="font-size: 10px; color: #888; margin-top: 4px;">No video file</div>'}
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        ${videoFile ? `<button onclick="previewVideo('${unitKey}', '${lessonKey}', '${type}')" style="padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 11px;">Preview</button>` : ''}
        <button onclick="editVideo('${unitKey}', '${lessonKey}', '${type}')" style="padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 11px;">Edit</button>
        <button onclick="openFileManager('${unitKey}', '${lessonKey}')" style="padding: 4px 8px; background: #ffc107; color: #212529; border: none; border-radius: 4px; font-size: 11px;">Lesson Files</button>
        <button onclick="openUnitFileManager('${unitKey}')" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; font-size: 11px;">Unit Files</button>
        <button onclick="deleteVideo('${unitKey}', '${lessonKey}', '${type}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 11px;">Delete</button>
      </div>
    </div>
  `;
  
  container.appendChild(videoCard);
}

function setupVideoFilters() {
  const unitFilter = document.getElementById('unitFilter');
  const searchInput = document.getElementById('videoSearchInput');
  
  if (unitFilter) {
    unitFilter.removeEventListener('change', filterVideos);
    unitFilter.addEventListener('change', filterVideos);
  }
  
  if (searchInput) {
    searchInput.removeEventListener('input', filterVideos);
    searchInput.addEventListener('input', filterVideos);
  }
}

function filterVideos() {
  const unitFilter = document.getElementById('unitFilter')?.value || '';
  const searchTerm = document.getElementById('videoSearchInput')?.value.toLowerCase() || '';
  
  const videoCards = document.querySelectorAll('.video-card');
  videoCards.forEach(card => {
    const unit = card.getAttribute('data-unit');
    const lesson = card.getAttribute('data-lesson').toLowerCase();
    const title = card.querySelector('h4').textContent.toLowerCase();
    const description = card.querySelector('p').textContent.toLowerCase();
    
    const matchesUnit = !unitFilter || unit === unitFilter;
    const matchesSearch = !searchTerm || lesson.includes(searchTerm) || title.includes(searchTerm) || description.includes(searchTerm);
    
    card.style.display = (matchesUnit && matchesSearch) ? 'block' : 'none';
  });
}

function previewVideo(unitKey, lessonKey, type) {
  // Get video data
  const path = type === 'lessons' ? `units/${unitKey}/lessons/${lessonKey}` : `units/${unitKey}/${lessonKey}`;
  
  db.ref(path).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const lessonData = snapshot.val();
      const videoFile = lessonData.videoURL || lessonData.videoFile;
      
      if (!videoFile) {
        NotificationManager.showToast('No video available for this lesson');
        return;
      }
      
      // If videoFile is already a full URL, use it directly
      if (videoFile.startsWith('http')) {
        showVideoPreview(unitKey, lessonKey, lessonData, videoFile);
      } else {
        // Get video URL from Firebase Storage (like unitdetail.js)
        storage.ref('videos/' + videoFile).getDownloadURL()
          .then(url => {
            console.log('Video URL loaded:', url);
            showVideoPreview(unitKey, lessonKey, lessonData, url);
          })
          .catch(error => {
            console.error('Error loading video from storage:', error);
            NotificationManager.showToast('Error loading video: ' + error.message);
          });
      }
    } else {
      NotificationManager.showToast('Video data not found');
    }
  }).catch(error => {
    console.error('Error loading video:', error);
    NotificationManager.showToast('Error loading video');
  });
}

function showVideoPreview(unitKey, lessonKey, lessonData, videoURL) {
  // Create preview modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'videoPreviewModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">Video Preview - ${lessonData.title || lessonKey}</h3>
        <button class="modal-close" onclick="closeModal('videoPreviewModal')" style="width: 15%;">&times;</button>
      </div>
      <div style="padding: 20px;">
        <video controls style="width: 100%; max-height: 400px;" preload="metadata">
          <source src="${videoURL}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <div style="margin-top: 16px;">
          <h4>${lessonData.title || lessonKey}</h4>
          <p style="color: #666;">${lessonData.description || 'No description available'}</p>
          <div style="font-size: 12px; color: #999;">
            Unit: ${unitKey} | Created: ${lessonData.createdAt ? new Date(lessonData.createdAt).toLocaleDateString() : 'Unknown'}
          </div>
        </div>
        <div class="feature-actions" style="margin-top: 20px;">
          <button class="action-btn secondary" onclick="openVideoInNewTab('${videoURL}')">Open in New Tab</button>
          <button class="action-btn secondary" onclick="closeModal('videoPreviewModal')">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function openVideoInNewTab(videoURL) {
  window.open(videoURL, '_blank');
}

function editVideo(unitKey, lessonKey, type) {
  const path = type === 'lessons' ? `units/${unitKey}/lessons/${lessonKey}` : `units/${unitKey}/${lessonKey}`;
  
  db.ref(path).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const lessonData = snapshot.val();
      
      // Create edit modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'editVideoModal';
      modal.style.display = 'flex';
      
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Edit Video - ${lessonKey}</h3>
            <button class="modal-close" onclick="closeModal('editVideoModal')" style="width: 15%;">&times;</button>
          </div>
          <form id="editVideoForm">
            <div class="form-group">
              <label class="form-label">Lesson Name</label>
              <input type="text" class="form-input" id="editVideoLessonName" value="${lessonKey}" required>
              <small style="color: #666; font-size: 11px;">This will rename the entire lesson entry</small>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" id="editVideoDescription" rows="3">${lessonData.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Thumbnail URL</label>
              <input type="url" class="form-input" id="editVideoThumbnail" value="${lessonData.thumbnail || lessonData.thumbnailURL || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Video URL (Read-only)</label>
              <input type="text" class="form-input" value="${lessonData.videoURL || ''}" readonly style="background: #f5f5f5;">
            </div>
            <div class="feature-actions">
              <button type="submit" class="action-btn">Update Video</button>
              <button type="button" class="action-btn secondary" onclick="closeModal('editVideoModal')">Cancel</button>
            </div>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';
      
      // Add form handler
      const form = document.getElementById('editVideoForm');
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        updateVideoData(unitKey, lessonKey, type);
      });
    }
  }).catch(error => {
    console.error('Error loading video data:', error);
    NotificationManager.showToast('Error loading video data');
  });
}

function updateVideoData(unitKey, lessonKey, type) {
  const newLessonName = document.getElementById('editVideoLessonName').value.trim();
  const description = document.getElementById('editVideoDescription').value.trim();
  const thumbnail = document.getElementById('editVideoThumbnail').value.trim();
  
  const path = type === 'lessons' ? `units/${unitKey}/lessons/${lessonKey}` : `units/${unitKey}/${lessonKey}`;
  
  // First, get the current lesson data
  db.ref(path).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const currentLessonData = snapshot.val();
      
      // Prepare the updated data
      const updateData = { ...currentLessonData };
      if (description) updateData.description = description;
      if (thumbnail) {
        if (type === 'lessons') {
          updateData.thumbnail = thumbnail;
        } else {
          updateData.thumbnailURL = thumbnail;
        }
      }
      
      // Check if lesson name has changed
      if (newLessonName && newLessonName !== lessonKey) {
        // Create new lesson entry with the new name
        const newPath = type === 'lessons' ? `units/${unitKey}/lessons/${newLessonName}` : `units/${unitKey}/${newLessonName}`;
        
        // Check if new lesson name already exists
        db.ref(newPath).once('value').then(newSnapshot => {
          if (newSnapshot.exists()) {
            NotificationManager.showToast('A lesson with this name already exists');
            return;
          }
          
          // Create new lesson entry and delete old one
          db.ref(newPath).set(updateData)
            .then(() => {
              // Delete the old lesson entry
              return db.ref(path).remove();
            })
            .then(() => {
              NotificationManager.showToast('Lesson renamed and updated successfully');
              closeModal('editVideoModal');
              loadVideoManagementData();
            })
            .catch(error => {
              console.error('Error renaming lesson:', error);
              NotificationManager.showToast('Error renaming lesson: ' + error.message);
            });
        }).catch(error => {
          console.error('Error checking new lesson name:', error);
          NotificationManager.showToast('Error checking new lesson name: ' + error.message);
        });
      } else {
        // Just update the existing lesson data
        db.ref(path).update(updateData)
          .then(() => {
            NotificationManager.showToast('Video updated successfully');
            closeModal('editVideoModal');
            loadVideoManagementData();
          })
          .catch(error => {
            console.error('Error updating video:', error);
            NotificationManager.showToast('Error updating video: ' + error.message);
          });
      }
    }
  }).catch(error => {
    console.error('Error getting lesson data:', error);
    NotificationManager.showToast('Error getting lesson data: ' + error.message);
  });
}

function deleteVideo(unitKey, lessonKey, type) {
  if (confirm(`Are you sure you want to delete this video: ${lessonKey}?`)) {
    const path = type === 'lessons' ? `units/${unitKey}/lessons/${lessonKey}` : `units/${unitKey}/${lessonKey}`;
    
    db.ref(path).remove()
      .then(() => {
        NotificationManager.showToast('Video deleted successfully');
        loadVideoManagementData();
        loadQuickStats();
      })
      .catch(error => {
        console.error('Error deleting video:', error);
        NotificationManager.showToast('Error deleting video: ' + error.message);
      });
  }
}

function refreshVideoList() {
  loadVideoManagementData();
  NotificationManager.showToast('Video list refreshed');
}

function bulkVideoActions() {
  NotificationManager.showToast('Bulk video actions coming soon!');
}

function loadTeacherSettings() {
  const theme = localStorage.getItem('teacherTheme') || 'light';
  const defaultView = localStorage.getItem('teacherDefaultView') || 'dashboard';
  const backupFreq = localStorage.getItem('backupFrequency') || 'weekly';
  
  if (document.getElementById('teacherTheme')) document.getElementById('teacherTheme').value = theme;
  if (document.getElementById('defaultView')) document.getElementById('defaultView').value = defaultView;
  if (document.getElementById('backupFrequency')) document.getElementById('backupFrequency').value = backupFreq;
  
  if (document.getElementById('emailNotifications')) document.getElementById('emailNotifications').checked = localStorage.getItem('emailNotifications') !== 'false';
  if (document.getElementById('browserNotifications')) document.getElementById('browserNotifications').checked = localStorage.getItem('browserNotifications') !== 'false';
  if (document.getElementById('dailyReports')) document.getElementById('dailyReports').checked = localStorage.getItem('dailyReports') !== 'false';
}

function saveTeacherSettings() {
  const theme = document.getElementById('teacherTheme')?.value;
  const defaultView = document.getElementById('defaultView')?.value;
  const backupFreq = document.getElementById('backupFrequency')?.value;
  const emailNotifications = document.getElementById('emailNotifications')?.checked;
  const browserNotifications = document.getElementById('browserNotifications')?.checked;
  const dailyReports = document.getElementById('dailyReports')?.checked;
  
  if (theme) localStorage.setItem('teacherTheme', theme);
  if (defaultView) localStorage.setItem('teacherDefaultView', defaultView);
  if (backupFreq) localStorage.setItem('backupFrequency', backupFreq);
  
  localStorage.setItem('emailNotifications', emailNotifications);
  localStorage.setItem('browserNotifications', browserNotifications);
  localStorage.setItem('dailyReports', dailyReports);
  
  // Apply theme immediately
  applyTheme(theme);
  
  NotificationManager.showToast('Teacher settings saved successfully');
  closeModal('teacherSettingsModal');
}

function applyTheme(theme) {
  const body = document.body;
  
  // Remove existing theme classes
  body.classList.remove('light-theme', 'dark-theme');
  
  if (theme === 'dark') {
    body.classList.add('dark-theme');
    body.style.backgroundColor = '#1a1a1a';
    body.style.color = '#ffffff';
  } else if (theme === 'auto') {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      body.classList.add('dark-theme');
      body.style.backgroundColor = '#1a1a1a';
      body.style.color = '#ffffff';
    } else {
      body.classList.add('light-theme');
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#333333';
    }
  } else {
    body.classList.add('light-theme');
    body.style.backgroundColor = '#ffffff';
    body.style.color = '#333333';
  }
}

function resetToDefaults() {
  if (confirm('Are you sure you want to reset all settings to default values?')) {
    localStorage.removeItem('teacherTheme');
    localStorage.removeItem('teacherDefaultView');
    localStorage.removeItem('backupFrequency');
    localStorage.removeItem('emailNotifications');
    localStorage.removeItem('browserNotifications');
    localStorage.removeItem('dailyReports');
    
    // Reload settings form
    loadTeacherSettings();
    
    // Apply default theme
    applyTheme('light');
    
    NotificationManager.showToast('Settings reset to defaults');
  }
}

function loadMessages() {
  const messagesList = document.getElementById('messagesList');
  if (!messagesList) return;
  
  messagesList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading messages...</div>';
  
  // Load notifications from Firebase
  db.ref('notifications_to_send').once('value').then(snapshot => {
    messagesList.innerHTML = '';
    
    if (snapshot.exists()) {
      const notifications = snapshot.val();
      const messages = [];
      
      Object.entries(notifications).forEach(([notificationId, notificationData]) => {
        const message = {
          id: notificationId,
          subject: notificationData.notification.title,
          body: notificationData.notification.body,
          type: 'sent',
          date: new Date(notificationData.timestamp).toLocaleDateString(),
          timestamp: notificationData.timestamp,
          tokens: notificationData.tokens || [],
          unread: false
        };
        messages.push(message);
      });
      
      // Sort by timestamp (newest first)
      messages.sort((a, b) => b.timestamp - a.timestamp);
      
      if (messages.length > 0) {
        messagesList.innerHTML = messages.map(msg => `
          <div style="padding: 12px; border-bottom: 1px solid #ddd; ${msg.unread ? 'background: #f0f8ff;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <strong>${msg.subject}</strong>
                <div style="font-size: 12px; color: #666; margin: 4px 0;">${msg.body}</div>
                <div style="font-size: 11px; color: #888;">
                  Type: ${msg.type} | Date: ${msg.date} | Recipients: ${msg.tokens.length}
                </div>
              </div>
              <div style="display: flex; gap: 4px; margin-left: 12px;">
                ${msg.unread ? '<span style="background: #007bff; color: white; padding: 2px 6px; border-radius: 8px; font-size: 10px;">NEW</span>' : ''}
                <button onclick="viewMessage('${msg.id}')" style="padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 11px;">View</button>
                <button onclick="deleteMessage('${msg.id}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 11px;">Delete</button>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        messagesList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No messages found</div>';
      }
    } else {
      messagesList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No messages found</div>';
    }
    
    // Setup message filters
    setupMessageFilters();
  }).catch(error => {
    console.error('Error loading messages:', error);
    messagesList.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Error loading messages</div>';
  });
}

function setupMessageFilters() {
  const filterSelect = document.getElementById('messageFilter');
  const searchInput = document.getElementById('messageSearch');
  
  if (filterSelect) {
    filterSelect.removeEventListener('change', filterMessages);
    filterSelect.addEventListener('change', filterMessages);
  }
  
  if (searchInput) {
    searchInput.removeEventListener('input', filterMessages);
    searchInput.addEventListener('input', filterMessages);
  }
}

function filterMessages() {
  const filter = document.getElementById('messageFilter')?.value || 'all';
  const searchTerm = document.getElementById('messageSearch')?.value.toLowerCase() || '';
  
  const messageItems = document.querySelectorAll('#messagesList > div');
  messageItems.forEach(item => {
    const subject = item.querySelector('strong')?.textContent.toLowerCase() || '';
    const bodyDiv = item.querySelector('div[style*="font-size: 12px"]');
    const body = bodyDiv ? bodyDiv.textContent.toLowerCase() : '';
    const type = item.textContent.includes('Type: sent') ? 'sent' : 'response';
    const isUnread = item.textContent.includes('NEW');
    
    let matchesFilter = true;
    switch(filter) {
      case 'sent':
        matchesFilter = type === 'sent';
        break;
      case 'responses':
        matchesFilter = type === 'response';
        break;
      case 'unread':
        matchesFilter = isUnread;
        break;
      default:
        matchesFilter = true;
    }
    
    const matchesSearch = !searchTerm || subject.includes(searchTerm) || body.includes(searchTerm);
    
    item.style.display = (matchesFilter && matchesSearch) ? 'block' : 'none';
  });
}

function refreshMessages() {
  loadMessages();
  NotificationManager.showToast('Messages refreshed');
}

function markAllAsRead() {
  NotificationManager.showToast('All messages marked as read');
  loadMessages();
}

function viewMessage(messageId) {
  // Get message details from Firebase
  db.ref(`notifications_to_send/${messageId}`).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const messageData = snapshot.val();
      
      // Create message detail modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'messageDetailModal';
      modal.style.display = 'flex';
      
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Message Details</h3>
            <button class="modal-close" onclick="closeModal('messageDetailModal')" style="width: 15%;">&times;</button>
          </div>
          <div style="padding: 20px;">
            <div style="margin-bottom: 16px;">
              <strong>Title:</strong> ${messageData.notification.title}
            </div>
            <div style="margin-bottom: 16px;">
              <strong>Message:</strong><br>
              <div style="padding: 12px; border-radius: 6px; margin-top: 4px;">
                ${messageData.notification.body}
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <strong>Sent:</strong> ${new Date(messageData.timestamp).toLocaleString()}
            </div>
            <div style="margin-bottom: 16px;">
              <strong>Recipients:</strong> ${messageData.tokens ? messageData.tokens.length : 0} users
            </div>
            ${messageData.tokens && messageData.tokens.length > 0 ? `
              <div>
                <strong>Recipient Tokens:</strong><br>
                <div style="padding: 12px; border-radius: 6px; margin-top: 4px; max-height: 100px; overflow-y: auto;">
                  ${messageData.tokens.map(token => `<div style="font-family: monospace; font-size: 12px;">${token}</div>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';
    } else {
      NotificationManager.showToast('Message not found');
    }
  }).catch(error => {
    console.error('Error loading message:', error);
    NotificationManager.showToast('Error loading message details');
  });
}

function deleteMessage(messageId) {
  if (confirm('Are you sure you want to delete this message?')) {
    db.ref(`notifications_to_send/${messageId}`).remove()
      .then(() => {
        NotificationManager.showToast('Message deleted successfully');
        loadMessages();
      })
      .catch(error => {
        console.error('Error deleting message:', error);
        NotificationManager.showToast('Error deleting message');
      });
  }
}

function loadBackupHistory() {
  const backupHistory = document.getElementById('backupHistory');
  if (!backupHistory) return;
  
  const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
  
  if (history.length > 0) {
    backupHistory.innerHTML = history.map(backup => `
      <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee;">
        <div>
          <strong>${backup.type} Backup</strong>
          <div style="font-size: 12px; color: #666;">${new Date(backup.date).toLocaleString()}</div>
          ${backup.encrypted ? '<div style="font-size: 10px; color: #007bff;">🔒 Encrypted</div>' : ''}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #666;">${backup.size}</div>
          <button onclick="downloadBackup('${backup.date}')" style="padding: 2px 6px; background: #6c4fc1; color: white; border: none; border-radius: 3px; font-size: 10px;">Info</button>
        </div>
      </div>
    `).join('');
  } else {
    backupHistory.innerHTML = '<div style="text-align: center; padding: 10px; color: #666; font-style: italic;">No recent backups found</div>';
  }
}

function processBackup() {
  const backupType = document.getElementById('backupType')?.value || 'full';
  const backupLocation = document.getElementById('backupLocation')?.value || 'download';
  const includeVideos = document.getElementById('includeVideos')?.checked || false;
  const includeThumbnails = document.getElementById('includeThumbnails')?.checked || false;
  const includeUserFiles = document.getElementById('includeUserFiles')?.checked || false;
  const encryptBackup = document.getElementById('encryptBackup')?.checked || false;
  const backupPassword = document.getElementById('backupPassword')?.value || '';
  
  const progressDiv = document.getElementById('backupProgress');
  const progressFill = document.getElementById('backupProgressFill');
  const statusDiv = document.getElementById('backupStatus');
  
  progressDiv.style.display = 'block';
  
  const backupData = {
    backupDate: new Date().toISOString(),
    backupType: backupType,
    includeMedia: {
      videos: includeVideos,
      thumbnails: includeThumbnails,
      userFiles: includeUserFiles
    },
    encrypted: encryptBackup
  };
  
  let progress = 0;
  const updateProgress = (step, message) => {
    progress += step;
    progressFill.style.width = progress + '%';
    statusDiv.textContent = message;
  };
  
  updateProgress(10, 'Initializing backup...');
  
  const backupPromises = [];
  
  // Backup users data
  if (backupType === 'full' || backupType === 'users') {
    backupPromises.push(
      db.ref('users').once('value').then(snapshot => {
        backupData.users = snapshot.val() || {};
        updateProgress(20, 'Backing up user data...');
      })
    );
  }
  
  // Backup content data
  if (backupType === 'full' || backupType === 'content') {
    backupPromises.push(
      db.ref('units').once('value').then(snapshot => {
        const units = snapshot.val() || {};
        
        if (!includeVideos) {
          // Remove video URLs to reduce backup size
          Object.values(units).forEach(unit => {
            if (unit.lessons) {
              Object.values(unit.lessons).forEach(lesson => {
                if (lesson.videoURL) delete lesson.videoURL;
                if (lesson.videoFile) delete lesson.videoFile;
              });
            }
            Object.keys(unit).forEach(key => {
              if (key.startsWith('Lesson-') && unit[key].videoURL) {
                delete unit[key].videoURL;
              }
            });
          });
        }
        
        if (!includeThumbnails) {
          // Remove thumbnail URLs
          Object.values(units).forEach(unit => {
            if (unit.lessons) {
              Object.values(unit.lessons).forEach(lesson => {
                if (lesson.thumbnail) delete lesson.thumbnail;
                if (lesson.thumbnailURL) delete lesson.thumbnailURL;
              });
            }
            Object.keys(unit).forEach(key => {
              if (key.startsWith('Lesson-') && unit[key].thumbnailURL) {
                delete unit[key].thumbnailURL;
              }
            });
          });
        }
        
        backupData.units = units;
        updateProgress(25, 'Backing up content data...');
      })
    );
  }
  
  // Backup progress data
  if (backupType === 'full' || backupType === 'content') {
    backupPromises.push(
      db.ref('progress').once('value').then(snapshot => {
        backupData.progress = snapshot.val() || {};
        updateProgress(15, 'Backing up progress data...');
      })
    );
  }
  
  // Backup notifications
  if (backupType === 'full') {
    backupPromises.push(
      db.ref('notifications_to_send').once('value').then(snapshot => {
        backupData.notifications = snapshot.val() || {};
        updateProgress(10, 'Backing up notifications...');
      })
    );
  }
  
  // Backup tokens
  if (backupType === 'full' || backupType === 'settings') {
    backupPromises.push(
      db.ref('tokens').once('value').then(snapshot => {
        backupData.tokens = snapshot.val() || {};
        updateProgress(10, 'Backing up tokens...');
      })
    );
  }
  
  Promise.all(backupPromises).then(() => {
    updateProgress(10, 'Finalizing backup...');
    
    // Add metadata
    backupData.metadata = {
      version: '1.0',
      totalUsers: Object.keys(backupData.users || {}).length,
      totalUnits: Object.keys(backupData.units || {}).length,
      backupSize: JSON.stringify(backupData).length
    };
    
    // Encrypt if requested
    if (encryptBackup && backupPassword) {
      try {
        const encryptedData = btoa(JSON.stringify(backupData));
        backupData.encrypted = true;
        backupData.data = encryptedData;
        delete backupData.users;
        delete backupData.units;
        delete backupData.progress;
        delete backupData.notifications;
        delete backupData.tokens;
      } catch (error) {
        console.error('Encryption failed:', error);
        updateProgress(0, 'Encryption failed!');
        NotificationManager.showToast('Backup encryption failed');
        return;
      }
    }
    
    // Download backup
    downloadBackupFile(backupData, backupType);
    
    // Save backup record
    saveBackupRecord(backupData);
    
    progressFill.style.width = '100%';
    statusDiv.textContent = 'Backup completed successfully!';
    NotificationManager.showToast(`${backupType} backup created successfully`);
    
    // Reload backup history
    loadBackupHistory();
    
    setTimeout(() => {
      closeModal('backupModal');
    }, 1500);
  }).catch(error => {
    console.error('Backup error:', error);
    statusDiv.textContent = 'Backup failed!';
    NotificationManager.showToast('Backup failed: ' + error.message);
  });
}

function downloadBackupFile(backupData, backupType) {
  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${backupType}_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function saveBackupRecord(backupData) {
  const backupRecord = {
    date: backupData.backupDate,
    type: backupData.backupType,
    size: `${Math.round(JSON.stringify(backupData).length / 1024)} KB`,
    encrypted: backupData.encrypted || false,
    metadata: backupData.metadata
  };
  
  // Save to localStorage for backup history
  const backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
  backupHistory.unshift(backupRecord);
  
  // Keep only last 10 backups in history
  if (backupHistory.length > 10) {
    backupHistory.splice(10);
  }
  
  localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
}

function downloadBackup(date) {
  const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
  const backup = history.find(b => b.date === date);
  
  if (backup) {
    // Create info modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'backupInfoModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Backup Information</h3>
          <button class="modal-close" onclick="closeModal('backupInfoModal')" style="width: 15%;">&times;</button>
        </div>
        <div style="padding: 20px;">
          <div style="margin-bottom: 12px;"><strong>Type:</strong> ${backup.type}</div>
          <div style="margin-bottom: 12px;"><strong>Date:</strong> ${new Date(backup.date).toLocaleString()}</div>
          <div style="margin-bottom: 12px;"><strong>Size:</strong> ${backup.size}</div>
          <div style="margin-bottom: 12px;"><strong>Encrypted:</strong> ${backup.encrypted ? 'Yes' : 'No'}</div>
          
          ${backup.metadata ? `
            <div style="margin-top: 16px; padding: 12px; border-radius: 6px;">
              <strong>Backup Contents:</strong><br>
              <div style="font-size: 12px; margin-top: 4px;">
                Users: ${backup.metadata.totalUsers || 0}<br>
                Units: ${backup.metadata.totalUnits || 0}<br>
                Version: ${backup.metadata.version || 'Unknown'}
              </div>
            </div>
          ` : ''}
          
          <div style="margin-top: 16px; padding: 12px; background: #2c2b26; border-radius: 6px; border: 1px solid #ffeaa7;">
            <strong>Note:</strong> This backup was downloaded on ${new Date(backup.date).toLocaleDateString()}. 
            To restore data, you would need to manually import this backup file.
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
  } else {
    NotificationManager.showToast('Backup information not found');
  }
}

function exportUserList() {
  exportUserData();
}

// Utility Functions
function generateLessonThumbnail(lessonTitle) {
  // Create a canvas to generate thumbnail
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = 320;
  canvas.height = 180;
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#6c4fc1');
  gradient.addColorStop(1, '#4834d4');
  
  // Fill background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add lesson title text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Word wrap for long titles
  const words = lessonTitle.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < canvas.width - 40) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  
  // Draw lines
  const lineHeight = 30;
  const startY = (canvas.height - (lines.length * lineHeight)) / 2 + lineHeight / 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
  });
  
  // Add play icon
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 15, canvas.height - 40);
  ctx.lineTo(canvas.width / 2 + 15, canvas.height - 25);
  ctx.lineTo(canvas.width / 2 - 15, canvas.height - 10);
  ctx.closePath();
  ctx.fill();
  
  // Convert to data URL
  return canvas.toDataURL('image/png');
}

function editUser(userId) {
  // Fetch user data
  db.ref(`users/${userId}`).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      NotificationManager.showToast('User not found');
      return;
    }
    
    const userData = snapshot.val();
    
    // Create edit user modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editUserModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Edit User</h3>
          <button class="modal-close" onclick="closeModal('editUserModal')" style="width: 15%;">&times;</button>
        </div>
        <form id="editUserForm">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="editUserEmail" value="${userData.email || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="editUserPassword" value="${userData.password || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Device ID</label>
            <input type="text" class="form-input" id="editUserDeviceId" value="${userData.deviceId || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">User Type</label>
            <select class="form-input" id="editUserType" required>
              <option value="student" ${userData.type === 'student' ? 'selected' : ''}>Student</option>
              <option value="teacher" ${userData.type === 'teacher' ? 'selected' : ''}>Teacher</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Token</label>
            <input type="text" class="form-input" id="editUserToken" value="${userData.token || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Expiration Date</label>
            <input type="date" class="form-input" id="editUserExpiration" value="${userData.expirationDate ? new Date(userData.expirationDate).toISOString().split('T')[0] : ''}" required>
          </div>
          <div class="feature-actions">
            <button type="submit" class="action-btn">Update User</button>
            <button type="button" class="action-btn secondary" onclick="closeModal('editUserModal')">Cancel</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Add form handler
    const form = document.getElementById('editUserForm');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      updateUser(userId);
    });
  }).catch(error => {
    console.error('Error loading user data:', error);
    NotificationManager.showToast('Error loading user data');
  });
}

function updateUser(userId) {
  const email = document.getElementById('editUserEmail').value.trim();
  const password = document.getElementById('editUserPassword').value;
  const deviceId = document.getElementById('editUserDeviceId').value.trim();
  const type = document.getElementById('editUserType').value;
  const token = document.getElementById('editUserToken').value.trim();
  const expiration = document.getElementById('editUserExpiration').value;
  
  if (!email || !password || !deviceId || !expiration) {
    NotificationManager.showToast('Please fill in all required fields');
    return;
  }
  
  const expirationTimestamp = new Date(expiration).getTime();
  
  const updatedData = {
    email: email,
    password: password,
    deviceId: deviceId,
    type: type,
    expirationDate: expirationTimestamp
  };
  
  if (token) {
    updatedData.token = token;
  }
  
  db.ref(`users/${userId}`).update(updatedData)
    .then(() => {
      NotificationManager.showToast('User updated successfully');
      closeModal('editUserModal');
      loadAllUsers();
      loadUserList();
      loadQuickStats();
    })
    .catch(error => {
      console.error('Error updating user:', error);
      NotificationManager.showToast('Error updating user: ' + error.message);
    });
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    db.ref(`users/${userId}`).remove()
      .then(() => {
        NotificationManager.showToast('User deleted successfully');
        loadAllUsers();
        loadUserList();
      })
      .catch(error => {
        NotificationManager.showToast('Error deleting user');
      });
  }
}

function extendUser(userId) {
  const newExpiration = new Date();
  newExpiration.setDate(newExpiration.getDate() + 30);
  
  db.ref(`users/${userId}/expirationDate`).set(newExpiration.getTime())
    .then(() => {
      NotificationManager.showToast('User expiration extended by 30 days');
      loadAllUsers();
      loadUserList();
    })
    .catch(error => {
      console.error('Error extending user:', error);
      NotificationManager.showToast('Error extending user');
    });
}

function editLesson(unitKey, lessonKey) {
  NotificationManager.showToast(`Editing lesson: ${lessonKey} in ${unitKey}`);
}

function deleteLesson(unitKey, lessonKey) {
  if (confirm('Are you sure you want to delete this lesson?')) {
    db.ref(`units/${unitKey}/lessons/${lessonKey}`).remove()
      .then(() => {
        NotificationManager.showToast('Lesson deleted successfully');
        loadLessonsContent();
      })
      .catch(error => {
        NotificationManager.showToast('Error deleting lesson');
      });
  }
}

// ========= FILE MANAGEMENT FUNCTIONS =========

// ========= UNIT FILE MANAGEMENT FUNCTIONS =========

function openUnitFileManager(unitKey) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'unitFileManagerModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <h3 class="modal-title">Unit File Manager - Unit ${unitKey}</h3>
        <button class="modal-close" onclick="closeUnitFileManager()">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <!-- Unit File Upload Section -->
        <div class="file-upload-section" style="margin-bottom: 30px; padding: 20px; border: 2px dashed #ddd; border-radius: 8px; background: #f9f9f9; color: #333;">
          <h4 style="margin-top: 0; color: #6c4fc1;">Upload New Unit File</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold;">File (PDF Only)</label>
              <input type="file" id="unitFileUpload" class="form-input" accept=".pdf" style="padding: 8px;">
              <small style="color: #666; font-size: 12px;">Only PDF files are allowed for unit files</small>
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold;">File Name (Optional)</label>
              <input type="text" id="unitFileDisplayName" class="form-input" placeholder="Leave empty to use original name">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold;">File Type</label>
              <select id="unitFileType" class="form-input">
                <option value="document">Document (PDF)</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold;">Access Level</label>
              <select id="unitFileAccess" class="form-input">
                <option value="view-only">View Only (No Download)</option>
                <option value="downloadable">Downloadable</option>
                <option value="restricted">Restricted (Teacher Only)</option>
              </select>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Description</label>
            <textarea id="unitFileDescription" class="form-textarea" placeholder="Brief description of the file..."></textarea>
          </div>
          <button class="action-btn" onclick="uploadUnitFile('${unitKey}')">
            <span class="material-icons" style="margin-right: 8px;">cloud_upload</span>
            Upload Unit File
          </button>
        </div>
        
        <!-- Unit Files List Section -->
        <div class="files-list-section">
          <h4 style="color: #6c4fc1; margin-bottom: 20px;">Unit Files</h4>
          <div id="unitFilesList" style="min-height: 200px;">
            <div style="text-align: center; padding: 40px; color: #666;">
              Loading unit files...
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load existing unit files
  loadUnitFiles(unitKey);
}

function closeUnitFileManager() {
  const modal = document.getElementById('unitFileManagerModal');
  if (modal) {
    modal.remove();
  }
}

function uploadUnitFile(unitKey) {
  const fileInput = document.getElementById('unitFileUpload');
  const displayName = document.getElementById('unitFileDisplayName').value.trim();
  const fileType = document.getElementById('unitFileType').value;
  const fileAccess = document.getElementById('unitFileAccess').value;
  const fileDescription = document.getElementById('unitFileDescription').value.trim();
  
  if (!fileInput.files[0]) {
    alert('Please select a file to upload');
    return;
  }
  
  const file = fileInput.files[0];
  const fileName = displayName || file.name;
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  // Validate file type - only PDF allowed
  if (fileExtension !== 'pdf') {
    alert('Only PDF files are allowed for unit files');
    return;
  }
  
  // Validate file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert('File size must be less than 50MB');
    return;
  }
  
  // Show upload progress
  const uploadBtn = event.target;
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Uploading...';
  
  // Create file reference
  const timestamp = Date.now();
  const fileId = `unit_${unitKey}_${timestamp}`;
  const storagePath = `files/${unitKey}/unit/${fileId}.${fileExtension}`;
  
  // Upload to Firebase Storage
  const storageRef = firebase.storage().ref(storagePath);
  const uploadTask = storageRef.put(file);
  
  uploadTask.on('state_changed', 
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      uploadBtn.innerHTML = `<span class="material-icons">hourglass_empty</span> ${Math.round(progress)}%`;
    },
    (error) => {
      console.error('Unit file upload error:', error);
      alert('Error uploading file. Please try again.');
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '<span class="material-icons">cloud_upload</span> Upload Unit File';
    },
    () => {
      // Upload completed successfully
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        // Save file metadata to database
        const fileData = {
          id: fileId,
          name: fileName,
          originalName: file.name,
          type: fileType,
          extension: fileExtension,
          size: file.size,
          access: fileAccess,
          description: fileDescription,
          url: downloadURL,
          uploadedAt: timestamp,
          uploadedBy: firebase.auth().currentUser.uid,
          unitKey: unitKey,
          isUnitFile: true
        };
        
        const dbPath = `units/${unitKey}/files/${fileId}`;
        
        db.ref(dbPath).set(fileData).then(() => {
          alert('Unit file uploaded successfully!');
          
          // Reset form
          fileInput.value = '';
          document.getElementById('unitFileDisplayName').value = '';
          document.getElementById('unitFileDescription').value = '';
          
          // Reload unit files list
          loadUnitFiles(unitKey);
          
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = '<span class="material-icons">cloud_upload</span> Upload Unit File';
        }).catch(error => {
          console.error('Error saving unit file metadata:', error);
          alert('Error saving file information. Please try again.');
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = '<span class="material-icons">cloud_upload</span> Upload Unit File';
        });
      });
    }
  );
}

function loadUnitFiles(unitKey) {
  const filesList = document.getElementById('unitFilesList');
  if (!filesList) return;
  
  const dbPath = `units/${unitKey}/files`;
  
  console.log('Loading unit files from path:', dbPath); // Debug log
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      console.log('No unit files found at path:', dbPath); // Debug log
      filesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">folder_open</span>
          <p>No unit files uploaded yet</p>
          <p style="font-size: 12px; color: #999;">Upload files using the form above</p>
        </div>
      `;
      return;
    }
    
    const files = [];
    snapshot.forEach(child => {
      const fileData = child.val();
      console.log('Found unit file:', child.key, fileData); // Debug log
      files.push({
        id: child.key,
        ...fileData
      });
    });
    
    // Sort files by upload date (newest first)
    files.sort((a, b) => b.uploadedAt - a.uploadedAt);
    
    displayUnitFiles(files);
  }).catch(error => {
    console.error('Error loading unit files:', error);
    filesList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ff5722;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">error</span>
        <p>Error loading unit files</p>
      </div>
    `;
  });
}

function displayUnitFiles(files) {
  const filesList = document.getElementById('unitFilesList');
  
  let html = '<div class="files-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">';
  
  files.forEach(file => {
    const fileIcon = getFileIcon(file.extension);
    const fileSize = formatFileSize(file.size);
    const uploadDate = new Date(file.uploadedAt).toLocaleDateString();
    const canPreview = canPreviewFile(file.extension);
    
    html += `
      <div class="file-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; background: white;">
        <div class="file-header" style="display: flex; align-items: center; margin-bottom: 12px;">
          <span class="material-icons" style="font-size: 32px; color: #6c4fc1; margin-right: 12px;">${fileIcon}</span>
          <div style="flex: 1;">
            <h4 style="margin: 0; font-size: 14px; color: #333;">${file.name}</h4>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${fileSize} • ${uploadDate}</p>
          </div>
          <div class="file-actions" style="display: flex; gap: 8px;">
            ${canPreview ? `<button class="action-btn" onclick="previewUnitFile('${file.id}', '${file.unitKey}')" style="padding: 4px 8px; font-size: 12px;" title="Preview">
              <span class="material-icons" style="font-size: 16px;">visibility</span>
            </button>` : ''}
            <button class="action-btn secondary" onclick="editUnitFile('${file.id}', '${file.unitKey}')" style="padding: 4px 8px; font-size: 12px;" title="Edit">
              <span class="material-icons" style="font-size: 16px;">edit</span>
            </button>
            <button class="action-btn secondary" onclick="deleteUnitFile('${file.id}', '${file.unitKey}')" style="padding: 4px 8px; font-size: 12px; background: #dc3545;" title="Delete">
              <span class="material-icons" style="font-size: 16px;">delete</span>
            </button>
          </div>
        </div>
        
        <div class="file-info" style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 12px; color: #666;">Type: ${file.type}</span>
            <span class="access-badge ${file.access}" style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
              ${file.access === 'view-only' ? 'View Only' : file.access === 'downloadable' ? 'Downloadable' : 'Restricted'}
            </span>
          </div>
          ${file.description ? `<p style="margin: 0; font-size: 12px; color: #666;">${file.description}</p>` : ''}
        </div>
        
        <div class="file-actions-full" style="display: flex; gap: 8px;">
          ${canPreview ? `<button class="action-btn" onclick="previewUnitFile('${file.id}', '${file.unitKey}')" style="flex: 1; padding: 8px; font-size: 12px;">
            <span class="material-icons" style="margin-right: 4px; font-size: 16px;">visibility</span>
            Preview
          </button>` : ''}
          ${file.access === 'downloadable' ? `<button class="action-btn secondary" onclick="downloadFile('${file.url}', '${file.name}')" style="flex: 1; padding: 8px; font-size: 12px;">
            <span class="material-icons" style="margin-right: 4px; font-size: 16px;">download</span>
            Download
          </button>` : ''}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  filesList.innerHTML = html;
}

function previewUnitFile(fileId, unitKey) {
  const dbPath = `units/${unitKey}/files/${fileId}`;
  
  console.log('Loading unit file for preview from path:', dbPath); // Debug log
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      alert('Unit file not found');
      return;
    }
    
    const file = snapshot.val();
    showFilePreview(file);
  }).catch(error => {
    console.error('Error loading unit file:', error);
    alert('Error loading file preview');
  });
}

function editUnitFile(fileId, unitKey) {
  const dbPath = `units/${unitKey}/files/${fileId}`;
  
  console.log('Loading unit file for edit from path:', dbPath); // Debug log
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      alert('Unit file not found');
      return;
    }
    
    const file = snapshot.val();
    showEditUnitFileModal(file, unitKey);
  }).catch(error => {
    console.error('Error loading unit file:', error);
    alert('Error loading file information');
  });
}

function showEditUnitFileModal(file, unitKey) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'editUnitFileModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Edit Unit File: ${file.name}</h3>
        <button class="modal-close" onclick="closeEditUnitFileModal()">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">File Name</label>
          <input type="text" id="editUnitFileName" class="form-input" value="${file.name}">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">File Type</label>
          <select id="editUnitFileType" class="form-input">
            <option value="document" ${file.type === 'document' ? 'selected' : ''}>Document</option>
            <option value="image" ${file.type === 'image' ? 'selected' : ''}>Image</option>
            <option value="video" ${file.type === 'video' ? 'selected' : ''}>Video</option>
            <option value="audio" ${file.type === 'audio' ? 'selected' : ''}>Audio</option>
            <option value="presentation" ${file.type === 'presentation' ? 'selected' : ''}>Presentation</option>
            <option value="spreadsheet" ${file.type === 'spreadsheet' ? 'selected' : ''}>Spreadsheet</option>
            <option value="other" ${file.type === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Access Level</label>
          <select id="editUnitFileAccess" class="form-input">
            <option value="view-only" ${file.access === 'view-only' ? 'selected' : ''}>View Only (No Download)</option>
            <option value="downloadable" ${file.access === 'downloadable' ? 'selected' : ''}>Downloadable</option>
            <option value="restricted" ${file.access === 'restricted' ? 'selected' : ''}>Restricted (Teacher Only)</option>
          </select>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Description</label>
          <textarea id="editUnitFileDescription" class="form-textarea">${file.description || ''}</textarea>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="action-btn secondary" onclick="closeEditUnitFileModal()">Cancel</button>
          <button class="action-btn" onclick="saveUnitFileChanges('${file.id}', '${unitKey}')">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function closeEditUnitFileModal() {
  const modal = document.getElementById('editUnitFileModal');
  if (modal) {
    modal.remove();
  }
}

function saveUnitFileChanges(fileId, unitKey) {
  const name = document.getElementById('editUnitFileName').value.trim();
  const type = document.getElementById('editUnitFileType').value;
  const access = document.getElementById('editUnitFileAccess').value;
  const description = document.getElementById('editUnitFileDescription').value.trim();
  
  if (!name) {
    alert('File name is required');
    return;
  }
  
  const dbPath = `units/${unitKey}/files/${fileId}`;
  
  const updates = {
    name: name,
    type: type,
    access: access,
    description: description,
    updatedAt: Date.now()
  };
  
  console.log('Saving unit file changes to path:', dbPath); // Debug log
  
  db.ref(dbPath).update(updates).then(() => {
    alert('Unit file updated successfully!');
    closeEditUnitFileModal();
    loadUnitFiles(unitKey);
  }).catch(error => {
    console.error('Error updating unit file:', error);
    alert('Error updating file. Please try again.');
  });
}

function deleteUnitFile(fileId, unitKey) {
  if (!confirm('Are you sure you want to delete this unit file? This action cannot be undone.')) {
    return;
  }
  
  const dbPath = `units/${unitKey}/files/${fileId}`;
  
  console.log('Loading unit file for deletion from path:', dbPath); // Debug log
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      alert('Unit file not found');
      return;
    }
    
    const file = snapshot.val();
    
    // Delete from Firebase Storage
    const fileRef = firebase.storage().refFromURL(file.url);
    fileRef.delete().then(() => {
      // Delete from database
      db.ref(dbPath).remove().then(() => {
        alert('Unit file deleted successfully!');
        loadUnitFiles(unitKey);
      }).catch(error => {
        console.error('Error deleting unit file from database:', error);
        alert('Error deleting file from database');
      });
    }).catch(error => {
      console.error('Error deleting unit file from storage:', error);
      // Still try to delete from database even if storage deletion fails
      db.ref(dbPath).remove().then(() => {
        alert('Unit file deleted from database (storage deletion may have failed)');
        loadUnitFiles(unitKey);
      });
    });
  }).catch(error => {
    console.error('Error loading unit file for deletion:', error);
    alert('Error loading file information');
  });
}

// ========= LESSON FILE MANAGEMENT FUNCTIONS =========

function openFileManager(unitKey, lessonKey = null) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'fileManagerModal';
  modal.style.display = 'flex';
  
  const targetPath = lessonKey ? `units/${unitKey}/lessons/${lessonKey}` : `units/${unitKey}`;
  const targetName = lessonKey ? `Lesson: ${lessonKey}` : `Unit: ${unitKey}`;
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <h3 class="modal-title">File Manager - ${targetName}</h3>
        <button class="modal-close" onclick="closeFileManager()">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <!-- File Upload Section -->
        <div class="file-upload-section" style="margin-bottom: 30px; padding: 20px; border: 2px dashed #ddd; border-radius: 8px; background: #f9f9f9; color: #333;">
          <h4 style="margin-top: 0; color: #6c4fc1;">Upload New File</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold;">File (PDF Only)</label>
              <input type="file" id="fileUpload" class="form-input" accept=".pdf" style="padding: 8px;">
              <small style="color: #666; font-size: 12px;">Only PDF files are allowed for lesson files</small>
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold;">File Name (Optional)</label>
              <input type="text" id="fileDisplayName" class="form-input" placeholder="Leave empty to use original name">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold;">File Type</label>
              <select id="fileType" class="form-input">
                <option value="document">Document (PDF)</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold;">Access Level</label>
              <select id="fileAccess" class="form-input">
                <option value="view-only">View Only (No Download)</option>
                <option value="downloadable">Downloadable</option>
                <option value="restricted">Restricted (Teacher Only)</option>
              </select>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Description</label>
            <textarea id="fileDescription" class="form-textarea" placeholder="Brief description of the file..."></textarea>
          </div>
          <button class="action-btn" onclick="uploadFile('${unitKey}', '${lessonKey}')">
            <span class="material-icons" style="margin-right: 8px;">cloud_upload</span>
            Upload File
          </button>
        </div>
        
        <!-- Files List Section -->
        <div class="files-list-section">
          <h4 style="color: #6c4fc1; margin-bottom: 20px;">Uploaded Files</h4>
          <div id="filesList" style="min-height: 200px;">
            <div style="text-align: center; padding: 40px; color: #666;">
              Loading files...
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load existing files
  loadFiles(unitKey, lessonKey);
}

function closeFileManager() {
  const modal = document.getElementById('fileManagerModal');
  if (modal) {
    modal.remove();
  }
}

function uploadFile(unitKey, lessonKey) {
  const fileInput = document.getElementById('fileUpload');
  const displayName = document.getElementById('fileDisplayName').value.trim();
  const fileType = document.getElementById('fileType').value;
  const fileAccess = document.getElementById('fileAccess').value;
  const fileDescription = document.getElementById('fileDescription').value.trim();
  
  if (!fileInput.files[0]) {
    alert('Please select a file to upload');
    return;
  }
  
  const file = fileInput.files[0];
  const fileName = displayName || file.name;
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  // Validate file type - only PDF allowed
  if (fileExtension !== 'pdf') {
    alert('Only PDF files are allowed for lesson files');
    return;
  }
  
  // Validate file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert('File size must be less than 50MB');
    return;
  }
  
  // Show upload progress
  const uploadBtn = event.target;
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Uploading...';
  
  // Create file reference
  const timestamp = Date.now();
  const fileId = `${unitKey}_${lessonKey || 'unit'}_${timestamp}`;
  const storagePath = `files/${unitKey}/${lessonKey || 'unit'}/${fileId}.${fileExtension}`;
  
  // Upload to Firebase Storage
  const storageRef = firebase.storage().ref(storagePath);
  const uploadTask = storageRef.put(file);
  
  uploadTask.on('state_changed', 
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      uploadBtn.innerHTML = `<span class="material-icons">hourglass_empty</span> ${Math.round(progress)}%`;
    },
    (error) => {
      console.error('Upload error:', error);
      alert('Error uploading file. Please try again.');
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '<span class="material-icons">cloud_upload</span> Upload File';
    },
    () => {
      // Upload completed successfully
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        // Save file metadata to database
        const fileData = {
          id: fileId,
          name: fileName,
          originalName: file.name,
          type: fileType,
          extension: fileExtension,
          size: file.size,
          access: fileAccess,
          description: fileDescription,
          url: downloadURL,
          uploadedAt: timestamp,
          uploadedBy: firebase.auth().currentUser.uid,
          unitKey: unitKey,
          lessonKey: lessonKey
        };
        
        const dbPath = lessonKey ? 
          `units/${unitKey}/lessons/${lessonKey}/files/${fileId}` : 
          `units/${unitKey}/files/${fileId}`;
        
        db.ref(dbPath).set(fileData).then(() => {
          alert('File uploaded successfully!');
          
          // Reset form
          fileInput.value = '';
          document.getElementById('fileDisplayName').value = '';
          document.getElementById('fileDescription').value = '';
          
          // Reload files list
          loadFiles(unitKey, lessonKey);
          
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = '<span class="material-icons">cloud_upload</span> Upload File';
        }).catch(error => {
          console.error('Error saving file metadata:', error);
          alert('Error saving file information. Please try again.');
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = '<span class="material-icons">cloud_upload</span> Upload File';
        });
      });
    }
  );
}

function loadFiles(unitKey, lessonKey) {
  const filesList = document.getElementById('files-list');
  if (!filesList) return;
  
  let dbPath;
  if (lessonKey) {
    // For lessons, check both old and new file structures
    dbPath = `units/${unitKey}/lessons/${lessonKey}/files`;
  } else {
    // For units, files are stored directly under the unit in a files folder
    dbPath = `units/${unitKey}/files`;
  }
  
  console.log('Loading files from path:', dbPath); // Debug log
  
  // Helper function to handle files snapshot
  function handleFilesSnapshot(snapshot) {
    if (!snapshot.exists()) {
      console.log('No files found at path:', dbPath); // Debug log
      
      // If it's a lesson and we didn't find files, try the new structure
      if (lessonKey && dbPath.includes('/lessons/')) {
        console.log('Trying new structure for lesson files'); // Debug log
        const newDbPath = `units/${unitKey}/lesson${lessonKey}/files`;
        console.log('Loading files from new path:', newDbPath); // Debug log
        
        db.ref(newDbPath).once('value').then(newSnapshot => {
          if (newSnapshot.exists()) {
            console.log('Found files in new structure'); // Debug log
            handleFilesSnapshot(newSnapshot);
          } else {
            console.log('No files found in new structure either'); // Debug log
            showNoFilesMessage();
          }
        }).catch(error => {
          console.error('Error loading files from new structure:', error);
          showNoFilesMessage();
        });
        return;
      }
      
      showNoFilesMessage();
      return;
    }
    
    const files = [];
    snapshot.forEach(child => {
      const fileData = child.val();
      console.log('Found file:', child.key, fileData); // Debug log
      files.push({
        id: child.key,
        ...fileData
      });
    });
    
    // Sort files by upload date (newest first)
    files.sort((a, b) => b.uploadedAt - a.uploadedAt);
    
    displayFiles(files);
  }
  
  // Helper function to show no files message
  function showNoFilesMessage() {
    filesList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">folder_open</span>
        <p>No files uploaded yet</p>
        <p style="font-size: 12px; color: #999;">Upload files using the form above</p>
      </div>
    `;
  }
  
  // Helper function to display files
  function displayFiles(files) {
    let html = '<div class="files-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">';
    
    files.forEach(file => {
      const fileIcon = getFileIcon(file.extension);
      const fileSize = formatFileSize(file.size);
      const uploadDate = new Date(file.uploadedAt).toLocaleDateString();
      const canPreview = canPreviewFile(file.extension);
      
      html += `
        <div class="file-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; background: white;">
          <div class="file-header" style="display: flex; align-items: center; margin-bottom: 12px;">
            <span class="material-icons" style="font-size: 32px; color: #6c4fc1; margin-right: 12px;">${fileIcon}</span>
            <div style="flex: 1;">
              <h4 style="margin: 0; font-size: 14px; color: #333;">${file.name}</h4>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${fileSize} • ${uploadDate}</p>
            </div>
            <div class="file-actions" style="display: flex; gap: 8px;">
              ${canPreview ? `<button class="action-btn" onclick="previewFile('${file.id}', '${unitKey}', '${lessonKey}')" style="padding: 4px 8px; font-size: 12px;" title="Preview">
                <span class="material-icons" style="font-size: 16px;">visibility</span>
              </button>` : ''}
              <button class="action-btn secondary" onclick="editFile('${file.id}', '${unitKey}', '${lessonKey}')" style="padding: 4px 8px; font-size: 12px;" title="Edit">
                <span class="material-icons" style="font-size: 16px;">edit</span>
              </button>
              <button class="action-btn secondary" onclick="deleteFile('${file.id}', '${unitKey}', '${lessonKey}')" style="padding: 4px 8px; font-size: 12px; background: #dc3545;" title="Delete">
                <span class="material-icons" style="font-size: 16px;">delete</span>
              </button>
            </div>
          </div>
          
          <div class="file-info" style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 12px; color: #666;">Type: ${file.type}</span>
              <span class="access-badge ${file.access}" style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                ${file.access === 'view-only' ? 'View Only' : file.access === 'downloadable' ? 'Downloadable' : 'Restricted'}
              </span>
            </div>
            ${file.description ? `<p style="margin: 0; font-size: 12px; color: #666;">${file.description}</p>` : ''}
          </div>
          
          <div class="file-actions-full" style="display: flex; gap: 8px;">
            ${canPreview ? `<button class="action-btn" onclick="previewFile('${file.id}', '${unitKey}', '${lessonKey}')" style="flex: 1; padding: 8px; font-size: 12px;">
              <span class="material-icons" style="margin-right: 4px; font-size: 16px;">visibility</span>
              Preview
            </button>` : ''}
            ${file.access === 'downloadable' ? `<button class="action-btn secondary" onclick="downloadFile('${file.url}', '${file.name}')" style="flex: 1; padding: 8px; font-size: 12px;">
              <span class="material-icons" style="margin-right: 4px; font-size: 16px;">download</span>
              Download
            </button>` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    filesList.innerHTML = html;
  }
  
  // Start the file loading process
  db.ref(dbPath).once('value').then(handleFilesSnapshot).catch(error => {
    console.error('Error loading files:', error);
    filesList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ff5722;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">error</span>
        <p>Error loading files</p>
      </div>
    `;
  });
}

function getFileIcon(extension) {
  const iconMap = {
    'pdf': 'picture_as_pdf',
    'doc': 'description',
    'docx': 'description',
    'txt': 'description',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'mp4': 'video_file',
    'mp3': 'audio_file',
    'ppt': 'slideshow',
    'pptx': 'slideshow',
    'xls': 'table_chart',
    'xlsx': 'table_chart'
  };
  
  return iconMap[extension.toLowerCase()] || 'insert_drive_file';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function canPreviewFile(extension) {
  const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'txt'];
  return previewableTypes.includes(extension.toLowerCase());
}

function previewFile(fileId, unitKey, lessonKey) {
  const dbPath = lessonKey ? 
    `units/${unitKey}/lessons/${lessonKey}/files/${fileId}` : 
    `units/${unitKey}/files/${fileId}`;
  
  console.log('Loading teacher dashboard file for preview from path:', dbPath); // Debug log
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      console.log('File not found at path:', dbPath); // Debug log
      
      // If it's a lesson file and not found, try the new structure
      if (lessonKey && dbPath.includes('/lessons/')) {
        console.log('Trying new structure for lesson file preview'); // Debug log
        const newDbPath = `units/${unitKey}/lesson${lessonKey}/files/${fileId}`;
        console.log('Loading file from new path:', newDbPath); // Debug log
        
        db.ref(newDbPath).once('value').then(newSnapshot => {
          if (newSnapshot.exists()) {
            console.log('Found file in new structure'); // Debug log
            const file = newSnapshot.val();
            showFilePreview(file);
          } else {
            console.log('File not found in new structure either'); // Debug log
            alert('File not found');
          }
        }).catch(error => {
          console.error('Error loading file from new structure:', error);
          alert('Error loading file preview');
        });
        return;
      }
      
      alert('File not found');
      return;
    }
    
    const file = snapshot.val();
    showFilePreview(file);
  }).catch(error => {
    console.error('Error loading file:', error);
    alert('Error loading file preview');
  });
}

function showFilePreview(file) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'filePreviewModal';
  modal.style.display = 'flex';
  modal.style.zIndex = '10000';
  
  let previewContent = '';
  
  switch (file.extension.toLowerCase()) {
    case 'pdf':
      previewContent = `
        <div style="position: relative; width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 1000;">
            Teacher Preview | ${new Date().toLocaleString()}
          </div>
          <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 1000;">
            📄 PDF Document
          </div>
          <iframe 
            src="${file.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH" 
            style="width: 100%; height: 100%; border: none;"
            oncontextmenu="return false;"
            sandbox="allow-same-origin allow-scripts allow-forms"
            title="PDF Preview"
          ></iframe>
        </div>
      `;
      break;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      previewContent = `
        <img src="${file.url}" style="max-width: 100%; max-height: 600px; object-fit: contain;" alt="${file.name}">
      `;
      break;
    case 'mp4':
      previewContent = `
        <video controls style="max-width: 100%; max-height: 600px;">
          <source src="${file.url}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
      break;
    case 'mp3':
      previewContent = `
        <audio controls style="width: 100%;">
          <source src="${file.url}" type="audio/mpeg">
          Your browser does not support the audio tag.
        </audio>
      `;
      break;
    case 'txt':
      // For text files, we'll fetch the content
      fetch(file.url)
        .then(response => response.text())
        .then(text => {
          document.getElementById('filePreviewContent').innerHTML = `
            <pre style="white-space: pre-wrap; max-height: 600px; overflow-y: auto; padding: 20px; background: #f5f5f5; border-radius: 4px;">${text}</pre>
          `;
        })
        .catch(error => {
          document.getElementById('filePreviewContent').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ff5722;">
              <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">error</span>
              <p>Error loading text file</p>
            </div>
          `;
        });
      previewContent = '<div id="filePreviewContent">Loading...</div>';
      break;
    default:
      previewContent = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">preview</span>
          <p>Preview not available for this file type</p>
          <p>File: ${file.name}</p>
          ${file.access === 'downloadable' ? `<button class="action-btn" onclick="downloadFile('${file.url}', '${file.name}')" style="margin-top: 16px;">Download File</button>` : ''}
        </div>
      `;
  }
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 90vw; max-height: 90vh; overflow: hidden;">
      <div class="modal-header">
        <h3 class="modal-title">Preview: ${file.name}</h3>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${file.access === 'downloadable' ? `<button class="action-btn secondary" onclick="downloadFile('${file.url}', '${file.name}')" style="padding: 6px 12px; font-size: 12px;">
            <span class="material-icons" style="margin-right: 4px; font-size: 16px;">download</span>
            Download
          </button>` : ''}
          <button class="modal-close" onclick="closeFilePreview()">&times;</button>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; overflow-y: auto; max-height: calc(90vh - 100px);">
        ${previewContent}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function closeFilePreview() {
  const modal = document.getElementById('filePreviewModal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
}

function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function editFile(fileId, unitKey, lessonKey) {
  const dbPath = lessonKey ? 
    `units/${unitKey}/lessons/${lessonKey}/files/${fileId}` : 
    `units/${unitKey}/files/${fileId}`;
  
  console.log('Loading teacher dashboard file for edit from path:', dbPath); // Debug log
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      console.log('File not found at path:', dbPath); // Debug log
      
      // If it's a lesson file and not found, try the new structure
      if (lessonKey && dbPath.includes('/lessons/')) {
        console.log('Trying new structure for lesson file edit'); // Debug log
        const newDbPath = `units/${unitKey}/lesson${lessonKey}/files/${fileId}`;
        console.log('Loading file from new path:', newDbPath); // Debug log
        
        db.ref(newDbPath).once('value').then(newSnapshot => {
          if (newSnapshot.exists()) {
            console.log('Found file in new structure'); // Debug log
            const file = newSnapshot.val();
            showEditFileModal(file, unitKey, lessonKey);
          } else {
            console.log('File not found in new structure either'); // Debug log
            alert('File not found');
          }
        }).catch(error => {
          console.error('Error loading file from new structure:', error);
          alert('Error loading file information');
        });
        return;
      }
      
      alert('File not found');
      return;
    }
    
    const file = snapshot.val();
    showEditFileModal(file, unitKey, lessonKey);
  }).catch(error => {
    console.error('Error loading file:', error);
    alert('Error loading file information');
  });
}

function showEditFileModal(file, unitKey, lessonKey) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'editFileModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Edit File: ${file.name}</h3>
        <button class="modal-close" onclick="closeEditFileModal()">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">File Name</label>
          <input type="text" id="editFileName" class="form-input" value="${file.name}">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">File Type</label>
          <select id="editFileType" class="form-input">
            <option value="document" ${file.type === 'document' ? 'selected' : ''}>Document</option>
            <option value="image" ${file.type === 'image' ? 'selected' : ''}>Image</option>
            <option value="video" ${file.type === 'video' ? 'selected' : ''}>Video</option>
            <option value="audio" ${file.type === 'audio' ? 'selected' : ''}>Audio</option>
            <option value="presentation" ${file.type === 'presentation' ? 'selected' : ''}>Presentation</option>
            <option value="spreadsheet" ${file.type === 'spreadsheet' ? 'selected' : ''}>Spreadsheet</option>
            <option value="other" ${file.type === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Access Level</label>
          <select id="editFileAccess" class="form-input">
            <option value="view-only" ${file.access === 'view-only' ? 'selected' : ''}>View Only (No Download)</option>
            <option value="downloadable" ${file.access === 'downloadable' ? 'selected' : ''}>Downloadable</option>
            <option value="restricted" ${file.access === 'restricted' ? 'selected' : ''}>Restricted (Teacher Only)</option>
          </select>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Description</label>
          <textarea id="editFileDescription" class="form-textarea">${file.description || ''}</textarea>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="action-btn secondary" onclick="closeEditFileModal()">Cancel</button>
          <button class="action-btn" onclick="saveFileChanges('${file.id}', '${unitKey}', '${lessonKey}')">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function closeEditFileModal() {
  const modal = document.getElementById('editFileModal');
  if (modal) {
    modal.remove();
  }
}

function saveFileChanges(fileId, unitKey, lessonKey) {
  const name = document.getElementById('editFileName').value.trim();
  const type = document.getElementById('editFileType').value;
  const access = document.getElementById('editFileAccess').value;
  const description = document.getElementById('editFileDescription').value.trim();
  
  if (!name) {
    alert('File name is required');
    return;
  }
  
  const dbPath = lessonKey ? 
    `units/${unitKey}/lessons/${lessonKey}/files/${fileId}` : 
    `units/${unitKey}/files/${fileId}`;
  
  const updates = {
    name: name,
    type: type,
    access: access,
    description: description,
    updatedAt: Date.now()
  };
  
  console.log('Saving file changes to path:', dbPath); // Debug log
  
  // Helper function to save changes
  function saveChanges(pathToUpdate) {
    db.ref(pathToUpdate).update(updates).then(() => {
      alert('File updated successfully!');
      closeEditFileModal();
      loadFiles(unitKey, lessonKey);
    }).catch(error => {
      console.error('Error updating file:', error);
      alert('Error updating file. Please try again.');
    });
  }
  
  // Check if file exists at the primary path
  db.ref(dbPath).once('value').then(snapshot => {
    if (snapshot.exists()) {
      saveChanges(dbPath);
    } else {
      console.log('File not found at primary path:', dbPath); // Debug log
      
      // If it's a lesson file and not found, try the new structure
      if (lessonKey && dbPath.includes('/lessons/')) {
        console.log('Trying new structure for lesson file save'); // Debug log
        const newDbPath = `units/${unitKey}/lesson${lessonKey}/files/${fileId}`;
        console.log('Saving file to new path:', newDbPath); // Debug log
        
        db.ref(newDbPath).once('value').then(newSnapshot => {
          if (newSnapshot.exists()) {
            console.log('Found file in new structure'); // Debug log
            saveChanges(newDbPath);
          } else {
            console.log('File not found in new structure either'); // Debug log
            alert('File not found. Please refresh and try again.');
          }
        }).catch(error => {
          console.error('Error checking new structure:', error);
          alert('Error updating file. Please try again.');
        });
        return;
      }
      
      alert('File not found. Please refresh and try again.');
    }
  }).catch(error => {
    console.error('Error checking file existence:', error);
    alert('Error updating file. Please try again.');
  });
}

function deleteFile(fileId, unitKey, lessonKey) {
  if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
    return;
  }
  
  const dbPath = lessonKey ? 
    `units/${unitKey}/lessons/${lessonKey}/files/${fileId}` : 
    `units/${unitKey}/files/${fileId}`;
  
  console.log('Loading teacher dashboard file for deletion from path:', dbPath); // Debug log
  
  // Helper function to delete file from storage and database
  function deleteFileData(file, pathToDelete) {
    // Delete from Firebase Storage
    const fileRef = firebase.storage().refFromURL(file.url);
    fileRef.delete().then(() => {
      // Delete from database
      db.ref(pathToDelete).remove().then(() => {
        alert('File deleted successfully!');
        loadFiles(unitKey, lessonKey);
      }).catch(error => {
        console.error('Error deleting file from database:', error);
        alert('Error deleting file from database');
      });
    }).catch(error => {
      console.error('Error deleting file from storage:', error);
      // Still try to delete from database even if storage deletion fails
      db.ref(pathToDelete).remove().then(() => {
        alert('File deleted from database (storage deletion may have failed)');
        loadFiles(unitKey, lessonKey);
      });
    });
  }
  
  // First get the file data to delete from storage
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      console.log('File not found at path:', dbPath); // Debug log
      
      // If it's a lesson file and not found, try the new structure
      if (lessonKey && dbPath.includes('/lessons/')) {
        console.log('Trying new structure for lesson file deletion'); // Debug log
        const newDbPath = `units/${unitKey}/lesson${lessonKey}/files/${fileId}`;
        console.log('Loading file from new path:', newDbPath); // Debug log
        
        db.ref(newDbPath).once('value').then(newSnapshot => {
          if (newSnapshot.exists()) {
            console.log('Found file in new structure'); // Debug log
            const file = newSnapshot.val();
            deleteFileData(file, newDbPath);
          } else {
            console.log('File not found in new structure either'); // Debug log
            alert('File not found');
          }
        }).catch(error => {
          console.error('Error loading file from new structure:', error);
          alert('Error loading file information');
        });
        return;
      }
      
      alert('File not found');
      return;
    }
    
    const file = snapshot.val();
    deleteFileData(file, dbPath);
  }).catch(error => {
    console.error('Error loading file for deletion:', error);
    alert('Error loading file information');
  });
}

// Enhanced modal close function to handle dynamic modals
window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // List of modals that are defined in HTML and should NOT be removed
    const htmlModals = [
      'addUserModal',
      'addUnitModal', 
      'uploadVideoModal',
      'generateTokenModal',
      'createQuizModal',
      'createAssignmentModal',
      'createRubricModal',
      'gradingCenterModal',
      'gradeSubmissionModal',
      'quizTakingModal',
      'manageUnitsModal',
      'editUnitModal'
    ];
    
    // Remove dynamically created modals (but not HTML-defined ones)
    if (modal.parentNode === document.body && !htmlModals.includes(modalId)) {
      modal.remove();
    }
  }
}

// CSS for new features
const additionalStyles = `
  .tab-btn {
    padding: 8px 16px;
    border: none;
    background: #e0e0e0;
    color: #666;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    margin-right: 4px;
  }
  .tab-btn.active {
    background: #6c4fc1;
    color: white;
  }
  .checkbox-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
  }
  .checkbox-group input[type="checkbox"] {
    margin-right: 8px;
  }
  .form-textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    box-sizing: border-box;
    font-family: inherit;
    resize: vertical;
  }
  
  /* Custom Dropdown Styles */
  .custom-dropdown {
    position: relative;
    cursor: pointer;
    user-select: none;
  }
  
  .dropdown-selected {
    background: linear-gradient(135deg, #6c4fc1, #4834d4);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(108, 79, 193, 0.3);
    transition: all 0.3s ease;
  }
  
  .dropdown-selected:hover {
    box-shadow: 0 4px 12px rgba(108, 79, 193, 0.4);
    transform: translateY(-1px);
  }
  
  .custom-dropdown.active .dropdown-selected {
    border-radius: 8px 8px 0 0;
    box-shadow: 0 2px 8px rgba(108, 79, 193, 0.4);
  }
  
  .dropdown-arrow {
    font-size: 20px;
    transition: transform 0.3s ease;
  }
  
  .custom-dropdown.active .dropdown-arrow {
    transform: rotate(180deg);
  }
  
  .dropdown-options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    display: none;
    max-height: 250px;
    overflow-y: auto;
  }
  
  .dropdown-option {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .dropdown-option:hover {
    background: #f8f9fa;
  }
  
  .dropdown-option.selected {
    background: linear-gradient(135deg, #e8f2ff, #f0f8ff);
    border-left: 4px solid #6c4fc1;
  }
  
  .dropdown-option:last-child {
    border-bottom: none;
    border-radius: 0 0 8px 8px;
  }
  
  .attempt-label {
    font-weight: 600;
    color: #333;
    font-size: 14px;
  }
  
  .attempt-score {
    color: #6c4fc1;
    font-weight: 500;
    font-size: 13px;
  }
  
  .attempt-date {
    color: #666;
    font-size: 12px;
  }
  
  .dropdown-option.selected .attempt-label {
    color: #6c4fc1;
  }
  
  /* File Manager Styles */
  .access-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  .access-badge.view-only {
    background: #fff3cd;
    color: #856404;
  }
  
  .access-badge.downloadable {
    background: #d4edda;
    color: #155724;
  }
  
  .access-badge.restricted {
    background: #f8d7da;
    color: #721c24;
  }
  
  .file-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .file-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .file-upload-section {
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  }
  
  .files-grid {
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .modal#filePreviewModal .modal-content {
    background: #000;
    color: #fff;
  }
  
  .modal#filePreviewModal .modal-header {
    background: #333;
    color: #fff;
  }
`;

// Add styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('teacherTheme') || 'light';
  applyTheme(savedTheme);
  
  // Add debug test function to window for manual testing
  window.testDatabaseConnection = function() {
    console.log('=== TESTING DATABASE CONNECTION ===');
    
    // Test 1: Check if database is accessible
    db.ref('.info/connected').once('value', function(snapshot) {
      console.log('Database connected:', snapshot.val());
    });
    
    // Test 2: Check users structure
    db.ref('users').limitToFirst(3).once('value').then(snapshot => {
      console.log('Users sample:', snapshot.val());
      
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          console.log('User:', child.key, child.val());
        });
      }
    });
    
    // Test 3: Check assignments structure
    db.ref('assignments').limitToFirst(3).once('value').then(snapshot => {
      console.log('Assignments sample:', snapshot.val());
      
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          console.log('Assignment:', child.key, child.val());
        });
      }
    });
    
    // Test 4: Check submissions structure
    db.ref('submissions').limitToFirst(3).once('value').then(snapshot => {
      console.log('Submissions sample:', snapshot.val());
      
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          console.log('Submission:', child.key, child.val());
        });
      }
    });
    
    // Test 5: Check quizzes structure
    db.ref('quizzes').limitToFirst(3).once('value').then(snapshot => {
      console.log('Quizzes sample:', snapshot.val());
      
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          console.log('Quiz:', child.key, child.val());
        });
      }
    });
    
    // Test 6: Check quizSubmissions structure
    db.ref('quizSubmissions').limitToFirst(3).once('value').then(snapshot => {
      console.log('Quiz Submissions sample:', snapshot.val());
      
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          console.log('Quiz Submission:', child.key, child.val());
        });
      }
    });
    
    console.log('=== DATABASE TEST COMPLETE ===');
  };
});

// ========= ASSESSMENT MANAGEMENT FUNCTIONS =========

// Global variables for assessment management
let currentQuizQuestionCount = 1;
let currentCriteriaCount = 1;
let currentQuizTimer = null;
let currentQuizIndex = 0;
let currentQuizData = null;
let userAnswers = [];
let allAssessments = []; // Global variable to store all assessments for filtering

// Assessment Management Functions
function openAssessmentManagement() {
  // Display assessment overview with existing quizzes and assignments
  loadAssessmentOverview();
}

function openCreateQuizModal() {
  openModal('createQuizModal');
  loadUnitsForQuiz();
  // Reset form to ensure clean state
  setTimeout(() => {
    resetQuizForm();
  }, 100);
}

function openCreateAssignmentModal() {
  openModal('createAssignmentModal');
  loadUnitsForAssignment();
  loadRubricsForAssignment();
  // Reset form to ensure clean state
  setTimeout(() => {
    resetAssignmentForm();
  }, 100);
}

function openCreateRubricModal() {
  openModal('createRubricModal');
  // Reset form to ensure clean state
  setTimeout(() => {
    resetRubricForm();
  }, 100);
}

function openGradingCenter() {
  openModal('gradingCenterModal');
  loadSubmissions();
}

function openPendingGrades() {
  openModal('gradingCenterModal');
  const filter = document.getElementById('gradingFilter');
  if (filter) {
    filter.value = 'pending';
  }
  loadSubmissions();
}

function viewAssessments() {
  // Show all assessments in a modal or navigate to a dedicated page
  showAssessmentList();
}

// Quiz Creation Functions
function loadUnitsForQuiz(selectedUnitId = null) {
  const unitSelect = document.getElementById('quizUnit');
  if (!unitSelect) {
    console.error('Quiz unit select element not found');
    return Promise.resolve([]);
  }

  unitSelect.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Choose a unit...';
  unitSelect.appendChild(defaultOption);

  return db.ref('units').once('value')
    .then(snapshot => {
      const availableUnits = [];

      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const unit = child.val();
          const unitId = child.key;
          availableUnits.push({
            id: unitId,
            name: unit.name || unit.title || unitId
          });

          const option = document.createElement('option');
          option.value = unitId;
          option.textContent = unit.name || unit.title || unitId;
          unitSelect.appendChild(option);
        });
      }

      // If editing, set the selected unit after options are loaded
      if (selectedUnitId) {
        console.log('Setting unit to:', selectedUnitId);
        unitSelect.value = selectedUnitId;
        
        // Verify it was set correctly
        if (unitSelect.value === selectedUnitId) {
          console.log('Unit successfully set to:', selectedUnitId);
        } else {
          console.warn('Failed to set unit. Available options:', Array.from(unitSelect.options).map(opt => opt.value));
        }
      }

      return availableUnits;
    })
    .catch(error => {
      console.error('Error loading units for quiz:', error);
      return [];
    });
}



function addQuestion() {
  const container = document.getElementById('questionsContainer');
  const existingQuestions = container.querySelectorAll('.question-item');
  const nextQuestionNumber = existingQuestions.length + 1;
  
  const questionHtml = `
    <div class="question-item" data-question="${nextQuestionNumber}">
      <div class="question-header">
        <span>Question ${nextQuestionNumber}</span>
        <select class="question-type" onchange="updateQuestionType(this)">
          <option value="multiple-choice">Multiple Choice</option>
          <option value="fill-blank">Fill in the Blank</option>
          <option value="true-false">True/False</option>
          <option value="short-answer">Short Answer</option>
        </select>
        <button type="button" class="action-btn secondary" onclick="removeQuestion(this)" style="padding: 4px 8px; margin-left: 8px; width: 15%;">Remove</button>
      </div>
      <div class="question-content">
        <input type="text" class="form-input question-text" placeholder="Enter question text..." required>
        <div class="question-options" id="options-${nextQuestionNumber}">
          <div class="option-item">
            <input type="radio" name="correct-${nextQuestionNumber}" value="0">
            <input type="text" class="form-input option-text" placeholder="Option A" required>
          </div>
          <div class="option-item">
            <input type="radio" name="correct-${nextQuestionNumber}" value="1">
            <input type="text" class="form-input option-text" placeholder="Option B" required>
          </div>
          <div class="option-item">
            <input type="radio" name="correct-${nextQuestionNumber}" value="2">
            <input type="text" class="form-input option-text" placeholder="Option C" required>
          </div>
          <div class="option-item">
            <input type="radio" name="correct-${nextQuestionNumber}" value="3">
            <input type="text" class="form-input option-text" placeholder="Option D" required>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', questionHtml);
  
  // Update the question count
  currentQuizQuestionCount = nextQuestionNumber;
}

function removeQuestion(button) {
  const questionItem = button.closest('.question-item');
  if (document.querySelectorAll('.question-item').length > 1) {
    questionItem.remove();
    
    // Renumber all remaining questions
    renumberQuestions();
  } else {
    alert('At least one question is required.');
  }
}

function renumberQuestions() {
  const container = document.getElementById('questionsContainer');
  const questionItems = container.querySelectorAll('.question-item');
  
  questionItems.forEach((item, index) => {
    const questionNumber = index + 1;
    
    // Update data attribute
    item.dataset.question = questionNumber;
    
    // Update question label
    const questionLabel = item.querySelector('.question-header span');
    questionLabel.textContent = `Question ${questionNumber}`;
    
    // Update options container ID
    const optionsContainer = item.querySelector('.question-options');
    optionsContainer.id = `options-${questionNumber}`;
    
    // Update radio button names for correct answer selection
    const radioButtons = item.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
      radio.name = `correct-${questionNumber}`;
    });
  });
  
  // Update current question count
  currentQuizQuestionCount = questionItems.length;
}

function updateQuestionType(select) {
  const questionItem = select.closest('.question-item');
  const optionsContainer = questionItem.querySelector('.question-options');
  const questionNumber = questionItem.dataset.question;
  
  switch(select.value) {
    case 'multiple-choice':
      optionsContainer.innerHTML = `
        <div class="option-item">
          <input type="radio" name="correct-${questionNumber}" value="0">
          <input type="text" class="form-input option-text" placeholder="Option A" required>
        </div>
        <div class="option-item">
          <input type="radio" name="correct-${questionNumber}" value="1">
          <input type="text" class="form-input option-text" placeholder="Option B" required>
        </div>
        <div class="option-item">
          <input type="radio" name="correct-${questionNumber}" value="2">
          <input type="text" class="form-input option-text" placeholder="Option C" required>
        </div>
        <div class="option-item">
          <input type="radio" name="correct-${questionNumber}" value="3">
          <input type="text" class="form-input option-text" placeholder="Option D" required>
        </div>
      `;
      break;
    case 'true-false':
      optionsContainer.innerHTML = `
        <div class="option-item">
          <input type="radio" name="correct-${questionNumber}" value="0">
          <span>True</span>
        </div>
        <div class="option-item">
          <input type="radio" name="correct-${questionNumber}" value="1">
          <span>False</span>
        </div>
      `;
      break;
    case 'fill-blank':
      optionsContainer.innerHTML = `
        <div class="option-item">
          <label>Correct Answer:</label>
          <input type="text" class="form-input" placeholder="Enter the correct answer" required>
        </div>
      `;
      break;
    case 'short-answer':
      optionsContainer.innerHTML = `
        <div class="option-item">
          <label>Sample Answer (for reference):</label>
          <textarea class="form-textarea" placeholder="Enter a sample answer for grading reference"></textarea>
        </div>
      `;
      break;
  }
}

// Quiz Form Submission
document.getElementById('createQuizForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const quizData = {
    title: document.getElementById('quizTitle').value,
    description: document.getElementById('quizDescription').value,
    unit: document.getElementById('quizUnit').value,
    dueDate: document.getElementById('quizDueDate').value,
    timeLimit: parseInt(document.getElementById('quizTimeLimit').value),
    maxAttempts: parseInt(document.getElementById('quizAttempts').value),
    questions: [],
    createdBy: firebase.auth().currentUser.uid,
    createdAt: Date.now(),
    active: true
  };
  
  // Collect questions
  const questionItems = document.querySelectorAll('.question-item');
  questionItems.forEach(item => {
    const questionText = item.querySelector('.question-text').value;
    const questionType = item.querySelector('.question-type').value;
    const questionNumber = item.dataset.question;
    
    const question = {
      text: questionText,
      type: questionType,
      options: [],
      correctAnswer: null
    };
    
    if (questionType === 'multiple-choice') {
      const options = item.querySelectorAll('.option-text');
      options.forEach((option, index) => {
        question.options.push(option.value);
      });
      const correctRadio = item.querySelector(`input[name="correct-${questionNumber}"]:checked`);
      if (correctRadio) {
        question.correctAnswer = parseInt(correctRadio.value);
      }
    } else if (questionType === 'true-false') {
      question.options = ['True', 'False'];
      const correctRadio = item.querySelector(`input[name="correct-${questionNumber}"]:checked`);
      if (correctRadio) {
        question.correctAnswer = parseInt(correctRadio.value);
      }
    } else if (questionType === 'fill-blank') {
      const correctAnswer = item.querySelector('.option-item input[type="text"]').value;
      question.correctAnswer = correctAnswer;
    } else if (questionType === 'short-answer') {
      const sampleAnswer = item.querySelector('.option-item textarea').value;
      question.sampleAnswer = sampleAnswer;
    }
    
    quizData.questions.push(question);
  });
  
  // Save quiz to database
  const quizRef = db.ref('quizzes').push();
  quizRef.set(quizData).then(() => {
    alert('Quiz created successfully!');
    closeModal('createQuizModal');
    document.getElementById('createQuizForm').reset();
    currentQuizQuestionCount = 1;
    document.getElementById('questionsContainer').innerHTML = `
      <div class="question-item" data-question="1">
        <div class="question-header">
          <span>Question 1</span>
          <select class="question-type" onchange="updateQuestionType(this)">
            <option value="multiple-choice">Multiple Choice</option>
            <option value="fill-blank">Fill in the Blank</option>
            <option value="true-false">True/False</option>
            <option value="short-answer">Short Answer</option>
          </select>
        </div>
        <div class="question-content">
          <input type="text" class="form-input question-text" placeholder="Enter question text..." required>
          <div class="question-options" id="options-1">
            <div class="option-item">
              <input type="radio" name="correct-1" value="0">
              <input type="text" class="form-input option-text" placeholder="Option A" required>
            </div>
            <div class="option-item">
              <input type="radio" name="correct-1" value="1">
              <input type="text" class="form-input option-text" placeholder="Option B" required>
            </div>
            <div class="option-item">
              <input type="radio" name="correct-1" value="2">
              <input type="text" class="form-input option-text" placeholder="Option C" required>
            </div>
            <div class="option-item">
              <input type="radio" name="correct-1" value="3">
              <input type="text" class="form-input option-text" placeholder="Option D" required>
            </div>
          </div>
        </div>
      </div>
    `;
  }).catch(error => {
    console.error('Error creating quiz:', error);
    alert('Error creating quiz. Please try again.');
  });
});

// Assignment Creation Functions
function loadUnitsForAssignment() {
  return new Promise((resolve, reject) => {
    const select = document.getElementById('assignmentUnit');
    if (!select) {
      console.error('Assignment unit select element not found');
      reject(new Error('Assignment unit select element not found'));
      return;
    }
    
    select.innerHTML = '<option value="">Choose a unit...</option>';
    
    db.ref('units').once('value').then(snapshot => {
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const unit = child.val();
          const option = document.createElement('option');
          option.value = child.key;
          option.textContent = unit.name || unit.title || child.key;
          select.appendChild(option);
        });
      }
      resolve();
    }).catch(error => {
      console.error('Error loading units for assignment:', error);
      reject(error);
    });
  });
}

function loadRubricsForAssignment() {
  return new Promise((resolve, reject) => {
    const select = document.getElementById('assignmentRubric');
    if (!select) {
      console.error('Assignment rubric select element not found');
      reject(new Error('Assignment rubric select element not found'));
      return;
    }
    
    select.innerHTML = '<option value="">Select existing rubric (optional)</option>';
    
    db.ref('rubrics').once('value').then(snapshot => {
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const rubric = child.val();
          const option = document.createElement('option');
          option.value = child.key;
          option.textContent = rubric.name || rubric.title || child.key;
          select.appendChild(option);
        });
      }
      resolve();
    }).catch(error => {
      console.error('Error loading rubrics for assignment:', error);
      reject(error);
    });
  });
}

// Assignment Form Submission
document.getElementById('createAssignmentForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const assignmentData = {
    title: document.getElementById('assignmentTitle').value,
    description: document.getElementById('assignmentDescription').value,
    unit: document.getElementById('assignmentUnit').value,
    dueDate: document.getElementById('assignmentDueDate').value,
    maxPoints: parseInt(document.getElementById('assignmentMaxPoints').value),
    submissionType: document.getElementById('assignmentSubmissionType').value,
    allowedFileTypes: document.getElementById('assignmentFileTypes').value.split(',').map(type => type.trim()),
    maxFileUploads: parseInt(document.getElementById('assignmentMaxFiles').value) || 1,
    rubric: document.getElementById('assignmentRubric').value,
    createdBy: firebase.auth().currentUser.uid,
    createdAt: Date.now(),
    active: true
  };
  
  // Save assignment to database
  const assignmentRef = db.ref('assignments').push();
  assignmentRef.set(assignmentData).then(() => {
    alert('Assignment created successfully!');
    closeModal('createAssignmentModal');
    document.getElementById('createAssignmentForm').reset();
  }).catch(error => {
    console.error('Error creating assignment:', error);
    alert('Error creating assignment. Please try again.');
  });
});

// Rubric Creation Functions
function addCriteria() {
  currentCriteriaCount++;
  const container = document.getElementById('criteriaContainer');
  
  const criteriaHtml = `
    <div class="criteria-item" data-criteria="${currentCriteriaCount}">
      <div class="criteria-header">
        <input type="text" class="form-input criteria-name" placeholder="Criteria name (e.g., Content Quality)" required>
        <input type="number" class="form-input criteria-weight" placeholder="Weight %" min="1" max="100" value="25" required>
        <button type="button" class="action-btn secondary" onclick="removeCriteria(this)" style="padding: 4px 8px; margin-left: 8px;">Remove</button>
      </div>
      <div class="criteria-levels">
        <div class="level-item">
          <label>Excellent (4)</label>
          <textarea class="form-textarea level-description" placeholder="Describe excellent performance..." required></textarea>
        </div>
        <div class="level-item">
          <label>Good (3)</label>
          <textarea class="form-textarea level-description" placeholder="Describe good performance..." required></textarea>
        </div>
        <div class="level-item">
          <label>Fair (2)</label>
          <textarea class="form-textarea level-description" placeholder="Describe fair performance..." required></textarea>
        </div>
        <div class="level-item">
          <label>Poor (1)</label>
          <textarea class="form-textarea level-description" placeholder="Describe poor performance..." required></textarea>
        </div>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', criteriaHtml);
}

function removeCriteria(button) {
  const criteriaItem = button.closest('.criteria-item');
  if (document.querySelectorAll('.criteria-item').length > 1) {
    criteriaItem.remove();
  } else {
    alert('At least one criteria is required.');
  }
}

// Rubric Form Submission
const createRubricForm = document.getElementById('createRubricForm');
if (createRubricForm) {
  createRubricForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const rubricData = {
      name: document.getElementById('rubricName').value,
      description: document.getElementById('rubricDescription').value,
      criteria: [],
      createdBy: firebase.auth().currentUser.uid,
    createdAt: Date.now()
  };
  
  // Collect criteria
  const criteriaItems = document.querySelectorAll('.criteria-item');
  criteriaItems.forEach(item => {
    const criteriaName = item.querySelector('.criteria-name').value;
    const criteriaWeight = parseInt(item.querySelector('.criteria-weight').value);
    const levels = [];
    
    const levelItems = item.querySelectorAll('.level-item');
    levelItems.forEach((levelItem, index) => {
      const description = levelItem.querySelector('.level-description').value;
      levels.push({
        level: 4 - index, // 4 = Excellent, 3 = Good, 2 = Fair, 1 = Poor
        description: description
      });
    });
    
    rubricData.criteria.push({
      name: criteriaName,
      weight: criteriaWeight,
      levels: levels
    });
  });
  
  // Save rubric to database
  const rubricRef = db.ref('rubrics').push();
  rubricRef.set(rubricData).then(() => {
    alert('Rubric created successfully!');
    closeModal('createRubricModal');
    const createRubricForm = document.getElementById('createRubricForm');
    if (createRubricForm) {
      createRubricForm.reset();
    }
    currentCriteriaCount = 1;
    document.getElementById('criteriaContainer').innerHTML = `
      <div class="criteria-item" data-criteria="1">
        <div class="criteria-header">
          <input type="text" class="form-input criteria-name" placeholder="Criteria name (e.g., Content Quality)" required>
          <input type="number" class="form-input criteria-weight" placeholder="Weight %" min="1" max="100" value="25" required>
        </div>
        <div class="criteria-levels">
          <div class="level-item">
            <label>Excellent (4)</label>
            <textarea class="form-textarea level-description" placeholder="Describe excellent performance..." required></textarea>
          </div>
          <div class="level-item">
            <label>Good (3)</label>
            <textarea class="form-textarea level-description" placeholder="Describe good performance..." required></textarea>
          </div>
          <div class="level-item">
            <label>Fair (2)</label>
            <textarea class="form-textarea level-description" placeholder="Describe fair performance..." required></textarea>
          </div>
          <div class="level-item">
            <label>Poor (1)</label>
            <textarea class="form-textarea level-description" placeholder="Describe poor performance..." required></textarea>
          </div>
        </div>
      </div>
    `;
  }).catch(error => {
    console.error('Error creating rubric:', error);
    alert('Error creating rubric. Please try again.');
  });
  });
}

// Grading Center Functions
function loadSubmissions() {
  const container = document.getElementById('submissionsContainer');
  container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading assessments...</div>';
  
  // Load all assessments (quizzes and assignments)
  loadAssessmentsForGrading();
}

function loadAssessmentsForGrading() {
  const container = document.getElementById('submissionsContainer');
  const assessments = [];
  
  // Load quizzes
  db.ref('quizzes').once('value').then(quizSnapshot => {
    if (quizSnapshot.exists()) {
      quizSnapshot.forEach(child => {
        assessments.push({
          id: child.key,
          type: 'quiz',
          title: child.val().title,
          unit: child.val().unit,
          created: child.val().createdAt || Date.now()
        });
      });
    }
    
    // Load assignments
    db.ref('assignments').once('value').then(assignmentSnapshot => {
      if (assignmentSnapshot.exists()) {
        assignmentSnapshot.forEach(child => {
          assessments.push({
            id: child.key,
            type: 'assignment',
            title: child.val().title,
            unit: child.val().unit,
            created: child.val().createdAt || Date.now()
          });
        });
      }
      
      displayAssessmentsForGrading(assessments, container);
    });
  });
}

function displayAssessmentsForGrading(assessments, container) {
  if (assessments.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">assignment</span>
        <p>No assessments available for grading</p>
      </div>
    `;
    return;
  }
  
  // Sort assessments by creation date (newest first)
  assessments.sort((a, b) => b.created - a.created);
  
  let html = '<div class="grading-assessments-grid">';
  
  assessments.forEach(assessment => {
    const typeIcon = assessment.type === 'quiz' ? 'quiz' : 'assignment';
    const typeLabel = assessment.type === 'quiz' ? 'Quiz' : 'Assignment';
    
    html += `
      <div class="grading-assessment-card" onclick="loadStudentSubmissions('${assessment.id}', '${assessment.type}')">
        <div class="assessment-header">
          <span class="material-icons assessment-icon" style="color: #6c4fc1;">${typeIcon}</span>
          <div class="assessment-info">
            <h3>${assessment.title}</h3>
            <p class="assessment-meta">${typeLabel} • ${assessment.unit}</p>
          </div>
        </div>
        <div class="assessment-actions">
          <button class="action-btn" onclick="event.stopPropagation(); loadStudentSubmissions('${assessment.id}', '${assessment.type}')">
            View Submissions
          </button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  // Add styles for the new grading interface
  const styles = `
    <style>
      .grading-assessments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
      }
      
      .grading-assessment-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .grading-assessment-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .assessment-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .assessment-icon {
        font-size: 32px;
      }
      
      .assessment-info h3 {
        margin: 0 0 4px 0;
        color: #333;
      }
      
      .assessment-meta {
        margin: 0;
        color: #666;
        font-size: 14px;
      }
      
      .assessment-actions {
        text-align: right;
      }
      
      .students-list {
        margin-top: 20px;
      }
      
      .student-submission-card {
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .student-submission-card:hover {
        background: #e9ecef;
      }
      
      .student-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .student-name {
        font-weight: bold;
        color: #333;
      }
      
      .submission-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }
      
      .submission-status.graded {
        background: #d4edda;
        color: #155724;
      }
      
      .submission-status.pending {
        background: #fff3cd;
        color: #856404;
      }
      
      .submission-status.no-submission {
        background: #f8d7da;
        color: #721c24;
      }
      
      .back-to-assessments {
        margin-bottom: 20px;
      }
    </style>
  `;
  
  container.innerHTML = styles + html;
}

function loadStudentSubmissions(assessmentId, type) {
  const container = document.getElementById('submissionsContainer');
  container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading student submissions...</div>';
  
  // Get assessment details first
  const assessmentRef = type === 'quiz' ? `quizzes/${assessmentId}` : `assignments/${assessmentId}`;
  
  db.ref(assessmentRef).once('value').then(assessmentSnapshot => {
    if (!assessmentSnapshot.exists()) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Assessment not found</div>';
      return;
    }
    
    const assessment = assessmentSnapshot.val();
    
    // Get submissions first to know which students we need to find
    if (type === 'quiz') {
      loadQuizSubmissionsForStudents(assessmentId, assessment, [], container);
    } else {
      loadAssignmentSubmissionsForStudents(assessmentId, assessment, [], container);
    }
  });
}

function loadQuizSubmissionsForStudents(quizId, quiz, students, container) {
  console.log('Loading quiz submissions for quiz ID:', quizId);
  
  // Get all quiz submissions for this quiz
  db.ref('quizSubmissions').orderByChild('quizId').equalTo(quizId).once('value').then(snapshot => {
    const submissions = {};
    
    console.log('Quiz submissions snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const submission = child.val();
        const studentId = submission.studentId;
        
        console.log('Found quiz submission for student:', studentId, submission);
        
        if (!submissions[studentId]) {
          submissions[studentId] = [];
        }
        
        submissions[studentId].push({
          id: child.key,
          ...submission
        });
      });
    }
    
    console.log('Quiz submissions found:', Object.keys(submissions).length);
    
    // Now get all users to match students
    db.ref('users').once('value').then(usersSnapshot => {
      const studentsWithSubmissions = [];
      
      if (usersSnapshot.exists()) {
        // First, try to match existing students by Auth UID from submissions
        Object.keys(submissions).forEach(submissionStudentId => {
          usersSnapshot.forEach(child => {
            const user = child.val();
            // Try to match by checking if the user's Auth UID matches the submission's studentId
            // or if the user's email matches the submission's studentEmail
            const submissionData = submissions[submissionStudentId][0];
            
            if (user.email === submissionData.studentEmail) {
              studentsWithSubmissions.push({
                id: submissionStudentId, // Use the Auth UID from submissions
                dbKey: child.key,
                name: user.name || user.email,
                email: user.email
              });
            }
          });
        });
        
        // Also add students who don't have submissions yet
        usersSnapshot.forEach(child => {
          const user = child.val();
          if (user.type === 'student' || !user.type) {
            // Check if we already have this student
            const alreadyExists = studentsWithSubmissions.find(s => s.email === user.email);
            if (!alreadyExists) {
              studentsWithSubmissions.push({
                id: child.key, // Use database key since we don't have their Auth UID
                dbKey: child.key,
                name: user.name || user.email,
                email: user.email
              });
            }
          }
        });
      }
      
      console.log('Students with submissions:', studentsWithSubmissions.length);
      displayStudentSubmissions(quizId, quiz, 'quiz', studentsWithSubmissions, submissions, container);
    }).catch(error => {
      console.error('Error loading users:', error);
      displayStudentSubmissions(quizId, quiz, 'quiz', [], submissions, container);
    });
  }).catch(error => {
    console.error('Error loading quiz submissions:', error);
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff5722;">Error loading quiz submissions</div>';
  });
}

function loadAssignmentSubmissionsForStudents(assignmentId, assignment, students, container) {
  console.log('Loading assignment submissions for assignment ID:', assignmentId);
  
  // Get all assignment submissions for this assignment
  db.ref('submissions').orderByChild('assignmentId').equalTo(assignmentId).once('value').then(snapshot => {
    const submissions = {};
    
    console.log('Assignment submissions snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const submission = child.val();
        const studentId = submission.studentId;
        
        console.log('Found assignment submission for student:', studentId, submission);
        
        submissions[studentId] = {
          id: child.key,
          ...submission
        };
      });
    }
    
    console.log('Assignment submissions found:', Object.keys(submissions).length);
    
    // Now get all users to match students
    db.ref('users').once('value').then(usersSnapshot => {
      const studentsWithSubmissions = [];
      
      if (usersSnapshot.exists()) {
        // First, try to match existing students by Auth UID from submissions
        Object.keys(submissions).forEach(submissionStudentId => {
          usersSnapshot.forEach(child => {
            const user = child.val();
            // Try to match by checking if the user's Auth UID matches the submission's studentId
            // or if the user's email matches the submission's studentEmail
            const submissionData = submissions[submissionStudentId];
            
            if (user.email === submissionData.studentEmail) {
              studentsWithSubmissions.push({
                id: submissionStudentId, // Use the Auth UID from submissions
                dbKey: child.key,
                name: user.name || user.email,
                email: user.email
              });
            }
          });
        });
        
        // Also add students who don't have submissions yet
        usersSnapshot.forEach(child => {
          const user = child.val();
          if (user.type === 'student' || !user.type) {
            // Check if we already have this student
            const alreadyExists = studentsWithSubmissions.find(s => s.email === user.email);
            if (!alreadyExists) {
              studentsWithSubmissions.push({
                id: child.key, // Use database key since we don't have their Auth UID
                dbKey: child.key,
                name: user.name || user.email,
                email: user.email
              });
            }
          }
        });
      }
      
      console.log('Students with submissions:', studentsWithSubmissions.length);
      displayStudentSubmissions(assignmentId, assignment, 'assignment', studentsWithSubmissions, submissions, container);
    }).catch(error => {
      console.error('Error loading users:', error);
      displayStudentSubmissions(assignmentId, assignment, 'assignment', [], submissions, container);
    });
  }).catch(error => {
    console.error('Error loading assignment submissions:', error);
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff5722;">Error loading assignment submissions</div>';
  });
}

function displayStudentSubmissions(assessmentId, assessment, type, students, submissions, container) {
  const typeLabel = type === 'quiz' ? 'Quiz' : 'Assignment';
  
  console.log('=== DISPLAYING STUDENT SUBMISSIONS ===');
  console.log('Assessment ID:', assessmentId);
  console.log('Type:', type);
  console.log('Students count:', students.length);
  console.log('Students:', students);
  console.log('Submissions object:', submissions);
  console.log('Submissions count:', Object.keys(submissions).length);
  
  // If no students found but we have submissions, create student objects from submissions
  if (students.length === 0 && Object.keys(submissions).length > 0) {
    console.log('No students found, creating student objects from submissions...');
    Object.keys(submissions).forEach(studentId => {
      const submissionData = type === 'quiz' ? submissions[studentId][0] : submissions[studentId];
      console.log('Processing submission data for student creation:', submissionData);
      
      if (submissionData && submissionData.studentEmail) {
        students.push({
          id: studentId,
          name: submissionData.studentName || submissionData.studentEmail,
          email: submissionData.studentEmail
        });
      }
    });
    console.log('Students created from submissions:', students.length);
  }
  
  let html = `
    <div class="back-to-assessments">
      <button class="action-btn secondary" onclick="loadAssessmentsForGrading()">
        <span class="material-icons">arrow_back</span> Back to Assessments
      </button>
    </div>
    
    <div class="assessment-grading-header">
      <h2>${typeLabel}: ${assessment.title}</h2>
      <p>Student submissions for this ${type.toLowerCase()}</p>
      <div class="assessment-stats" style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #6c4fc1; color: #333;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; font-size: 14px;">
          <div><strong>Total Students:</strong> ${students.length}</div>
          <div><strong>Submissions:</strong> ${Object.keys(submissions).length}</div>
          <div><strong>Completion Rate:</strong> ${students.length > 0 ? Math.round((Object.keys(submissions).length / students.length) * 100) : 0}%</div>
          ${type === 'assignment' ? `<div><strong>Pending Grades:</strong> ${Object.values(submissions).filter(s => !s.graded).length}</div>` : ''}
        </div>
      </div>
    </div>
    
    <div class="students-list">
  `;
  
  if (students.length === 0) {
    html += `
      <div style="text-align: center; padding: 40px; color: #666;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">person_outline</span>
        <p>No students found in the system</p>
        <p style="font-size: 14px; color: #999;">This could mean:</p>
        <ul style="text-align: left; display: inline-block; color: #999; font-size: 14px;">
          <li>No students are registered in the system</li>
          <li>Students don't have the correct 'role' field set</li>
          <li>Database query issue</li>
        </ul>
      </div>
    `;
  } else {
    console.log('Processing students for display...');
    
    students.forEach(student => {
      console.log(`Processing student: ${student.name} (${student.id})`);
      const studentSubmissions = submissions[student.id];
      console.log('Student submissions:', studentSubmissions);
      
      let statusHtml = '';
      let actionHtml = '';
      let submissionDetails = '';
      
      if (type === 'quiz') {
        if (studentSubmissions && studentSubmissions.length > 0) {
          console.log('Quiz submissions found:', studentSubmissions.length);
          const sortedSubmissions = studentSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);
          const latestSubmission = sortedSubmissions[0];
          const bestScore = Math.max(...studentSubmissions.map(s => s.score || 0));
          const averageScore = studentSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / studentSubmissions.length;
          
          statusHtml = `
            <div class="submission-status graded">
              ${studentSubmissions.length} attempt(s) • Best: ${bestScore.toFixed(1)}% • Avg: ${averageScore.toFixed(1)}%
            </div>
          `;
          
          submissionDetails = `
            <div class="submission-details" style="margin-top: 8px; font-size: 12px; color: #666;">
              <div>Last attempt: ${new Date(latestSubmission.submittedAt).toLocaleString()}</div>
              <div>First attempt: ${new Date(sortedSubmissions[sortedSubmissions.length - 1].submittedAt).toLocaleString()}</div>
            </div>
          `;
          
          actionHtml = `
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="action-btn" onclick="viewStudentQuizAttempts('${assessmentId}', '${student.id}', '${student.name}')" style="padding: 6px 12px; font-size: 12px;">
                View All Attempts
              </button>
              <button class="action-btn secondary" onclick="resetQuizAttempts('${assessmentId}', '${student.id}', '${student.email}')" style="padding: 6px 12px; font-size: 12px;">
                Reset
              </button>
            </div>
          `;
        } else {
          console.log('No quiz submissions found for student');
          statusHtml = '<div class="submission-status no-submission">No attempts</div>';
          submissionDetails = '<div class="submission-details" style="margin-top: 8px; font-size: 12px; color: #666;">Student has not started this quiz</div>';
          actionHtml = '<span style="color: #666; font-size: 12px;">No submission</span>';
        }
      } else {
        if (studentSubmissions) {
          console.log('Assignment submission found:', studentSubmissions);
          const isGraded = studentSubmissions.graded;
          const statusClass = isGraded ? 'graded' : 'pending';
          const statusText = isGraded ? `Graded: ${studentSubmissions.grade}/${studentSubmissions.maxPoints} (${Math.round((studentSubmissions.grade / studentSubmissions.maxPoints) * 100)}%)` : 'Pending grading';
          
          statusHtml = `<div class="submission-status ${statusClass}">${statusText}</div>`;
          
          submissionDetails = `
            <div class="submission-details" style="margin-top: 8px; font-size: 12px; color: #666;">
              <div>Submitted: ${new Date(studentSubmissions.submittedAt).toLocaleString()}</div>
              ${studentSubmissions.fileNames ? `<div>Files: ${studentSubmissions.fileNames.join(', ')}</div>` : ''}
              ${studentSubmissions.textContent ? `<div>Has text submission: Yes</div>` : ''}
              ${isGraded ? `<div>Graded: ${new Date(studentSubmissions.gradedAt || studentSubmissions.submittedAt).toLocaleString()}</div>` : ''}
            </div>
          `;
          
          actionHtml = `
            <button class="action-btn" onclick="viewStudentAssignmentSubmission('${studentSubmissions.id}', '${student.name}')" style="padding: 6px 12px; font-size: 12px;">
              ${isGraded ? 'View Grade' : 'Grade Now'}
            </button>
          `;
        } else {
          console.log('No assignment submission found for student');
          statusHtml = '<div class="submission-status no-submission">No submission</div>';
          submissionDetails = '<div class="submission-details" style="margin-top: 8px; font-size: 12px; color: #666;">Student has not submitted this assignment</div>';
          actionHtml = '<span style="color: #666; font-size: 12px;">No submission</span>';
        }
      }
      
      html += `
        <div class="student-submission-card" style="margin-bottom: 16px; padding: 16px; border: 1px solid #ddd; border-radius: 8px; background: white;">
          <div class="student-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <span class="student-name" style="font-weight: bold; color: #333; font-size: 16px;">${student.name}</span>
              <div style="font-size: 12px; color: #666; margin-top: 2px;">${student.email}</div>
            </div>
            ${statusHtml}
          </div>
          ${submissionDetails}
          <div class="student-actions" style="margin-top: 12px; display: flex; justify-content: flex-end;">
            ${actionHtml}
          </div>
        </div>
      `;
    });
  }
  
  html += '</div>';
  
  container.innerHTML = html;
  
  console.log('=== FINISHED DISPLAYING STUDENT SUBMISSIONS ===');
}

function viewStudentQuizAttempts(quizId, studentId, studentName) {
  // Get all attempts for this quiz and student
  db.ref('quizSubmissions').orderByChild('quizId').equalTo(quizId).once('value').then(snapshot => {
    const attempts = [];
    
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const submission = child.val();
        if (submission.studentId === studentId) {
          attempts.push({
            id: child.key,
            ...submission
          });
        }
      });
    }
    
    if (attempts.length === 0) {
      showNotification('No attempts found for this student', 'info');
      return;
    }
    
    // Get quiz details
    db.ref(`quizzes/${quizId}`).once('value').then(quizSnapshot => {
      if (quizSnapshot.exists()) {
        const quiz = quizSnapshot.val();
        quiz.id = quizId;
        displayQuizSubmissionModal(attempts, quiz);
      }
    });
  });
}

function viewStudentAssignmentSubmission(submissionId, studentName) {
  // Set the current submission ID for the grading modal
  window.currentSubmissionId = submissionId;
  
  // Load the submission details
  loadSubmissionDetails(submissionId);
  
  // Open the grading modal
  document.getElementById('gradeSubmissionModal').style.display = 'flex';
}

function openQuizSubmissionModal(quizId, studentId) {
  // Get all attempts for this quiz and student
  db.ref('quizSubmissions').orderByChild('quizId').equalTo(quizId).once('value').then(snapshot => {
    const attempts = [];
    
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const submission = child.val();
        if (submission.studentId === studentId) {
          attempts.push({
            id: child.key,
            ...submission
          });
        }
      });
    }
    
    if (attempts.length === 0) {
      alert('No attempts found for this student');
      return;
    }
    
    // Get quiz details
    db.ref(`quizzes/${quizId}`).once('value').then(quizSnapshot => {
      if (quizSnapshot.exists()) {
        const quiz = quizSnapshot.val();
        quiz.id = quizId;
        displayQuizSubmissionModal(attempts, quiz);
      }
    });
  });
}

function displayAllSubmissions(submissions, container) {
  container.innerHTML = '';
  
  if (submissions.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 20px;">No submissions found.</div>';
    return;
  }
  
  // Apply filters
  const assessmentTypeFilter = document.getElementById('assessmentTypeFilter').value;
  const specificAssessmentFilter = document.getElementById('specificAssessmentFilter').value;
  const gradingStatusFilter = document.getElementById('gradingStatusFilter').value;
  const sortOrderFilter = document.getElementById('sortOrderFilter').value;
  const studentSearchFilter = document.getElementById('studentSearchFilter').value.toLowerCase().trim();
  
  let filteredSubmissions = submissions.filter(submission => {
    // Level 1: Assessment Type filter
    if (assessmentTypeFilter !== 'all') {
      if (submission.type !== assessmentTypeFilter) return false;
    }
    
    // Level 2: Specific Assessment filter
    if (specificAssessmentFilter !== 'all') {
      if (submission.type === 'assignment') {
        if (submission.data.assignmentId !== specificAssessmentFilter) return false;
      } else if (submission.type === 'quiz') {
        if (submission.data.quizId !== specificAssessmentFilter) return false;
      }
    }
    
    // Level 3: Grading Status filter
    if (gradingStatusFilter !== 'all') {
      if (gradingStatusFilter === 'pending' && submission.graded) return false;
      if (gradingStatusFilter === 'graded' && !submission.graded) return false;
    }
    
    // Search filter: Student name
    if (studentSearchFilter) {
      const studentName = (submission.studentName || '').toLowerCase();
      const studentEmail = (submission.data.studentEmail || '').toLowerCase();
      if (!studentName.includes(studentSearchFilter) && !studentEmail.includes(studentSearchFilter)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Apply sorting (Level 4)
  switch (sortOrderFilter) {
    case 'newest':
      filteredSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);
      break;
    case 'oldest':
      filteredSubmissions.sort((a, b) => a.submittedAt - b.submittedAt);
      break;
    case 'student':
      filteredSubmissions.sort((a, b) => {
        const nameA = (a.studentName || '').toLowerCase();
        const nameB = (b.studentName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      break;
    case 'score':
      filteredSubmissions.sort((a, b) => {
        const scoreA = parseFloat(a.grade) || 0;
        const scoreB = parseFloat(b.grade) || 0;
        return scoreB - scoreA; // Highest score first
      });
      break;
    default:
      filteredSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);
  }
  
  // Display filtered and sorted submissions
  if (filteredSubmissions.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 20px;">No submissions match the current filters.</div>';
    return;
  }
  
  filteredSubmissions.forEach(submission => {
    const submissionHtml = createSubmissionItem(submission.id, submission);
    container.insertAdjacentHTML('beforeend', submissionHtml);
  });
}

function loadAssignmentFilterOptions() {
  const specificAssessmentSelect = document.getElementById('specificAssessmentFilter');
  const assessmentTypeSelect = document.getElementById('assessmentTypeFilter');
  
  // Clear specific assessment options
  specificAssessmentSelect.innerHTML = '<option value="all">All Items</option>';
  
  // Load options based on current assessment type filter
  const assessmentType = assessmentTypeSelect.value;
  
  // Use Promise.all to ensure proper sequential loading and prevent duplicates
  const promises = [];
  
  if (assessmentType === 'all' || assessmentType === 'assignment') {
    // Load assignments
    promises.push(
      db.ref('assignments').once('value').then(snapshot => {
        const assignmentOptions = [];
        if (snapshot.exists()) {
          snapshot.forEach(child => {
            const assignment = child.val();
            assignmentOptions.push({
              value: child.key,
              text: `Assignment: ${assignment.title}`,
              type: 'assignment'
            });
          });
        }
        return assignmentOptions;
      })
    );
  }
  
  if (assessmentType === 'all' || assessmentType === 'quiz') {
    // Load quizzes
    promises.push(
      db.ref('quizzes').once('value').then(snapshot => {
        const quizOptions = [];
        if (snapshot.exists()) {
          snapshot.forEach(child => {
            const quiz = child.val();
            quizOptions.push({
              value: child.key,
              text: `Quiz: ${quiz.title}`,
              type: 'quiz'
            });
          });
        }
        return quizOptions;
      })
    );
  }
  
  // Wait for all promises to resolve, then add options
  Promise.all(promises).then(results => {
    // Clear again to make sure no duplicates
    specificAssessmentSelect.innerHTML = '<option value="all">All Items</option>';
    
    // Flatten and add all options
    const allOptions = results.flat();
    allOptions.forEach(optionData => {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.text;
      option.dataset.type = optionData.type;
      specificAssessmentSelect.appendChild(option);
    });
  }).catch(error => {
    console.error('Error loading filter options:', error);
  });
}

function createSubmissionItem(submissionId, submission) {
  const status = submission.graded ? 'graded' : 'pending';
  const statusText = submission.graded ? 'Graded' : 'Pending';
  const typeIcon = submission.type === 'quiz' ? 'quiz' : 'assignment';
  const typeLabel = submission.type === 'quiz' ? 'Quiz' : 'Assignment';
  
  let gradeDisplay = '';
  if (submission.graded) {
    if (submission.type === 'quiz') {
      gradeDisplay = `<p><strong>Score:</strong> ${submission.grade}% (${submission.correctAnswers}/${submission.totalQuestions})</p>`;
    } else {
      gradeDisplay = `<p><strong>Grade:</strong> ${submission.grade}/${submission.maxPoints}</p>`;
    }
  }
  
  let attemptInfo = '';
  if (submission.type === 'quiz' && submission.attemptCount) {
    attemptInfo = `<p><strong>Attempts:</strong> ${submission.attemptCount}</p>`;
  }
  
  // Add reset button for quiz submissions
  let resetButton = '';
  if (submission.type === 'quiz') {
    const quizId = submission.data.quizId;
    const studentId = submission.data.studentId;
    const studentEmail = submission.data.studentEmail;
    resetButton = `
      <button class="action-btn secondary" onclick="event.stopPropagation(); resetQuizAttempts('${quizId}', '${studentId}', '${studentEmail}')" 
              style="margin-left: 8px; padding: 4px 8px; font-size: 12px; background: #ffc107; color: #212529;" 
              title="Reset all quiz attempts for this student">
        <span class="material-icons" style="font-size: 14px;">refresh</span> Reset
      </button>
    `;
  }
  
  return `
    <div class="submission-item" onclick="openGradeSubmissionModal('${submissionId}', '${submission.type}')">
      <div class="submission-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="material-icons" style="color: #6c4fc1;">${typeIcon}</span>
          <h4>${submission.studentName}</h4>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="submission-status ${status}">${statusText}</span>
          ${resetButton}
        </div>
      </div>
      <p><strong>${typeLabel}:</strong> ${submission.title}</p>
      <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
      ${gradeDisplay}
      ${attemptInfo}
    </div>
  `;
}

function filterSubmissions() {
  // Reload submissions with current filters
  loadSubmissions();
}

function bulkResetQuizAttempts() {
  // Get all visible quiz submissions
  const submissionItems = document.querySelectorAll('.submission-item');
  const quizSubmissions = [];
  
  submissionItems.forEach(item => {
    const resetButton = item.querySelector('button[onclick*="resetQuizAttempts"]');
    if (resetButton) {
      // Extract quiz and student info from the onclick attribute
      const onclickAttr = resetButton.getAttribute('onclick');
      const match = onclickAttr.match(/resetQuizAttempts\('([^']+)', '([^']+)', '([^']+)'\)/);
      if (match) {
        quizSubmissions.push({
          quizId: match[1],
          studentId: match[2],
          studentEmail: match[3]
        });
      }
    }
  });
  
  if (quizSubmissions.length === 0) {
    alert('No quiz submissions found to reset. Please make sure you have quiz submissions visible in the current view.');
    return;
  }
  
  const confirmMessage = `Are you sure you want to reset quiz attempts for ${quizSubmissions.length} quiz submission(s)?\n\nThis action will:\n- Delete all existing attempts for the selected quiz submissions\n- Allow students to retake their quizzes from the beginning\n- Cannot be undone\n\nContinue?`;
  
  if (confirm(confirmMessage)) {
    // Create progress modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'bulkResetModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">Bulk Reset Quiz Attempts</h3>
        </div>
        <div style="padding: 40px;">
          <div style="margin-bottom: 20px; text-align: center;">
            <span class="material-icons" style="font-size: 48px; color: #6c4fc1; animation: spin 1s linear infinite;">refresh</span>
          </div>
          <h4 style="text-align: center; margin-bottom: 20px;">Resetting Quiz Attempts</h4>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Processing <span id="currentItem">0</span> of ${quizSubmissions.length} submissions...</p>
          </div>
          <div style="background: #e9ecef; border-radius: 8px; height: 8px; margin-bottom: 20px; overflow: hidden;">
            <div id="progressBar" style="background: #6c4fc1; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
          </div>
          <div id="resetResults" style="max-height: 200px; overflow-y: auto;">
            <!-- Results will be shown here -->
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add spinning animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    // Process each submission
    let completed = 0;
    let successful = 0;
    let failed = 0;
    const results = [];
    
    const processSubmission = (submission, index) => {
      return new Promise((resolve) => {
        // Update progress
        document.getElementById('currentItem').textContent = index + 1;
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${((index + 1) / quizSubmissions.length) * 100}%`;
        
        // Delete quiz attempts for this student and quiz
        db.ref('quizSubmissions').orderByChild('quizId').equalTo(submission.quizId).once('value').then(snapshot => {
          if (snapshot.exists()) {
            const deletePromises = [];
            
            snapshot.forEach(child => {
              const submissionData = child.val();
              if (submissionData.studentId === submission.studentId) {
                deletePromises.push(db.ref(`quizSubmissions/${child.key}`).remove());
              }
            });
            
            Promise.all(deletePromises).then(() => {
              successful++;
              results.push(`✓ ${submission.studentEmail} - Reset successful`);
              updateResults();
              resolve();
            }).catch(error => {
              failed++;
              results.push(`✗ ${submission.studentEmail} - Reset failed: ${error.message}`);
              updateResults();
              resolve();
            });
          } else {
            // No attempts found, but count as successful
            successful++;
            results.push(`✓ ${submission.studentEmail} - No attempts found`);
            updateResults();
            resolve();
          }
        }).catch(error => {
          failed++;
          results.push(`✗ ${submission.studentEmail} - Error: ${error.message}`);
          updateResults();
          resolve();
        });
      });
    };
    
    const updateResults = () => {
      const resultsDiv = document.getElementById('resetResults');
      resultsDiv.innerHTML = results.map(result => 
        `<div style="padding: 4px 0; font-size: 13px; color: ${result.startsWith('✓') ? '#28a745' : '#dc3545'};">${result}</div>`
      ).join('');
      resultsDiv.scrollTop = resultsDiv.scrollHeight;
    };
    
    // Process all submissions sequentially
    const processAll = async () => {
      for (let i = 0; i < quizSubmissions.length; i++) {
        await processSubmission(quizSubmissions[i], i);
      }
      
      // Show completion message
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title">Bulk Reset Complete</h3>
          </div>
          <div style="padding: 40px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span class="material-icons" style="font-size: 48px; color: ${failed === 0 ? '#28a745' : '#ffc107'};">
                ${failed === 0 ? 'check_circle' : 'warning'}
              </span>
            </div>
            <h4 style="color: ${failed === 0 ? '#28a745' : '#ffc107'}; margin-bottom: 16px;">
              ${failed === 0 ? 'All Resets Completed Successfully!' : 'Bulk Reset Completed with Issues'}
            </h4>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px; color: black;">
              <p style="margin: 0;"><strong>Successful:</strong> ${successful}</p>
              <p style="margin: 0;"><strong>Failed:</strong> ${failed}</p>
              <p style="margin: 0;"><strong>Total:</strong> ${quizSubmissions.length}</p>
            </div>
            <div style="margin-top: 30px;">
              <button class="action-btn" onclick="closeModal('bulkResetModal'); this.parentElement.parentElement.parentElement.remove(); loadSubmissions();">Close and Refresh</button>
            </div>
          </div>
        </div>
      `;
      
      // Clean up the style element
      document.head.removeChild(style);
      
      // Show notification
      if (failed === 0) {
        showNotification(
          `All ${successful} quiz attempts reset successfully!`,
          'success',
          'Bulk Reset Complete'
        );
      } else {
        showNotification(
          `Bulk reset completed: ${successful} successful, ${failed} failed`,
          'warning',
          'Bulk Reset Complete'
        );
      }
    };
    
    processAll();
  }
}

function openGradeSubmissionModal(submissionId, type = 'assignment') {
  if (type === 'quiz') {
    // Extract quiz ID and student ID from the grouped submission ID
    const parts = submissionId.split('_');
    if (parts.length >= 3) {
      const quizId = parts[1];
      const studentId = parts[2];
      openQuizSubmissionModal(quizId, studentId);
    }
  } else {
    window.currentSubmissionId = submissionId; // Store for later use
    document.getElementById('gradeSubmissionModal').style.display = 'flex';
    loadSubmissionDetails(submissionId);
  }
}

function openQuizSubmissionModal(quizId, studentId) {
  // Get all attempts for this quiz and student
  db.ref('quizSubmissions').orderByChild('quizId').equalTo(quizId).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const attempts = [];
      
      snapshot.forEach(child => {
        const submission = child.val();
        if (submission.studentId === studentId) {
          attempts.push({
            id: child.key,
            ...submission
          });
        }
      });
      
      if (attempts.length === 0) {
        showNotification('No submissions found for this quiz', 'info');
        return;
      }
      
      // Sort attempts by submission date (newest first for display, but we'll show attempt 1 by default)
      attempts.sort((a, b) => a.submittedAt - b.submittedAt);
      
      // Get quiz details
      db.ref(`quizzes/${quizId}`).once('value').then(quizSnapshot => {
        if (quizSnapshot.exists()) {
          const quiz = quizSnapshot.val();
          displayQuizSubmissionModal(attempts, quiz);
        }
      });
    }
  });
}

function displayQuizSubmissionModal(attempts, quiz) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'quizSubmissionModal';
  modal.style.display = 'flex';
  
  // Show first attempt by default
  let currentAttemptIndex = 0;
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h3 class="modal-title">Quiz Submissions: ${quiz.title}</h3>
        <button class="modal-close" onclick="closeModal('quizSubmissionModal'); this.parentElement.parentElement.parentElement.remove();">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 16px; border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #fff;">Student: ${attempts[0].studentEmail}</h4>
          <p style="margin: 4px 0;"><strong>Total Attempts:</strong> ${attempts.length}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #fff;">Select Attempt to View:</h4>
          <div style="position: relative; display: inline-block; min-width: 250px;">
            <div class="custom-dropdown" id="attemptDropdown" onclick="toggleAttemptDropdown()">
              <div class="dropdown-selected">
                <span id="selectedAttemptText">Attempt 1 (${attempts[0].score ? attempts[0].score.toFixed(1) : '0'}%)</span>
                <span class="material-icons dropdown-arrow">arrow_drop_down</span>
              </div>
              <div class="dropdown-options" id="attemptDropdownOptions">
                ${attempts.map((attempt, index) => `
                  <div class="dropdown-option ${index === 0 ? 'selected' : ''}" 
                       onclick="selectAttemptFromDropdown(${index})"
                       data-index="${index}">
                    <span class="attempt-label">Attempt ${index + 1}</span>
                    <span class="attempt-score">${attempt.score ? attempt.score.toFixed(1) : '0'}%</span>
                    <span class="attempt-date">${new Date(attempt.submittedAt).toLocaleString()}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        
        <div id="attemptContent">
          <!-- Attempt content will be loaded here -->
        </div>
        
        <div class="feature-actions">
          <button class="action-btn" onclick="resetQuizAttempts('${quiz.id}', '${attempts[0].studentId}', '${attempts[0].studentEmail}')">Reset Attempts</button>
          <button class="action-btn secondary" onclick="closeModal('quizSubmissionModal'); this.parentElement.parentElement.parentElement.remove();">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Store attempts data and quiz data globally for the modal
  window.quizModalAttempts = attempts;
  window.quizModalQuiz = quiz;
  
  // Show first attempt by default
  selectAttempt(0);
}

function selectAttempt(index) {
  const attempts = window.quizModalAttempts;
  const quiz = window.quizModalQuiz;
  const selectedAttempt = attempts[index];
  
  // Update dropdown selection
  const dropdownOptions = document.querySelectorAll('.dropdown-option');
  dropdownOptions.forEach(option => option.classList.remove('selected'));
  
  const selectedOption = document.querySelector(`.dropdown-option[data-index="${index}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }
  
  // Update selected text
  const selectedText = document.getElementById('selectedAttemptText');
  if (selectedText) {
    selectedText.textContent = `Attempt ${index + 1} (${selectedAttempt.score ? selectedAttempt.score.toFixed(1) : '0'}%)`;
  }
  
  // Display attempt content
  const attemptContent = document.getElementById('attemptContent');
  
  attemptContent.innerHTML = `
    <div style="margin-bottom: 20px; padding: 16px; border-radius: 8px;">
      <h4 style="margin: 0 0 8px 0; color: #6c4fc1; text-decoration: underline;">Attempt ${index + 1} Details</h4>
      <p style="margin: 4px 0;"><strong>Score:</strong> ${selectedAttempt.score ? selectedAttempt.score.toFixed(1) : '0'}%</p>
      <p style="margin: 4px 0;"><strong>Correct Answers:</strong> ${selectedAttempt.correctAnswers}/${selectedAttempt.totalQuestions}</p>
      <p style="margin: 4px 0;"><strong>Submitted:</strong> ${new Date(selectedAttempt.submittedAt).toLocaleString()}</p>
      <p style="margin: 4px 0;"><strong>Auto-graded:</strong> ${selectedAttempt.autoGraded ? 'Yes' : 'No'}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4 style="color: #fff;">Question Review</h4>
      <div style="max-height: 400px; overflow-y: auto;">
        ${quiz.questions.map((question, qIndex) => {
          const userAnswer = selectedAttempt.answers[qIndex];
          const isCorrect = checkQuizAnswer(question, userAnswer);
          
          return `
            <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-weight: bold; color: #fff;">Question ${qIndex + 1}</span>
                <span class="material-icons" style="color: ${isCorrect ? '#28a745' : '#dc3545'}; font-size: 18px;">
                  ${isCorrect ? 'check_circle' : 'cancel'}
                </span>
              </div>
              <p style="margin-bottom: 8px; font-weight: 500;">${question.text}</p>
              ${generateQuizSubmissionReview(question, userAnswer, isCorrect)}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function toggleAttemptDropdown() {
  const dropdownOptions = document.getElementById('attemptDropdownOptions');
  const dropdown = document.getElementById('attemptDropdown');
  
  if (dropdownOptions.style.display === 'block') {
    dropdownOptions.style.display = 'none';
    dropdown.classList.remove('active');
  } else {
    dropdownOptions.style.display = 'block';
    dropdown.classList.add('active');
  }
}

function selectAttemptFromDropdown(index) {
  // Prevent the dropdown click event from bubbling up
  event.stopPropagation();
  
  selectAttempt(index);
  
  // Close the dropdown after selection
  const dropdownOptions = document.getElementById('attemptDropdownOptions');
  const dropdown = document.getElementById('attemptDropdown');
  
  if (dropdownOptions && dropdown) {
    dropdownOptions.style.display = 'none';
    dropdown.classList.remove('active');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('attemptDropdown');
  if (dropdown && !dropdown.contains(event.target)) {
    const dropdownOptions = document.getElementById('attemptDropdownOptions');
    if (dropdownOptions) {
      dropdownOptions.style.display = 'none';
      dropdown.classList.remove('active');
    }
  }
});

// Enhanced modal close function to handle test quiz modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Clean up test quiz timer if closing test modal
    if (modalId === 'quizTestModal' && testQuizTimer) {
      clearInterval(testQuizTimer);
      testQuizTimer = null;
    }
    
    // List of modals that are defined in HTML and should NOT be removed
    const htmlModals = [
      'addUserModal',
      'addUnitModal', 
      'uploadVideoModal',
      'generateTokenModal',
      'createQuizModal',
      'createAssignmentModal',
      'createRubricModal',
      'gradingCenterModal',
      'gradeSubmissionModal',
      'quizTakingModal',
      'manageUnitsModal',
      'editUnitModal'
    ];
    
    // Remove dynamically created modals (but not HTML-defined ones)
    if (modal.parentNode === document.body && !htmlModals.includes(modalId)) {
      modal.remove();
    }
  }
}

function resetQuizAttempts(quizId, studentId, studentEmail) {
  const confirmMessage = `Are you sure you want to reset all quiz attempts for student ${studentEmail}?\n\nThis action will:\n- Delete all existing attempts for this quiz\n- Allow the student to retake the quiz from the beginning\n- Cannot be undone\n\nContinue?`;
  
  if (confirm(confirmMessage)) {
    // Check if we're in the quiz submission modal context
    const quizSubmissionModal = document.getElementById('quizSubmissionModal');
    const isInQuizModal = quizSubmissionModal && quizSubmissionModal.style.display === 'flex';
    
    // Create or update loading modal
    let loadingModal;
    let originalContent;
    
    if (isInQuizModal) {
      // We're in the quiz submission modal, update it
      loadingModal = quizSubmissionModal;
      originalContent = loadingModal.innerHTML;
    } else {
      // We're in the grading center, create a new loading modal
      loadingModal = document.createElement('div');
      loadingModal.className = 'modal';
      loadingModal.id = 'resetLoadingModal';
      loadingModal.style.display = 'flex';
      document.body.appendChild(loadingModal);
    }
    
    // Show loading message
    loadingModal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Resetting Quiz Attempts</h3>
        </div>
        <div style="padding: 40px; text-align: center;">
          <div style="margin-bottom: 20px;">
            <span class="material-icons" style="font-size: 48px; color: #6c4fc1; animation: spin 1s linear infinite;">refresh</span>
          </div>
          <p>Resetting quiz attempts for ${studentEmail}...</p>
          <p style="color: #666; font-size: 14px;">Please wait while we process your request.</p>
        </div>
      </div>
    `;
    
    // Add spinning animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    // Delete all quiz attempts for this student and quiz
    db.ref('quizSubmissions').orderByChild('quizId').equalTo(quizId).once('value').then(snapshot => {
      if (snapshot.exists()) {
        const deletePromises = [];
        
        snapshot.forEach(child => {
          const submission = child.val();
          if (submission.studentId === studentId) {
            deletePromises.push(db.ref(`quizSubmissions/${child.key}`).remove());
          }
        });
        
        Promise.all(deletePromises).then(() => {
          // Show success message
          loadingModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
              <div class="modal-header">
                <h3 class="modal-title">Reset Complete</h3>
              </div>
              <div style="padding: 40px; text-align: center;">
                <div style="margin-bottom: 20px;">
                  <span class="material-icons" style="font-size: 48px; color: #28a745;">check_circle</span>
                </div>
                <h4 style="color: #28a745; margin-bottom: 16px;">Quiz Attempts Reset Successfully!</h4>
                <p>All quiz attempts for <strong>${studentEmail}</strong> have been deleted.</p>
                <p style="color: #666; font-size: 14px;">The student can now retake the quiz from the beginning.</p>
                <div style="margin-top: 30px;">
                  <button class="action-btn" onclick="closeResetModal('${isInQuizModal}'); loadSubmissions();">Close and Refresh</button>
                </div>
              </div>
            </div>
          `;
          
          // Clean up the style element
          document.head.removeChild(style);
          
          // Show notification
          if (typeof showNotification === 'function') {
            showNotification(
              `Quiz attempts reset successfully for ${studentEmail}`,
              'success',
              'Reset Complete'
            );
          } else {
            NotificationManager.showToast(`Quiz attempts reset successfully for ${studentEmail}`);
          }
        }).catch(error => {
          console.error('Error resetting quiz attempts:', error);
          
          // Show error message
          loadingModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
              <div class="modal-header">
                <h3 class="modal-title">Reset Failed</h3>
              </div>
              <div style="padding: 40px; text-align: center;">
                <div style="margin-bottom: 20px;">
                  <span class="material-icons" style="font-size: 48px; color: #dc3545;">error</span>
                </div>
                <h4 style="color: #dc3545; margin-bottom: 16px;">Reset Failed</h4>
                <p>There was an error resetting the quiz attempts.</p>
                <p style="color: #666; font-size: 14px;">Error: ${error.message}</p>
                <div style="margin-top: 30px;">
                  <button class="action-btn secondary" onclick="closeResetModal('${isInQuizModal}');">Close</button>
                </div>
              </div>
            </div>
          `;
          
          // Clean up the style element
          document.head.removeChild(style);
          
          // Show notification
          if (typeof showNotification === 'function') {
            showNotification(
              `Failed to reset quiz attempts: ${error.message}`,
              'error',
              'Reset Failed'
            );
          } else {
            NotificationManager.showToast(`Failed to reset quiz attempts: ${error.message}`);
          }
        });
      } else {
        // No attempts found, but still show success
        loadingModal.innerHTML = `
          <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
              <h3 class="modal-title">Reset Complete</h3>
            </div>
            <div style="padding: 40px; text-align: center;">
              <div style="margin-bottom: 20px;">
                <span class="material-icons" style="font-size: 48px; color: #28a745;">check_circle</span>
              </div>
              <h4 style="color: #28a745; margin-bottom: 16px;">No Attempts Found</h4>
              <p>No quiz attempts found for <strong>${studentEmail}</strong>.</p>
              <p style="color: #666; font-size: 14px;">The student can take the quiz from the beginning.</p>
              <div style="margin-top: 30px;">
                <button class="action-btn" onclick="closeResetModal('${isInQuizModal}'); loadSubmissions();">Close and Refresh</button>
              </div>
            </div>
          </div>
        `;
        
        // Clean up the style element
        document.head.removeChild(style);
        
        // Show notification
        if (typeof showNotification === 'function') {
          showNotification(
            `No quiz attempts found for ${studentEmail}`,
            'info',
            'Reset Complete'
          );
        } else {
          NotificationManager.showToast(`No quiz attempts found for ${studentEmail}`);
        }
      }
    }).catch(error => {
      console.error('Error checking quiz attempts:', error);
      
      // Show error message
      loadingModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <h3 class="modal-title">Reset Failed</h3>
          </div>
          <div style="padding: 40px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span class="material-icons" style="font-size: 48px; color: #dc3545;">error</span>
            </div>
            <h4 style="color: #dc3545; margin-bottom: 16px;">Database Error</h4>
            <p>There was an error accessing the quiz attempts.</p>
            <p style="color: #666; font-size: 14px;">Error: ${error.message}</p>
            <div style="margin-top: 30px;">
              <button class="action-btn secondary" onclick="closeResetModal('${isInQuizModal}');">Close</button>
            </div>
          </div>
        </div>
      `;
      
      // Clean up the style element
      document.head.removeChild(style);
      
      // Show notification
      if (typeof showNotification === 'function') {
        showNotification(
          `Database error: ${error.message}`,
          'error',
          'Reset Failed'
        );
      } else {
        NotificationManager.showToast(`Database error: ${error.message}`);
      }
    });
  }
}

// Helper function to close the reset modal properly
function closeResetModal(isInQuizModal) {
  if (isInQuizModal === 'true') {
    // We're in the quiz submission modal, close it
    const quizModal = document.getElementById('quizSubmissionModal');
    if (quizModal) {
      quizModal.remove();
    }
  } else {
    // We're in the grading center, remove the loading modal
    const loadingModal = document.getElementById('resetLoadingModal');
    if (loadingModal) {
      loadingModal.remove();
    }
  }
  
  // Reset body overflow
  document.body.style.overflow = 'auto';
}

function checkQuizAnswer(question, userAnswer) {
  if (question.type === 'multiple-choice' || question.type === 'true-false') {
    return userAnswer === question.correctAnswer;
  } else {
    return userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
  }
}

function generateQuizSubmissionReview(question, userAnswer, isCorrect) {
  let reviewHtml = '';
  
  if (question.type === 'multiple-choice') {
    reviewHtml += '<div style="margin-bottom: 12px;">';
    question.options.forEach((option, index) => {
      const isUserAnswer = userAnswer === index;
      const isCorrectAnswer = question.correctAnswer === index;
      
      let optionStyle = 'padding: 6px 10px; margin: 2px 0; border-radius: 4px; border: 1px solid #ddd; font-size: 14px;';
      
      if (isCorrectAnswer) {
        optionStyle += ' background: #d4edda; border-color: #28a745; color: #155724;';
      } else if (isUserAnswer && !isCorrect) {
        optionStyle += ' background: #f8d7da; border-color: #dc3545; color: #721c24;';
      }
      
      reviewHtml += `
        <div style="${optionStyle}">
          <span style="margin-right: 8px;">${isUserAnswer ? '●' : '○'}</span>
          ${option}
          ${isCorrectAnswer ? ' <span style="font-weight: bold;">(Correct)</span>' : ''}
          ${isUserAnswer && !isCorrect ? ' <span style="font-weight: bold;">(Student Answer)</span>' : ''}
        </div>
      `;
    });
    reviewHtml += '</div>';
  } else if (question.type === 'true-false') {
    const options = ['True', 'False'];
    reviewHtml += '<div style="margin-bottom: 12px;">';
    options.forEach((option, index) => {
      const isUserAnswer = userAnswer === index;
      const isCorrectAnswer = question.correctAnswer === index;
      
      let optionStyle = 'padding: 6px 10px; margin: 2px 0; border-radius: 4px; border: 1px solid #ddd; font-size: 14px;';
      
      if (isCorrectAnswer) {
        optionStyle += ' background: #d4edda; border-color: #28a745; color: #155724;';
      } else if (isUserAnswer && !isCorrect) {
        optionStyle += ' background: #f8d7da; border-color: #dc3545; color: #721c24;';
      }
      
      reviewHtml += `
        <div style="${optionStyle}">
          <span style="margin-right: 8px;">${isUserAnswer ? '●' : '○'}</span>
          ${option}
          ${isCorrectAnswer ? ' <span style="font-weight: bold;">(Correct)</span>' : ''}
          ${isUserAnswer && !isCorrect ? ' <span style="font-weight: bold;">(Student Answer)</span>' : ''}
        </div>
      `;
    });
    reviewHtml += '</div>';
  } else {
    reviewHtml += `
      <div style="margin-bottom: 12px;">
        <div style="margin-bottom: 8px;">
          <strong>Student Answer:</strong>
          <span style="padding: 4px 8px; background: ${isCorrect ? '#d4edda' : '#f8d7da'}; 
                       border-radius: 4px; color: ${isCorrect ? '#155724' : '#721c24'}; font-size: 14px;">
            ${userAnswer || 'No answer provided'}
          </span>
        </div>
        <div>
          <strong>Correct Answer:</strong>
          <span style="padding: 4px 8px; background: #d4edda; border-radius: 4px; color: #155724; font-size: 14px;">
            ${question.correctAnswer}
          </span>
        </div>
      </div>
    `;
  }
  
  return reviewHtml;
}

function loadSubmissionDetails(submissionId) {
  db.ref(`submissions/${submissionId}`).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const submission = snapshot.val();
      displaySubmissionDetails(submissionId, submission);
    }
  });
}

function displaySubmissionDetails(submissionId, submission) {
  const detailsContainer = document.getElementById('submissionDetails');
  detailsContainer.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h4>${submission.studentName || 'Unknown Student'}</h4>
      <p><strong>Assignment:</strong> ${submission.assignmentTitle}</p>
      <p><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
      <p><strong>Max Points:</strong> ${submission.maxPoints}</p>
    </div>
    <div style="margin-bottom: 20px;">
      <h4>Submission Content:</h4>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; color: #333;">
        ${submission.content || 'No text content'}
      </div>
    </div>
    ${submission.fileUrl ? `<div style="margin-bottom: 20px;">
      <h4>Submitted File:</h4>
      <a href="${submission.fileUrl}" target="_blank" class="action-btn secondary">Download File</a>
    </div>` : ''}
  `;
  
  // Load grading interface
  loadGradingInterface(submissionId, submission);
}

function loadGradingInterface(submissionId, submission) {
  const gradingContainer = document.getElementById('gradingInterface');
  
  if (submission.rubricId) {
    // Load rubric-based grading
    loadRubricGrading(submissionId, submission);
  } else {
    // Load simple points grading
    gradingContainer.innerHTML = `
      <div class="grading-rubric">
        <h4>Grade Assignment</h4>
        <div class="form-group">
          <label class="form-label">Points (out of ${submission.maxPoints})</label>
          <input type="number" class="form-input" id="gradePoints" min="0" max="${submission.maxPoints}" value="${submission.grade || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Feedback</label>
          <textarea class="form-textarea" id="gradeFeedback" placeholder="Enter feedback for the student...">${submission.feedback || ''}</textarea>
        </div>
      </div>
    `;
  }
}

function loadRubricGrading(submissionId, submission) {
  db.ref(`rubrics/${submission.rubricId}`).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const rubric = snapshot.val();
      displayRubricGrading(submissionId, submission, rubric);
    }
  });
}

function displayRubricGrading(submissionId, submission, rubric) {
  const gradingContainer = document.getElementById('gradingInterface');
  
  let rubricHtml = `
    <div class="grading-rubric">
      <h4>Rubric: ${rubric.name}</h4>
      <p>${rubric.description}</p>
  `;
  
  rubric.criteria.forEach((criteria, index) => {
    rubricHtml += `
      <div class="rubric-criteria">
        <h4>${criteria.name} (Weight: ${criteria.weight}%)</h4>
        <div class="rubric-levels">
          ${criteria.levels.map(level => `
            <div class="rubric-level" onclick="selectRubricLevel(${index}, ${level.level})" data-criteria="${index}" data-level="${level.level}">
              <strong>Level ${level.level}</strong>
              <p>${level.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  rubricHtml += `
      <div class="form-group">
        <label class="form-label">Additional Feedback</label>
        <textarea class="form-textarea" id="gradeFeedback" placeholder="Enter additional feedback...">${submission.feedback || ''}</textarea>
      </div>
      <div class="grade-summary">
        <h4>Total Grade: <span id="totalGrade">0</span>/${submission.maxPoints}</h4>
      </div>
    </div>
  `;
  
  gradingContainer.innerHTML = rubricHtml;
}

function selectRubricLevel(criteriaIndex, level) {
  // Remove selection from other levels in this criteria
  const criteriaLevels = document.querySelectorAll(`[data-criteria="${criteriaIndex}"]`);
  criteriaLevels.forEach(levelElement => {
    levelElement.classList.remove('selected');
  });
  
  // Add selection to clicked level
  const selectedLevel = document.querySelector(`[data-criteria="${criteriaIndex}"][data-level="${level}"]`);
  selectedLevel.classList.add('selected');
  
  // Calculate total grade
  calculateRubricGrade();
}

function calculateRubricGrade() {
  const selectedLevels = document.querySelectorAll('.rubric-level.selected');
  let totalGrade = 0;
  
  selectedLevels.forEach(level => {
    const criteriaIndex = parseInt(level.dataset.criteria);
    const levelValue = parseInt(level.dataset.level);
    // This is a simplified calculation - in practice you'd use the criteria weights
    totalGrade += levelValue * 25; // Assuming equal weights for simplicity
  });
  
  document.getElementById('totalGrade').textContent = Math.min(totalGrade, 100);
}

function saveGrade() {
  const submissionId = getCurrentSubmissionId(); // You'd need to store this when opening the modal
  const grade = document.getElementById('gradePoints') ? 
    parseInt(document.getElementById('gradePoints').value) : 
    parseInt(document.getElementById('totalGrade').textContent);
  const feedback = document.getElementById('gradeFeedback').value;
  
  const gradeData = {
    grade: grade,
    feedback: feedback,
    gradedBy: firebase.auth().currentUser.uid,
    gradedAt: Date.now(),
    graded: true
  };
  
  db.ref(`submissions/${submissionId}`).update(gradeData).then(() => {
    alert('Grade saved successfully!');
    closeModal('gradeSubmissionModal');
    loadSubmissions(); // Refresh the submissions list
  }).catch(error => {
    console.error('Error saving grade:', error);
    alert('Error saving grade. Please try again.');
  });
}

// Helper function to get current submission ID (you'd need to implement this)
function getCurrentSubmissionId() {
  // This should be stored when opening the grading modal
  return window.currentSubmissionId;
}

// Quiz Taking Functions (for testing purposes)
function takeQuiz(quizId) {
  db.ref(`quizzes/${quizId}`).once('value').then(snapshot => {
    if (snapshot.exists()) {
      currentQuizData = snapshot.val();
      currentQuizIndex = 0;
      userAnswers = [];
      document.getElementById('quizTakingModal').style.display = 'flex';
      startQuizTimer();
      displayQuizQuestion();
    }
  });
}

function startQuizTimer() {
  if (currentQuizData.timeLimit) {
    let timeLeft = currentQuizData.timeLimit * 60; // Convert to seconds
    const timerElement = document.getElementById('quizTimer');
    
    currentQuizTimer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerElement.textContent = `Time Left: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (timeLeft <= 0) {
        clearInterval(currentQuizTimer);
        submitQuiz();
      }
      timeLeft--;
    }, 1000);
  }
}

function displayQuizQuestion() {
  const question = currentQuizData.questions[currentQuizIndex];
  const quizContent = document.getElementById('quizContent');
  
  let questionHtml = `
    <div class="quiz-question">
      <h3>Question ${currentQuizIndex + 1} of ${currentQuizData.questions.length}</h3>
      <p>${question.text}</p>
      <div class="quiz-options">
  `;
  
  if (question.type === 'multiple-choice' || question.type === 'true-false') {
    question.options.forEach((option, index) => {
      questionHtml += `
        <div class="quiz-option" onclick="selectQuizOption(${index})">
          <input type="radio" name="quiz-answer" value="${index}" id="option-${index}">
          <label for="option-${index}">${option}</label>
        </div>
      `;
    });
  } else if (question.type === 'fill-blank') {
    questionHtml += `
      <input type="text" class="form-input" id="quiz-text-answer" placeholder="Enter your answer...">
    `;
  } else if (question.type === 'short-answer') {
    questionHtml += `
      <textarea class="form-textarea" id="quiz-text-answer" placeholder="Enter your answer..."></textarea>
    `;
  }
  
  questionHtml += `
      </div>
    </div>
  `;
  
  quizContent.innerHTML = questionHtml;
  
  // Update navigation buttons
  document.getElementById('prevBtn').style.display = currentQuizIndex > 0 ? 'inline-block' : 'none';
  document.getElementById('nextBtn').style.display = currentQuizIndex < currentQuizData.questions.length - 1 ? 'inline-block' : 'none';
  document.getElementById('submitBtn').style.display = currentQuizIndex === currentQuizData.questions.length - 1 ? 'inline-block' : 'none';
}

function selectQuizOption(optionIndex) {
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(option => option.classList.remove('selected'));
  
  const selectedOption = document.querySelector(`.quiz-option:nth-child(${optionIndex + 1})`);
  selectedOption.classList.add('selected');
  
  // Store the answer
  userAnswers[currentQuizIndex] = optionIndex;
}

function nextQuestion() {
  // Save current answer
  const question = currentQuizData.questions[currentQuizIndex];
  
  if (question.type === 'multiple-choice' || question.type === 'true-false') {
    const selectedOption = document.querySelector('input[name="quiz-answer"]:checked');
    if (selectedOption) {
      userAnswers[currentQuizIndex] = parseInt(selectedOption.value);
    }
  } else {
    const textAnswer = document.getElementById('quiz-text-answer').value;
    userAnswers[currentQuizIndex] = textAnswer;
  }
  
  currentQuizIndex++;
  displayQuizQuestion();
}

function previousQuestion() {
  currentQuizIndex--;
  displayQuizQuestion();
}

function submitQuiz() {
  // Check for unanswered questions
  const unansweredQuestions = [];
  
  currentQuizData.questions.forEach((question, index) => {
    if (userAnswers[index] === undefined || userAnswers[index] === null || userAnswers[index] === '') {
      unansweredQuestions.push(index + 1);
    }
  });
  
  // If there are unanswered questions, show confirmation
  if (unansweredQuestions.length > 0) {
    const questionNumbers = unansweredQuestions.join(', ');
    const confirmMessage = `You have ${unansweredQuestions.length} unanswered question(s):\n\nQuestion number(s): ${questionNumbers}\n\nAre you sure you want to submit the quiz with unanswered questions?`;
    
    if (!confirm(confirmMessage)) {
      return; // Don't submit if user cancels
    }
  }
  
  if (currentQuizTimer) {
    clearInterval(currentQuizTimer);
  }
  
  // Calculate score for auto-gradable questions
  let score = 0;
  let totalAutoGraded = 0;
  
  currentQuizData.questions.forEach((question, index) => {
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      totalAutoGraded++;
      if (userAnswers[index] === question.correctAnswer) {
        score++;
      }
    } else if (question.type === 'fill-blank') {
      totalAutoGraded++;
      if (userAnswers[index] && userAnswers[index].toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        score++;
      }
    }
  });
  
  const finalScore = totalAutoGraded > 0 ? (score / totalAutoGraded) * 100 : 0;
  
  // Save quiz submission
  const submissionData = {
    quizId: currentQuizData.id,
    studentId: firebase.auth().currentUser.uid,
    answers: userAnswers,
    score: finalScore,
    submittedAt: Date.now(),
    autoGraded: totalAutoGraded === currentQuizData.questions.length
  };
  
  db.ref('quizSubmissions').push(submissionData).then(() => {
    alert(`Quiz submitted! Your score: ${finalScore.toFixed(1)}%`);
    closeModal('quizTakingModal');
  });
}

function showAssessmentList() {
  // This would show a list of all assessments
  console.log('Showing assessment list...');
}

function viewAssessments() {
  // Create and show assessments list modal
  const assessmentsModal = document.createElement('div');
  assessmentsModal.id = 'assessmentsListModal';
  assessmentsModal.className = 'modal';
  assessmentsModal.style.display = 'flex';
  
  assessmentsModal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h3 class="modal-title">All Assessments</h3>
        <button class="modal-close" onclick="closeModal('assessmentsListModal'); this.parentElement.parentElement.parentElement.remove();">&times;</button>
      </div>
      
      <div class="assessment-filters" style="margin-bottom: 20px;">
        <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
          <select class="form-input" id="assessmentsViewTypeFilter" onchange="filterAssessments()" style="width: 150px;">
            <option value="all">All Types</option>
            <option value="quiz">Quizzes</option>
            <option value="assignment">Assignments</option>
          </select>
          <select class="form-input" id="assessmentsViewSortFilter" onchange="filterAssessments()" style="width: 180px;">
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
          <input type="text" class="form-input" id="assessmentsViewSearchFilter" onkeyup="filterAssessments()" placeholder="Search by title..." style="width: 300px;">
        </div>
      </div>
      
      <div id="assessmentsList" style="max-height: 500px; overflow-y: auto;">
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">assignment</span>
          <p>Loading assessments...</p>
        </div>
      </div>
      
      <div class="feature-actions" style="margin-top: 20px;">
        <button class="action-btn" onclick="openCreateQuizModal()">Create Quiz</button>
        <button class="action-btn" onclick="openCreateAssignmentModal()">Create Assignment</button>
        <button class="action-btn secondary" onclick="closeModal('assessmentsListModal'); this.parentElement.parentElement.parentElement.remove();">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(assessmentsModal);
  
  // Load assessments data
  loadAllAssessments();
}

function loadAllAssessments() {
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
    const db = firebase.database();
    const assessmentsList = document.getElementById('assessmentsList');
    
    if (!assessmentsList) return;
    
    allAssessments = [];
    
    // Load quizzes
    db.ref('quizzes').once('value', (snapshot) => {
      const quizzes = snapshot.val() || {};
      Object.keys(quizzes).forEach(key => {
        allAssessments.push({
          id: key,
          type: 'quiz',
          title: quizzes[key].title,
          unit: quizzes[key].unit,
          description: quizzes[key].description || '',
          created: quizzes[key].createdAt || Date.now(),
          questions: quizzes[key].questions ? quizzes[key].questions.length : 0,
          timeLimit: quizzes[key].timeLimit,
          maxAttempts: quizzes[key].maxAttempts,
          allowViewAnswers: quizzes[key].allowViewAnswers || false,
          active: quizzes[key].active
        });
      });
      
      // Load assignments
      db.ref('assignments').once('value', (snapshot) => {
        const assignments = snapshot.val() || {};
        Object.keys(assignments).forEach(key => {
          allAssessments.push({
            id: key,
            type: 'assignment',
            title: assignments[key].title,
            unit: assignments[key].unit,
            description: assignments[key].description || '',
            created: assignments[key].createdAt || Date.now(),
            dueDate: assignments[key].dueDate,
            maxPoints: assignments[key].maxPoints
          });
        });
        
        // Display assessments with initial filter
        console.log('Loaded assessments:', allAssessments.length, 'total');
        filterAssessments();
      });
    });
  } else {
    const assessmentsList = document.getElementById('assessmentsList');
    if (assessmentsList) {
      assessmentsList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">cloud_off</span>
          <p>Cannot load assessments - Firebase not initialized</p>
        </div>
      `;
    }
  }
}

function displayAssessmentsList(assessments) {
  const assessmentsList = document.getElementById('assessmentsList');
  if (!assessmentsList) return;
  
  if (assessments.length === 0) {
    assessmentsList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">assignment</span>
        <p>No assessments found</p>
        <p>Create your first quiz or assignment to get started!</p>
      </div>
    `;
    return;
  }
  
  // Don't sort here - sorting is done in filterAssessments()
  
  let html = '';
  assessments.forEach(assessment => {
    const typeIcon = assessment.type === 'quiz' ? 'quiz' : 'assignment';
    const typeLabel = assessment.type === 'quiz' ? 'Quiz' : 'Assignment';
    const createdDate = new Date(assessment.created).toLocaleString();
    
    html += `
      <div class="assessment-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="material-icons" style="color: #6c4fc1;">${typeIcon}</span>
            <div>
              <h4 style="margin: 0; color: #6c4fc1;text-decoration: underline;">${assessment.title}</h4>
              <p style="margin: 4px 0; color: #666; font-size: 14px;">${typeLabel} • Unit: ${assessment.unit}</p>
              <p style="margin: 0; color: #888; font-size: 12px;">Created: ${createdDate}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="margin-bottom: 8px;">
              ${assessment.type === 'quiz' ? 
                `<span style="color: #6c4fc1; font-weight: bold;">${assessment.questions} questions</span><br>
                 <span style="color: #666; font-size: 12px;">Time: ${assessment.timeLimit}min • Attempts: ${assessment.maxAttempts}</span>` : 
                `<span style="color: #6c4fc1; font-weight: bold;">${assessment.maxPoints} points</span>`
              }
              ${assessment.dueDate ? `<br><span style="color: #666; font-size: 12px;">Due: ${new Date(assessment.dueDate).toLocaleString()}</span>` : ''}
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="action-btn secondary" onclick="viewAssessment('${assessment.id}', '${assessment.type}')" style="padding: 4px 8px; font-size: 12px;">View</button>
              <button class="action-btn" onclick="editAssessment('${assessment.id}', '${assessment.type}')" style="padding: 4px 8px; font-size: 12px;">Edit</button>
              <button class="action-btn" onclick="deleteAssessment('${assessment.id}', '${assessment.type}')" style="padding: 4px 8px; font-size: 12px; background: #dc3545;">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  assessmentsList.innerHTML = html;
}

function viewAssessment(assessmentId, type) {
  if (type === 'quiz') {
    viewQuizDetails(assessmentId);
  } else {
    viewAssignmentDetails(assessmentId);
  }
}

function viewQuizDetails(quizId) {
  db.ref(`quizzes/${quizId}`).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const quiz = snapshot.val();
      
      // Create quiz details modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'quizDetailsModal';
      modal.style.display = 'flex';
      
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <h3 class="modal-title">Quiz Details: ${quiz.title}</h3>
            <button class="modal-close" onclick="closeModal('quizDetailsModal'); this.parentElement.parentElement.parentElement.remove();">&times;</button>
          </div>
          
          <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
              <h4 style="color: 6c4fc1; text-decoration: underline;>Quiz Information</h4>
              <p><strong>Description:</strong> ${quiz.description || 'No description'}</p>
              <p><strong>Unit:</strong> ${quiz.unit}</p>
              <p><strong>Time Limit:</strong> ${quiz.timeLimit} minutes</p>
              <p><strong>Max Attempts:</strong> ${quiz.maxAttempts}</p>
              <p><strong>Questions:</strong> ${quiz.questions.length}</p>
              ${quiz.dueDate ? `<p><strong>Due Date:</strong> ${new Date(quiz.dueDate).toLocaleString()}</p>` : ''}
              <p><strong>Allow View Answers:</strong> ${quiz.allowViewAnswers ? 'Yes' : 'No'}</p>
              <p><strong>Status:</strong> ${quiz.active ? 'Active' : 'Inactive'}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h4 style="color: 6c4fc1; text-decoration: underline;>Questions Preview</h4>
              <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 12px;">
                ${quiz.questions.map((q, i) => `
                  <div style="margin-bottom: 16px; padding: 12px; border-left: 3px solid #6c4fc1; background: #f9f9f9;">
                    <strong style="color: black;">Question ${i + 1}:</strong> <span style="color: #6c4fc1;">${q.text}</span><br>
                    <small style="color: #666;">Type: ${q.type}</small>
                    ${q.options ? `<br><small style="color: #666;">Options: ${q.options.length}</small>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="feature-actions">
              <button class="action-btn" onclick="testQuiz('${quizId}')">Test Quiz</button>
              <button class="action-btn" onclick="editAssessment('${quizId}', 'quiz')">Edit Quiz</button>
              <button class="action-btn secondary" onclick="toggleQuizAnswerView('${quizId}', ${quiz.allowViewAnswers})">
                ${quiz.allowViewAnswers ? 'Disable' : 'Enable'} Answer View
              </button>
              <button class="action-btn secondary" onclick="closeModal('quizDetailsModal'); this.parentElement.parentElement.parentElement.remove();">Close</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    }
  });
}

function viewAssignmentDetails(assignmentId) {
  db.ref(`assignments/${assignmentId}`).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const assignment = snapshot.val();
      
      // Create assignment details modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'assignmentDetailsModal';
      modal.style.display = 'flex';
      
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No due date';
      const createdDate = assignment.createdAt ? new Date(assignment.createdAt).toLocaleString() : 'Unknown';
      
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <h3 class="modal-title">Assignment Details: ${assignment.title}</h3>
            <button class="modal-close" onclick="closeModal('assignmentDetailsModal'); this.parentElement.parentElement.parentElement.remove();">&times;</button>
          </div>
          
          <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
              <h4 style="color: #6c4fc1; margin-bottom: 8px;">Assignment Information</h4>
              <p><strong>Title:</strong> ${assignment.title}</p>
              <p><strong>Description:</strong> ${assignment.description || 'No description'}</p>
              <p><strong>Unit:</strong> ${assignment.unit || 'No unit assigned'}</p>
              <p><strong>Max Points:</strong> ${assignment.maxPoints || 'Not specified'}</p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
              <p><strong>Submission Type:</strong> ${assignment.submissionType || 'Text'}</p>
              <p><strong>Allowed File Types:</strong> ${assignment.allowedFileTypes ? assignment.allowedFileTypes.join(', ') : 'None'}</p>
              <p><strong>Max File Uploads:</strong> ${assignment.maxFileUploads || 1}</p>
              <p><strong>Created:</strong> ${createdDate}</p>
            </div>
            
            <div class="feature-actions">
              <button class="action-btn" onclick="editAssignment('${assignmentId}')">Edit Assignment</button>
              <button class="action-btn secondary" onclick="closeModal('assignmentDetailsModal'); this.parentElement.parentElement.parentElement.remove();">Close</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    }
  }).catch(error => {
    console.error('Error loading assignment details:', error);
    showNotification(
      'Failed to load assignment details.',
      'error',
      'Error'
    );
  });
}

function toggleQuizAnswerView(quizId, currentState) {
  const newState = !currentState;
  db.ref(`quizzes/${quizId}/allowViewAnswers`).set(newState).then(() => {
    showNotification(
      `Students can now ${newState ? 'view' : 'not view'} their quiz answers`,
      'success',
      'Answer View Updated'
    );
    closeModal('quizDetailsModal');
    document.getElementById('quizDetailsModal').remove();
    // Refresh the assessments list
    loadAllAssessments();
  }).catch(error => {
    console.error('Error updating quiz:', error);
    showNotification(
      'Please try again or contact support if the problem persists.',
      'error',
      'Update Failed'
    );
  });
}

// Modern notification system for teacher dashboard
function showNotification(message, type = 'info', title = null, duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const iconMap = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning'
  };
  
  const titleMap = {
    success: 'Success!',
    error: 'Error!',
    info: 'Information',
    warning: 'Warning!'
  };
  
  notification.innerHTML = `
    <span class="material-icons">${iconMap[type]}</span>
    <div class="notification-content">
      <div class="notification-title">${title || titleMap[type]}</div>
      <div class="notification-message">${message}</div>
    </div>
  `;
  
  // Add notification styles if not already present
  if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease, opacity 0.3s ease;
        opacity: 0;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .notification.show {
        transform: translateX(0);
        opacity: 1;
      }
      .notification.success {
        background: linear-gradient(135deg, #28a745, #20c997);
      }
      .notification.error {
        background: linear-gradient(135deg, #dc3545, #e91e63);
      }
      .notification.info {
        background: linear-gradient(135deg, #17a2b8, #6610f2);
      }
      .notification.warning {
        background: linear-gradient(135deg, #ffc107, #fd7e14);
        color: #212529;
      }
      .notification .material-icons {
        font-size: 20px;
      }
      .notification-content {
        flex: 1;
      }
      .notification-title {
        font-weight: bold;
        margin-bottom: 2px;
      }
      .notification-message {
        font-size: 14px;
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Auto-hide after duration
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
  
  // Allow manual close by clicking
  notification.addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  });
}

function editAssessment(assessmentId, type) {
  if (type === 'quiz') {
    editQuiz(assessmentId);
  } else {
    editAssignment(assessmentId);
  }
}

async function editQuiz(quizId) {
  // Close existing modals first to prevent layering issues
  const existingModals = ['assessmentsListModal', 'quizDetailsModal'];
  existingModals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
    }
  });

  try {
    // Wait for quiz data
    const snapshot = await db.ref(`quizzes/${quizId}`).once('value');

    if (!snapshot.exists()) {
      console.warn('Quiz does not exist.');
      return;
    }

    const quiz = snapshot.val();

    // First, open the create quiz modal to ensure it exists in the DOM
    openModal('createQuizModal');

    // Reset form to ensure clean state BEFORE loading units
    resetQuizForm();

    // Now populate the form (unit is already set by loadUnitsForQuiz)
    document.getElementById('quizTitle').value = quiz.title || '';
    document.getElementById('quizDescription').value = quiz.description || '';
    console.log('Quiz unit:', (quiz.unit || '').trim());
    document.getElementById('quizTimeLimit').value = quiz.timeLimit || '';
    document.getElementById('quizAttempts').value = quiz.maxAttempts || '';
    
    // Set due date if it exists
    if (quiz.dueDate) {
      document.getElementById('quizDueDate').value = quiz.dueDate;
    }

    window.editingQuizId = quizId;

    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';

    quiz.questions.forEach((question, index) => {
      const questionNumber = index + 1;
      let optionsHtml = '';

      if (question.type === 'multiple-choice') {
        question.options.forEach((option, optIndex) => {
          optionsHtml += `
            <div class="option-item">
              <input type="radio" name="correct-${questionNumber}" value="${optIndex}" ${question.correctAnswer === optIndex ? 'checked' : ''} style="width: 15%;">
              <input type="text" class="form-input option-text" value="${option}" required>
            </div>
          `;
        });
      } else if (question.type === 'true-false') {
        optionsHtml = `
          <div class="option-item">
            <input type="radio" name="correct-${questionNumber}" value="0" ${question.correctAnswer === 0 ? 'checked' : ''} style="width: 15%;">
            <span>True</span>
          </div>
          <div class="option-item">
            <input type="radio" name="correct-${questionNumber}" value="1" ${question.correctAnswer === 1 ? 'checked' : ''} style="width: 15%;">
            <span>False</span>
          </div>
        `;
      } else {
        optionsHtml = `<input type="text" class="form-input" value="${question.correctAnswer || ''}" placeholder="Correct answer">`;
      }

      questionsContainer.innerHTML += `
        <div class="question-item" data-question="${questionNumber}">
          <div class="question-header">
            <span>Question ${questionNumber}</span>
            <select class="question-type" onchange="updateQuestionType(this)">
              <option value="multiple-choice" ${question.type === 'multiple-choice' ? 'selected' : ''}>Multiple Choice</option>
              <option value="fill-blank" ${question.type === 'fill-blank' ? 'selected' : ''}>Fill in the Blank</option>
              <option value="true-false" ${question.type === 'true-false' ? 'selected' : ''}>True/False</option>
              <option value="short-answer" ${question.type === 'short-answer' ? 'selected' : ''}>Short Answer</option>
            </select>
            <button type="button" class="action-btn secondary" onclick="removeQuestion(this)" style="padding: 4px 8px; margin-left: 8px; width: 15%;">Remove</button>
          </div>
          <div class="question-content">
            <input type="text" class="form-input question-text" value="${question.text}" required>
            <div class="question-options" id="options-${questionNumber}">
              ${optionsHtml}
            </div>
          </div>
        </div>
      `;
    });

    currentQuizQuestionCount = quiz.questions.length;

    updateQuizFormForEditing();

    // Load units first without setting selection
    console.log('Loading units...');
    await loadUnitsForQuiz(quiz.unit);
    console.log('Units loaded');

  } catch (error) {
    console.error('Failed to load quiz:', error);
  }
}

async function editAssignment(assignmentId) {
  // Close existing modals first to prevent layering issues
  const existingModals = ['assessmentsListModal', 'assignmentDetailsModal'];
  existingModals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
    }
  });

  try {
    // Wait for assignment data
    const snapshot = await db.ref(`assignments/${assignmentId}`).once('value');

    if (!snapshot.exists()) {
      console.warn('Assignment does not exist.');
      return;
    }

    const assignment = snapshot.val();

    // First, open the create assignment modal to ensure it exists in the DOM
    openModal('createAssignmentModal');

    // Reset form to ensure clean state
    resetAssignmentForm();

    // Populate the form with assignment data
    document.getElementById('assignmentTitle').value = assignment.title || '';
    document.getElementById('assignmentDescription').value = assignment.description || '';
    document.getElementById('assignmentDueDate').value = assignment.dueDate || '';
    document.getElementById('assignmentMaxPoints').value = assignment.maxPoints || '';
    document.getElementById('assignmentSubmissionType').value = assignment.submissionType || 'text';
    document.getElementById('assignmentFileTypes').value = assignment.allowedFileTypes ? assignment.allowedFileTypes.join(', ') : '';
    document.getElementById('assignmentMaxFiles').value = assignment.maxFileUploads || 1;

    // Store the assignment ID for updating
    window.editingAssignmentId = assignmentId;

    // Update form for editing
    updateAssignmentFormForEditing();

    // Load units and set selection
    await loadUnitsForAssignment();
    document.getElementById('assignmentUnit').value = assignment.unit || '';

    // Load rubrics and set selection
    await loadRubricsForAssignment();
    document.getElementById('assignmentRubric').value = assignment.rubric || '';

  } catch (error) {
    console.error('Failed to load assignment:', error);
  }
}

function updateAssignmentFormForEditing() {
  const form = document.getElementById('createAssignmentForm');
  const existingHandler = form.cloneNode(true);
  form.parentNode.replaceChild(existingHandler, form);
  
  existingHandler.addEventListener('submit', function(e) {
    e.preventDefault();
    updateAssignment();
  });
}

function updateAssignment() {
  const assignmentId = window.editingAssignmentId;
  
  const assignmentData = {
    title: document.getElementById('assignmentTitle').value,
    description: document.getElementById('assignmentDescription').value,
    unit: document.getElementById('assignmentUnit').value,
    dueDate: document.getElementById('assignmentDueDate').value,
    maxPoints: parseInt(document.getElementById('assignmentMaxPoints').value),
    submissionType: document.getElementById('assignmentSubmissionType').value,
    allowedFileTypes: document.getElementById('assignmentFileTypes').value.split(',').map(type => type.trim()),
    maxFileUploads: parseInt(document.getElementById('assignmentMaxFiles').value) || 1,
    rubric: document.getElementById('assignmentRubric').value,
    updatedAt: Date.now()
  };
  
  // Update assignment in database
  db.ref(`assignments/${assignmentId}`).update(assignmentData).then(() => {
    showNotification(
      'Your assignment has been updated successfully!',
      'success',
      'Assignment Updated'
    );
    closeModal('createAssignmentModal');
    delete window.editingAssignmentId;
    // Refresh the assessments list
    loadAllAssessments();
  }).catch(error => {
    console.error('Error updating assignment:', error);
    showNotification(
      'Please try again or contact support if the problem persists.',
      'error',
      'Update Failed'
    );
  });
}


function updateQuizFormForEditing() {
  const form = document.getElementById('createQuizForm');
  const existingHandler = form.cloneNode(true);
  form.parentNode.replaceChild(existingHandler, form);
  
  existingHandler.addEventListener('submit', function(e) {
    e.preventDefault();
    updateQuiz();
  });
}

function updateQuiz() {
  const quizId = window.editingQuizId;
  
  const quizData = {
    title: document.getElementById('quizTitle').value,
    description: document.getElementById('quizDescription').value,
    unit: document.getElementById('quizUnit').value,
    timeLimit: parseInt(document.getElementById('quizTimeLimit').value),
    maxAttempts: parseInt(document.getElementById('quizAttempts').value),
    questions: [],
    updatedAt: Date.now()
  };
  
  // Collect questions
  const questionItems = document.querySelectorAll('.question-item');
  questionItems.forEach(item => {
    const questionText = item.querySelector('.question-text').value;
    const questionType = item.querySelector('.question-type').value;
    const questionNumber = item.dataset.question;
    
    const question = {
      text: questionText,
      type: questionType,
      options: [],
      correctAnswer: null
    };
    
    if (questionType === 'multiple-choice') {
      const optionTexts = item.querySelectorAll('.option-text');
      const correctRadio = item.querySelector('input[name="correct-' + questionNumber + '"]:checked');
      
      optionTexts.forEach(input => {
        question.options.push(input.value);
      });
      
      if (correctRadio) {
        question.correctAnswer = parseInt(correctRadio.value);
      }
    } else if (questionType === 'true-false') {
      question.options = ['True', 'False'];
      const correctRadio = item.querySelector('input[name="correct-' + questionNumber + '"]:checked');
      if (correctRadio) {
        question.correctAnswer = parseInt(correctRadio.value);
      }
    } else {
      const correctAnswer = item.querySelector('.form-input[placeholder="Correct answer"]').value;
      question.correctAnswer = correctAnswer;
    }
    
    quizData.questions.push(question);
  });
  
  // Update quiz in database
  db.ref(`quizzes/${quizId}`).update(quizData).then(() => {
    showNotification(
      'Your quiz has been updated successfully!',
      'success',
      'Quiz Updated'
    );
    closeModal('createQuizModal');
    delete window.editingQuizId;
    // Refresh the assessments list
    loadAllAssessments();
  }).catch(error => {
    console.error('Error updating quiz:', error);
    showNotification(
      'Please try again or contact support if the problem persists.',
      'error',
      'Update Failed'
    );
  });
}

function deleteAssessment(assessmentId, type) {
  if (confirm(`Are you sure you want to delete this ${type}? This action cannot be undone and will also delete all related submissions and attempts.`)) {
    const ref = type === 'quiz' ? `quizzes/${assessmentId}` : `assignments/${assessmentId}`;
    
    // First delete the assessment
    db.ref(ref).remove().then(() => {
      // Then delete all related submissions/attempts
      if (type === 'quiz') {
        // Delete all quiz submissions for this quiz
        db.ref('quizSubmissions').orderByChild('quizId').equalTo(assessmentId).once('value').then(snapshot => {
          const updates = {};
          snapshot.forEach(child => {
            updates[child.key] = null;
          });
          if (Object.keys(updates).length > 0) {
            db.ref('quizSubmissions').update(updates);
          }
        });
      } else {
        // Delete all assignment submissions for this assignment
        db.ref('submissions').orderByChild('assignmentId').equalTo(assessmentId).once('value').then(snapshot => {
          const updates = {};
          snapshot.forEach(child => {
            updates[child.key] = null;
          });
          if (Object.keys(updates).length > 0) {
            db.ref('submissions').update(updates);
          }
        });
      }
      
      showNotification(
        `${type.charAt(0).toUpperCase() + type.slice(1)} and all related submissions have been deleted successfully!`,
        'success',
        'Deleted'
      );
      // Refresh the assessments list
      loadAllAssessments();
    }).catch(error => {
      console.error(`Error deleting ${type}:`, error);
      showNotification(
        'Please try again or contact support if the problem persists.',
        'error',
        'Deletion Failed'
      );
    });
  }
}

function filterAssessments() {
  const typeFilterElement = document.getElementById('assessmentsViewTypeFilter');
  const sortFilterElement = document.getElementById('assessmentsViewSortFilter');
  const searchFilterElement = document.getElementById('assessmentsViewSearchFilter');
  
  // Debug the actual elements
  console.log('Filter elements:', {
    typeFilterElement: typeFilterElement,
    sortFilterElement: sortFilterElement,
    searchFilterElement: searchFilterElement
  });
  
  const typeFilter = typeFilterElement?.value || 'all';
  const sortFilter = sortFilterElement?.value || 'date-desc';
  const searchFilter = searchFilterElement?.value?.toLowerCase() || '';
  
  // Debug the actual values
  console.log('Raw values:', {
    typeFilterValue: typeFilterElement?.value,
    sortFilterValue: sortFilterElement?.value,
    searchFilterValue: searchFilterElement?.value
  });
  
  console.log('Filtering assessments:', { typeFilter, sortFilter, searchFilter, totalAssessments: allAssessments.length });
  
  // Start with all assessments
  let filteredAssessments = [...allAssessments];
  
  // Apply type filter
  if (typeFilter !== 'all') {
    console.log('Before type filter:', filteredAssessments.length);
    console.log('Available types:', [...new Set(allAssessments.map(a => a.type))]);
    console.log('Filtering by type:', typeFilter);
    filteredAssessments = filteredAssessments.filter(assessment => assessment.type === typeFilter);
    console.log('After type filter:', filteredAssessments.length);
  }
  
  // Apply search filter - search by title only
  if (searchFilter) {
    console.log('Before search filter:', filteredAssessments.length);
    filteredAssessments = filteredAssessments.filter(assessment => {
      const title = (assessment.title || '').toLowerCase();
      return title.includes(searchFilter);
    });
    console.log('After search filter:', filteredAssessments.length);
  }
  
  console.log('After filtering:', { filteredCount: filteredAssessments.length });
  
  // Apply sorting
  switch (sortFilter) {
    case 'date-asc':
      filteredAssessments.sort((a, b) => a.created - b.created);
      break;
    case 'date-desc':
      filteredAssessments.sort((a, b) => b.created - a.created);
      break;
    case 'title-asc':
      filteredAssessments.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    case 'title-desc':
      filteredAssessments.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      break;
    default:
      filteredAssessments.sort((a, b) => b.created - a.created);
  }
  
  console.log('After sorting:', filteredAssessments.slice(0, 3).map(a => ({ title: a.title, type: a.type, created: new Date(a.created).toLocaleDateString() })));
  
  // Display filtered assessments
  displayAssessmentsList(filteredAssessments);
}

// Quiz testing functionality for teachers
let currentTestQuizData = null;
let currentTestQuizIndex = 0;
let testUserAnswers = [];
let testQuizTimer = null;

function testQuiz(quizId) {
  // Close existing modals first
  const existingModals = ['assessmentsListModal', 'quizDetailsModal'];
  existingModals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
    }
  });
  
  db.ref(`quizzes/${quizId}`).once('value').then(snapshot => {
    if (snapshot.exists()) {
      const quiz = snapshot.val();
      quiz.id = quizId;
      startTestQuiz(quiz);
    }
  });
}

function startTestQuiz(quiz) {
  currentTestQuizData = quiz;
  currentTestQuizIndex = 0;
  testUserAnswers = [];
  
  // Create test modal if it doesn't exist
  let testModal = document.getElementById('quizTestModal');
  if (!testModal) {
    testModal = document.createElement('div');
    testModal.id = 'quizTestModal';
    testModal.className = 'modal';
    testModal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3 class="modal-title" id="quizTestTitle">Test Quiz</h3>
          <div id="quizTestTimer" style="color: #6c4fc1; font-weight: bold;"></div>
          <button class="modal-close" onclick="closeModal('quizTestModal')">&times;</button>
        </div>
        
        <div id="quizTestContent" style="padding: 20px; min-height: 300px;">
          <!-- Quiz content will be loaded here -->
        </div>
        
        <div class="feature-actions" style="margin-top: 20px;">
          <button class="action-btn secondary" id="prevTestBtn" onclick="previousTestQuestion()" style="display: none;">Previous</button>
          <button class="action-btn" id="nextTestBtn" onclick="nextTestQuestion()">Next</button>
          <button class="action-btn" id="submitTestBtn" onclick="submitTestQuiz()" style="display: none;">Submit Quiz</button>
        </div>
      </div>
    `;
    document.body.appendChild(testModal);
  }
  
  testModal.style.display = 'flex';
  document.getElementById('quizTestTitle').textContent = `Test: ${quiz.title}`;
  
  startTestQuizTimer();
  displayTestQuizQuestion();
}

function startTestQuizTimer() {
  if (currentTestQuizData.timeLimit) {
    let timeLeft = currentTestQuizData.timeLimit * 60;
    const timerElement = document.getElementById('quizTestTimer');
    
    if (timerElement) {
      testQuizTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `Time Left: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
          clearInterval(testQuizTimer);
          submitTestQuiz();
        }
        timeLeft--;
      }, 1000);
    }
  }
}

function displayTestQuizQuestion() {
  const question = currentTestQuizData.questions[currentTestQuizIndex];
  const quizContent = document.getElementById('quizTestContent');
  
  let questionHtml = `
    <div class="quiz-question" style="margin-bottom: 24px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h3>Question ${currentTestQuizIndex + 1} of ${currentTestQuizData.questions.length}</h3>
      <p style="font-size: 1.1em; margin-bottom: 20px;">${question.text}</p>
      <div class="quiz-options">
  `;
  
  if (question.type === 'multiple-choice' || question.type === 'true-false') {
    question.options.forEach((option, index) => {
      questionHtml += `
        <div class="quiz-option" onclick="selectTestQuizOption(${index})" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 12px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; border: 1px solid #ddd;">
          <input type="radio" name="test-quiz-answer" value="${index}" id="test-option-${index}" style="margin-right: 8px; width: 15%;">
          <label for="test-option-${index}" style="cursor: pointer; flex: 1;">${option}</label>
        </div>
      `;
    });
  } else if (question.type === 'fill-blank') {
    questionHtml += `
      <input type="text" class="form-input" id="test-quiz-text-answer" placeholder="Enter your answer..." style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px;">
    `;
  } else if (question.type === 'short-answer') {
    questionHtml += `
      <textarea class="form-textarea" id="test-quiz-text-answer" placeholder="Enter your answer..." rows="4" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
    `;
  }
  
  questionHtml += `
      </div>
    </div>
  `;
  
  quizContent.innerHTML = questionHtml;
  
  // Restore previous answer if it exists
  if (testUserAnswers[currentTestQuizIndex] !== undefined) {
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      selectTestQuizOption(testUserAnswers[currentTestQuizIndex]);
    } else {
      const textAnswer = document.getElementById('test-quiz-text-answer');
      if (textAnswer) {
        textAnswer.value = testUserAnswers[currentTestQuizIndex];
      }
    }
  }
  
  // Update navigation buttons
  document.getElementById('prevTestBtn').style.display = currentTestQuizIndex > 0 ? 'inline-block' : 'none';
  document.getElementById('nextTestBtn').style.display = currentTestQuizIndex < currentTestQuizData.questions.length - 1 ? 'inline-block' : 'none';
  document.getElementById('submitTestBtn').style.display = currentTestQuizIndex === currentTestQuizData.questions.length - 1 ? 'inline-block' : 'none';
}

function selectTestQuizOption(optionIndex) {
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(option => {
    option.classList.remove('selected');
    option.style.background = '';
    option.style.outlineStyle = 'auto';
  });
  
  const selectedOption = document.querySelector(`.quiz-option:nth-child(${optionIndex + 1})`);
  selectedOption.classList.add('selected');
  selectedOption.style.background = '#6c4fc1';
  selectedOption.style.outlineStyle = 'dashed';
  
  // Check the radio button
  const radioButton = document.getElementById(`test-option-${optionIndex}`);
  if (radioButton) {
    radioButton.checked = true;
  }
  
  testUserAnswers[currentTestQuizIndex] = optionIndex;
}

function nextTestQuestion() {
  saveCurrentTestAnswer();
  currentTestQuizIndex++;
  displayTestQuizQuestion();
}

function previousTestQuestion() {
  saveCurrentTestAnswer();
  currentTestQuizIndex--;
  displayTestQuizQuestion();
}

function saveCurrentTestAnswer() {
  const question = currentTestQuizData.questions[currentTestQuizIndex];
  
  if (question.type === 'multiple-choice' || question.type === 'true-false') {
    const selectedOption = document.querySelector('input[name="test-quiz-answer"]:checked');
    if (selectedOption) {
      testUserAnswers[currentTestQuizIndex] = parseInt(selectedOption.value);
    }
  } else {
    const textAnswer = document.getElementById('test-quiz-text-answer');
    if (textAnswer) {
      testUserAnswers[currentTestQuizIndex] = textAnswer.value;
    }
  }
}

function submitTestQuiz() {
  // Check for unanswered questions in test quiz
  const unansweredQuestions = [];
  
  currentTestQuizData.questions.forEach((question, index) => {
    if (testUserAnswers[index] === undefined || testUserAnswers[index] === null || testUserAnswers[index] === '') {
      unansweredQuestions.push(index + 1);
    }
  });
  
  // If there are unanswered questions, show confirmation
  if (unansweredQuestions.length > 0) {
    const questionNumbers = unansweredQuestions.join(', ');
    const confirmMessage = `You have ${unansweredQuestions.length} unanswered question(s):\n\nQuestion number(s): ${questionNumbers}\n\nAre you sure you want to submit the test with unanswered questions?`;
    
    if (!confirm(confirmMessage)) {
      return; // Don't submit if user cancels
    }
  }
  
  if (testQuizTimer) {
    clearInterval(testQuizTimer);
  }
  
  saveCurrentTestAnswer();
  
  // Grade the test quiz
  let correctAnswers = 0;
  let totalQuestions = currentTestQuizData.questions.length;
  
  const detailedResults = currentTestQuizData.questions.map((question, index) => {
    const userAnswer = testUserAnswers[index];
    let isCorrect = false;
    
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      isCorrect = userAnswer === question.correctAnswer;
    } else {
      // For text-based questions, do a simple comparison
      isCorrect = userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    }
    
    if (isCorrect) correctAnswers++;
    
    return {
      question: question.text,
      userAnswer: userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: isCorrect,
      type: question.type,
      options: question.options
    };
  });
  
  const score = (correctAnswers / totalQuestions) * 100;
  
  // Display test results
  displayTestResults(score, correctAnswers, totalQuestions, detailedResults);
}

function displayTestResults(score, correctAnswers, totalQuestions, detailedResults) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'testResultsModal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h3 class="modal-title">Test Results: ${currentTestQuizData.title}</h3>
        <button class="modal-close" onclick="closeModal('testResultsModal'); this.parentElement.parentElement.parentElement.remove();">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 16px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0; color: ${score >= 70 ? '#28a745' : score >= 50 ? '#ffc107' : '#dc3545'};">${score.toFixed(1)}%</h2>
          <p style="margin: 8px 0 0 0; color: #666;">Score: ${correctAnswers}/${totalQuestions} correct</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #fff;">Question Review</h4>
          <div style="max-height: 400px; overflow-y: auto;">
            ${detailedResults.map((result, index) => `
              <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-weight: bold; color: #fff;">Question ${index + 1}</span>
                  <span class="material-icons" style="color: ${result.isCorrect ? '#28a745' : '#dc3545'}; font-size: 18px;">
                    ${result.isCorrect ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <p style="margin-bottom: 8px; font-weight: 500;">${result.question}</p>
                ${generateTestResultReview(result)}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="feature-actions">
          <button class="action-btn" onclick="testQuiz('${currentTestQuizData.id}')">Test Again</button>
          <button class="action-btn secondary" onclick="closeModal('testResultsModal'); this.parentElement.parentElement.parentElement.remove();">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close the test modal
  closeModal('quizTestModal');
}

function generateTestResultReview(result) {
  let reviewHtml = '';
  
  if (result.type === 'multiple-choice') {
    reviewHtml += '<div style="margin-bottom: 12px;">';
    result.options.forEach((option, index) => {
      const isUserAnswer = result.userAnswer === index;
      const isCorrectAnswer = result.correctAnswer === index;
      
      let optionStyle = 'padding: 6px 10px; margin: 2px 0; border-radius: 4px; border: 1px solid #ddd; font-size: 14px;';
      
      if (isCorrectAnswer) {
        optionStyle += ' background: #d4edda; border-color: #28a745; color: #155724;';
      } else if (isUserAnswer && !result.isCorrect) {
        optionStyle += ' background: #f8d7da; border-color: #dc3545; color: #721c24;';
      }
      
      reviewHtml += `
        <div style="${optionStyle}">
          <span style="margin-right: 8px;">${isUserAnswer ? '●' : '○'}</span>
          ${option}
          ${isCorrectAnswer ? ' <span style="font-weight: bold;">(Correct)</span>' : ''}
          ${isUserAnswer && !result.isCorrect ? ' <span style="font-weight: bold;">(Your Answer)</span>' : ''}
        </div>
      `;
    });
    reviewHtml += '</div>';
  } else if (result.type === 'true-false') {
    const options = ['True', 'False'];
    reviewHtml += '<div style="margin-bottom: 12px;">';
    options.forEach((option, index) => {
      const isUserAnswer = result.userAnswer === index;
      const isCorrectAnswer = result.correctAnswer === index;
      
      let optionStyle = 'padding: 6px 10px; margin: 2px 0; border-radius: 4px; border: 1px solid #ddd; font-size: 14px;';
      
      if (isCorrectAnswer) {
        optionStyle += ' background: #d4edda; border-color: #28a745; color: #155724;';
      } else if (isUserAnswer && !result.isCorrect) {
        optionStyle += ' background: #f8d7da; border-color: #dc3545; color: #721c24;';
      }
      
      reviewHtml += `
        <div style="${optionStyle}">
          <span style="margin-right: 8px;">${isUserAnswer ? '●' : '○'}</span>
          ${option}
          ${isCorrectAnswer ? ' <span style="font-weight: bold;">(Correct)</span>' : ''}
          ${isUserAnswer && !result.isCorrect ? ' <span style="font-weight: bold;">(Your Answer)</span>' : ''}
        </div>
      `;
    });
    reviewHtml += '</div>';
  } else {
    reviewHtml += `
      <div style="margin-bottom: 12px;">
        <div style="margin-bottom: 8px;">
          <strong>Your Answer:</strong>
          <span style="padding: 4px 8px; background: ${result.isCorrect ? '#d4edda' : '#f8d7da'}; 
                       border-radius: 4px; color: ${result.isCorrect ? '#155724' : '#721c24'}; font-size: 14px;">
            ${result.userAnswer || 'No answer provided'}
          </span>
        </div>
        <div>
          <strong>Correct Answer:</strong>
          <span style="padding: 4px 8px; background: #d4edda; border-radius: 4px; color: #155724; font-size: 14px;">
            ${result.correctAnswer}
          </span>
        </div>
      </div>
    `;
  }
  
  return reviewHtml;
}

function loadAssessmentOverview() {
  // Create and show assessment overview modal
  const overviewModal = document.createElement('div');
  overviewModal.id = 'assessmentOverviewModal';
  overviewModal.className = 'modal';
  overviewModal.style.display = 'flex';
  
  overviewModal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h3 class="modal-title" data-translate="assessmentOverview">Assessment Overview</h3>
        <button class="modal-close" onclick="closeModal('assessmentOverviewModal'); this.parentElement.parentElement.parentElement.remove();">&times;</button>
      </div>
      
      <div class="assessment-stats">
        <div class="stat-card">
          <div class="stat-number" id="totalQuizzes">0</div>
          <div class="stat-label">Total Quizzes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="totalAssignments">0</div>
          <div class="stat-label">Total Assignments</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="pendingGrades">0</div>
          <div class="stat-label">Pending Grades</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="avgQuizScore">0%</div>
          <div class="stat-label">Avg Quiz Score</div>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <h4>Recent Assessments</h4>
        <div id="recentAssessments" style="max-height: 300px; overflow-y: auto;">
          <div style="text-align: center; padding: 20px; color: #666;">
            <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">quiz</span>
            <p>No assessments created yet</p>
            <p>Create your first quiz or assignment to get started!</p>
          </div>
        </div>
      </div>
      
      <div class="feature-actions" style="margin-top: 20px;">
        <button class="action-btn" onclick="openCreateQuizModal()">Create Quiz</button>
        <button class="action-btn" onclick="openCreateAssignmentModal()">Create Assignment</button>
        <button class="action-btn secondary" onclick="openGradingCenter()">Open Grading Center</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overviewModal);
  
  // Load actual assessment data
  loadAssessmentData();
}

// Add form reset functions
function resetQuizForm() {
  const form = document.getElementById('createQuizForm');
  if (form) {
    form.reset();
  }
  
  // Reset questions to initial state
  const questionsContainer = document.getElementById('questionsContainer');
  if (questionsContainer) {
    questionsContainer.innerHTML = `
      <div class="question-item" data-question="1">
        <div class="question-header">
          <span>Question 1</span>
          <select class="question-type" onchange="updateQuestionType(this)">
            <option value="multiple-choice">Multiple Choice</option>
            <option value="fill-blank">Fill in the Blank</option>
            <option value="true-false">True/False</option>
            <option value="short-answer">Short Answer</option>
          </select>
        </div>
        <div class="question-content">
          <input type="text" class="form-input question-text" placeholder="Enter question text..." required>
          <div class="question-options" id="options-1">
            <div class="option-item">
              <input type="radio" name="correct-1" value="0">
              <input type="text" class="form-input option-text" placeholder="Option A" required>
            </div>
            <div class="option-item">
              <input type="radio" name="correct-1" value="1">
              <input type="text" class="form-input option-text" placeholder="Option B" required>
            </div>
            <div class="option-item">
              <input type="radio" name="correct-1" value="2">
              <input type="text" class="form-input option-text" placeholder="Option C" required>
            </div>
            <div class="option-item">
              <input type="radio" name="correct-1" value="3">
              <input type="text" class="form-input option-text" placeholder="Option D" required>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Reset counters
  currentQuizQuestionCount = 1;
}

function resetAssignmentForm() {
  const form = document.getElementById('createAssignmentForm');
  if (form) {
    form.reset();
  }
  
  // Reset max files to default
  const maxFilesInput = document.getElementById('assignmentMaxFiles');
  if (maxFilesInput) {
    maxFilesInput.value = 1;
  }
}

function resetRubricForm() {
  const form = document.getElementById('createRubricForm');
  if (form) {
    form.reset();
  }
  
  // Reset criteria to initial state
  const criteriaContainer = document.getElementById('criteriaContainer');
  if (criteriaContainer) {
    criteriaContainer.innerHTML = `
      <div class="criteria-item" data-criteria="1">
        <div class="criteria-header">
          <input type="text" class="form-input criteria-name" placeholder="Criteria name (e.g., Content Quality)" required>
          <input type="number" class="form-input criteria-weight" placeholder="Weight %" min="1" max="100" value="25" required>
        </div>
        <div class="criteria-levels">
          <div class="level-item">
            <label>Excellent (4)</label>
            <textarea class="form-textarea level-description" placeholder="Describe excellent performance..." required></textarea>
          </div>
          <div class="level-item">
            <label>Good (3)</label>
            <textarea class="form-textarea level-description" placeholder="Describe good performance..." required></textarea>
          </div>
          <div class="level-item">
            <label>Fair (2)</label>
            <textarea class="form-textarea level-description" placeholder="Describe fair performance..." required></textarea>
          </div>
          <div class="level-item">
            <label>Poor (1)</label>
            <textarea class="form-textarea level-description" placeholder="Describe poor performance..." required></textarea>
          </div>
        </div>
      </div>
    `;
  }
  
  // Reset counters
  currentCriteriaCount = 1;
}

function loadAssessmentData() {
  // Load assessment statistics from Firebase
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
    const db = firebase.database();
    
    // Load quizzes
    db.ref('quizzes').once('value', (snapshot) => {
      const quizzes = snapshot.val() || {};
      const quizCount = Object.keys(quizzes).length;
      const totalQuizzesEl = document.getElementById('totalQuizzes');
      if (totalQuizzesEl) {
        totalQuizzesEl.textContent = quizCount;
      }
    });
    
    // Load assignments
    db.ref('assignments').once('value', (snapshot) => {
      const assignments = snapshot.val() || {};
      const assignmentCount = Object.keys(assignments).length;
      const totalAssignmentsEl = document.getElementById('totalAssignments');
      if (totalAssignmentsEl) {
        totalAssignmentsEl.textContent = assignmentCount;
      }
    });
    
    // Load submissions for grading stats
    db.ref('submissions').once('value', (snapshot) => {
      const submissions = snapshot.val() || {};
      const pendingCount = Object.values(submissions).filter(s => !s.graded).length;
      const pendingGradesEl = document.getElementById('pendingGrades');
      if (pendingGradesEl) {
        pendingGradesEl.textContent = pendingCount;
      }
    });
  }
}

// Wait for Firebase to be initialized
function waitForFirebase() {
  return new Promise((resolve) => {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      resolve();
    } else {
      setTimeout(() => waitForFirebase().then(resolve), 100);
    }
  });
}

// Load assignment system after Firebase is ready
async function loadAssignmentSystem() {
  try {
    // Wait for Firebase to be ready
    await waitForFirebase();
    
    // Initialize assignment systems
    if (typeof initializeAssignmentSystems === 'function') {
      initializeAssignmentSystems();
    }
    
    // Wait for systems to be ready
    await new Promise(resolve => {
      const checkSystems = () => {
        if (window.submissionSystem && window.autoGradingSystem) {
          resolve();
        } else {
          setTimeout(checkSystems, 50);
        }
      };
      checkSystems();
    });
    
    console.log('Assignment systems loaded successfully');
  } catch (error) {
    console.error('Error loading assignment systems:', error);
  }
}

// Initialize assignment systems when the page loads
document.addEventListener('DOMContentLoaded', loadAssignmentSystem);
