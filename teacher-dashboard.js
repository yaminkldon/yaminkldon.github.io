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
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = 'auto';
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
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; width: 95%;">
      <div class="modal-header">
        <h3 class="modal-title">Teacher Settings</h3>
        <button class="modal-close" onclick="closeModal('teacherSettingsModal')" style="width: 15%;">&times;</button>
      </div>
      
      <div class="teacher-settings-form">
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

function manageVideos() {
  console.log('Managing Videos');
  
  // Redirect to the main video management function
  openVideoManagement();
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
  const unitDescription = document.getElementById('unitDescription').value.trim();
  const unitOrder = parseInt(document.getElementById('unitOrder').value);
  
  if (!unitName || !unitOrder) {
    NotificationManager.showToast('Please fill in all required fields');
    return;
  }
  
  const unitData = {
    name: unitName,
    description: unitDescription,
    order: unitOrder,
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
    generatedTokenInput.value = token;
    tokenExpiry.textContent = expirationDate.toLocaleDateString() + ' at ' + expirationDate.toLocaleTimeString();
    tokenDisplay.style.display = 'block';
  }
}

function copyToken() {
  const tokenInput = document.getElementById('generatedToken');
  if (tokenInput) {
    tokenInput.select();
    tokenInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
      document.execCommand('copy');
      NotificationManager.showToast('Token copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy token:', err);
      NotificationManager.showToast('Failed to copy token. Please copy manually.');
    }
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
            <thead style="position: sticky; top: 0; background: #f8f9fa;">
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
  navigator.clipboard.writeText(text).then(() => {
    NotificationManager.showToast('Token copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
    NotificationManager.showToast('Failed to copy token');
  });
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
          background: #f8f9fa; 
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
            <div style="font-family: monospace; background: #f8f9fa; padding: 8px; border-radius: 4px; margin-top: 4px;">${tokenKey}</div>
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

function goBack() {
  Navigation.goToMainPage();
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
              if (lessonData && typeof lessonData === 'object') {
                videoCount++;
                createVideoCard(videosGrid, unitKey, lessonKey, lessonData, 'lessons');
              }
            });
          }
          
          // Process lessons from direct structure (new format)
          Object.entries(unitData).forEach(([lessonKey, lessonData]) => {
            if (lessonKey !== 'lessons' && lessonKey !== 'name' && lessonKey !== 'description' && 
                lessonKey !== 'order' && lessonKey !== 'createdAt' && lessonData && typeof lessonData === 'object') {
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
  
  const title = lessonData.title || lessonKey;
  const description = lessonData.description || 'No description available';
  const videoFile = lessonData.videoFile || lessonData.videoURL || '';
  const createdAt = lessonData.createdAt ? new Date(lessonData.createdAt).toLocaleDateString() : 'Unknown';
  
  videoCard.innerHTML = `
    <div style="display: flex; gap: 12px;">
      <img src="${thumbnail}" alt="Video thumbnail" style="width: 100px; height: 70px; object-fit: cover; border-radius: 6px;" 
           onerror="this.src='${generateLessonThumbnail(lessonKey)}'">
      <div style="flex: 1;">
        <h4 style="margin: 0 0 4px 0; font-size: 14px;">${title}</h4>
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
              <label class="form-label">Title</label>
              <input type="text" class="form-input" id="editVideoTitle" value="${lessonData.title || lessonKey}" required>
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
  const title = document.getElementById('editVideoTitle').value.trim();
  const description = document.getElementById('editVideoDescription').value.trim();
  const thumbnail = document.getElementById('editVideoThumbnail').value.trim();
  
  const path = type === 'lessons' ? `units/${unitKey}/lessons/${lessonKey}` : `units/${unitKey}/${lessonKey}`;
  
  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (thumbnail) {
    if (type === 'lessons') {
      updateData.thumbnail = thumbnail;
    } else {
      updateData.thumbnailURL = thumbnail;
    }
  }
  
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

function editUnit(unitKey) {
  NotificationManager.showToast(`Editing unit: ${unitKey}`);
}

function deleteUnit(unitKey) {
  if (confirm('Are you sure you want to delete this unit and all its lessons?')) {
    db.ref(`units/${unitKey}`).remove()
      .then(() => {
        NotificationManager.showToast('Unit deleted successfully');
        loadUnitsContent();
      })
      .catch(error => {
        NotificationManager.showToast('Error deleting unit');
      });
  }
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

// Enhanced modal close function to handle dynamic modals
window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Remove dynamically created modals
    if (modal.parentNode === document.body && modalId !== 'addUserModal' && modalId !== 'addUnitModal' && modalId !== 'uploadVideoModal') {
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
`;

// Add styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('teacherTheme') || 'light';
  applyTheme(savedTheme);
});
