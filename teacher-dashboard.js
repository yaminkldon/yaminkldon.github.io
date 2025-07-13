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
    
    // Count total lessons
    let lessonCount = 0;
    if (snapshot.exists()) {
      Object.values(snapshot.val()).forEach(unit => {
        if (unit.lessons) {
          lessonCount += Object.keys(unit.lessons).length;
        }
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
        <h3 class="modal-title">Add New Lesson</h3>
        <button class="modal-close" onclick="closeModal('addLessonModal')" style="width: 15%;">&times;</button>
      </div>
      <form id="addLessonForm">
        <div class="form-group">
          <label class="form-label">Lesson Title</label>
          <input type="text" class="form-input" id="lessonTitle" required>
        </div>
        <div class="form-group">
          <label class="form-label">Unit</label>
          <select class="form-input" id="lessonUnit" required>
            <option value="">Select a unit...</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="lessonDescription" placeholder="Enter lesson description..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Video File</label>
          <input type="file" class="form-input" id="lessonVideo" accept="video/*">
        </div>
        <div class="form-group">
          <label class="form-label">Thumbnail (optional)</label>
          <input type="file" class="form-input" id="lessonThumbnail" accept="image/*">
        </div>
        <div class="form-group">
          <label class="form-label">Lesson Order</label>
          <input type="number" class="form-input" id="lessonOrder" min="1" required>
        </div>
        <div class="feature-actions">
          <button type="submit" class="action-btn">Create Lesson</button>
          <button type="button" class="action-btn secondary" onclick="closeModal('addLessonModal')">Cancel</button>
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
            <thead style="background: #f8f9fa; position: sticky; top: 0;">
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
            <option value="content-analytics">Content Analytics</option>
            <option value="usage-statistics">Usage Statistics</option>
            <option value="completion-rates">Completion Rates</option>
            <option value="full-report">Comprehensive Report</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Date Range</label>
          <div style="display: flex; gap: 8px;">
            <input type="date" id="reportStartDate" class="form-input" style="flex: 1;">
            <input type="date" id="reportEndDate" class="form-input" style="flex: 1;">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Format</label>
          <select id="reportFormat" class="form-input">
            <option value="pdf">PDF</option>
            <option value="excel">Excel (XLSX)</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Include</label>
          <div class="checkbox-group">
            <label><input type="checkbox" id="includeCharts" checked> Charts and Graphs</label><br>
            <label><input type="checkbox" id="includeDetails" checked> Detailed Data</label><br>
            <label><input type="checkbox" id="includeSummary" checked> Executive Summary</label>
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
  
  // Set default dates (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
  document.getElementById('reportEndDate').value = endDate.toISOString().split('T')[0];
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
      </div>
      
      <div class="export-options">
        <div class="form-group">
          <label class="form-label">Data to Export</label>
          <div class="checkbox-group">
            <label><input type="checkbox" id="exportUsers" checked> User Data</label><br>
            <label><input type="checkbox" id="exportUnits" checked> Units & Lessons</label><br>
            <label><input type="checkbox" id="exportProgress" checked> User Progress</label><br>
            <label><input type="checkbox" id="exportAnalytics"> Analytics Data</label><br>
            <label><input type="checkbox" id="exportVideos"> Video Metadata</label>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Export Format</label>
          <select id="exportFormat" class="form-input">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel (XLSX)</option>
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
          <button class="action-btn" onclick="processDataExport()">Export Data</button>
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
});

function addNewUser() {
  const email = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPassword').value;
  const deviceId = document.getElementById('userDeviceId').value.trim() || generateDeviceId();
  const expiration = document.getElementById('userExpiration').value;
  
  if (!email || !password || !expiration) {
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
    deviceId: deviceId,
    type: 'student',
    expirationDate: expirationTimestamp,
    createdAt: Date.now()
  };
  
  // Save to database
  db.ref('users/' + userId).set(userData)
    .then(() => {
      NotificationManager.showToast('Student added successfully!');
      document.getElementById('addUserForm').reset();
      closeModal('addUserModal');
      loadQuickStats(); // Refresh stats
    })
    .catch(error => {
      console.error('Error adding user:', error);
      NotificationManager.showToast('Error adding student: ' + error.message);
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
      // Success
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        // Save lesson data to database
        saveLessonData(unitName, title, description, fileName, downloadURL);
      });
    }
  );
}

function saveLessonData(unitName, title, description, fileName, downloadURL) {
  const lessonData = {
    title: title,
    description: description,
    videoFile: fileName,
    videoURL: downloadURL,
    createdAt: Date.now(),
    duration: 0, // Will be updated when video metadata is available
    thumbnail: '' // Can be generated later
  };
  
  // Save to database
  db.ref(`units/${unitName}/lessons/${title}`).set(lessonData)
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
function loadAllUsers() {
  db.ref('users').once('value').then(snapshot => {
    const usersGrid = document.getElementById('usersGrid');
    if (!usersGrid) return;
    
    usersGrid.innerHTML = '';
    
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([userId, userData]) => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.style.cssText = 'background: #f8f9fa; padding: 16px; border-radius: 8px; border: 1px solid #e0e0e0;';
        
        const expirationDate = new Date(userData.expiration || Date.now() + 30*24*60*60*1000);
        const isExpired = expirationDate < new Date();
        
        userCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <div>
              <strong>${userData.email || userId}</strong>
              <div style="font-size: 12px; color: #666;">ID: ${userData.deviceId || 'Auto-generated'}</div>
            </div>
            <span style="background: ${isExpired ? '#dc3545' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
              ${isExpired ? 'Expired' : 'Active'}
            </span>
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 12px;">
            Expires: ${expirationDate.toLocaleDateString()}
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="editUser('${userId}')" style="padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 12px;">Edit</button>
            <button onclick="deleteUser('${userId}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px;">Delete</button>
            <button onclick="extendUser('${userId}')" style="padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px;">Extend</button>
          </div>
        `;
        
        usersGrid.appendChild(userCard);
      });
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

function filterUsers() {
  const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
  const userCards = document.querySelectorAll('.user-card');
  
  userCards.forEach(card => {
    const email = card.querySelector('strong').textContent.toLowerCase();
    card.style.display = email.includes(searchTerm) ? 'block' : 'none';
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
  
  NotificationManager.showToast(`Generating ${reportType} report in ${format} format...`);
  
  setTimeout(() => {
    NotificationManager.showToast('Report generated successfully!');
    closeModal('reportModal');
  }, 2000);
}

function processDataExport() {
  const format = document.getElementById('exportFormat').value;
  const progressDiv = document.getElementById('exportProgress');
  const progressFill = document.getElementById('exportProgressFill');
  const statusDiv = document.getElementById('exportStatus');
  
  progressDiv.style.display = 'block';
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressFill.style.width = progress + '%';
    statusDiv.textContent = `Exporting data... ${progress}%`;
    
    if (progress >= 100) {
      clearInterval(interval);
      statusDiv.textContent = 'Export completed!';
      NotificationManager.showToast(`Data exported in ${format} format`);
      setTimeout(() => {
        closeModal('exportModal');
      }, 1000);
    }
  }, 200);
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
  const title = document.getElementById('lessonTitle').value;
  const unit = document.getElementById('lessonUnit').value;
  const description = document.getElementById('lessonDescription').value;
  const order = document.getElementById('lessonOrder').value;
  
  if (!title || !unit) {
    NotificationManager.showToast('Please fill in required fields');
    return;
  }
  
  const lessonData = {
    description: description,
    order: parseInt(order),
    createdAt: new Date().toISOString(),
    createdBy: currentUser.email
  };
  
  db.ref(`units/${unit}/lessons/${title}`).set(lessonData)
    .then(() => {
      NotificationManager.showToast('Lesson added successfully');
      closeModal('addLessonModal');
    })
    .catch(error => {
      console.error('Error adding lesson:', error);
      NotificationManager.showToast('Error adding lesson');
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
        const expirationDate = new Date(userData.expiration || Date.now() + 30*24*60*60*1000);
        const isExpired = expirationDate < new Date();
        
        row.innerHTML = `
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${userData.email || userId}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">
            <span style="background: ${isExpired ? '#dc3545' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
              ${isExpired ? 'Expired' : 'Active'}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${expirationDate.toLocaleDateString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">
            <button onclick="editUser('${userId}')" style="padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 11px; margin-right: 4px;">Edit</button>
            <button onclick="deleteUser('${userId}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 11px;">Delete</button>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666;">No users found</td></tr>';
    }
  });
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
    videosGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Video management interface will show uploaded videos here</div>';
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
  const theme = document.getElementById('teacherTheme').value;
  const defaultView = document.getElementById('defaultView').value;
  const backupFreq = document.getElementById('backupFrequency').value;
  
  localStorage.setItem('teacherTheme', theme);
  localStorage.setItem('teacherDefaultView', defaultView);
  localStorage.setItem('backupFrequency', backupFreq);
  
  localStorage.setItem('emailNotifications', document.getElementById('emailNotifications').checked);
  localStorage.setItem('browserNotifications', document.getElementById('browserNotifications').checked);
  localStorage.setItem('dailyReports', document.getElementById('dailyReports').checked);
  
  NotificationManager.showToast('Teacher settings saved successfully');
  closeModal('teacherSettingsModal');
}

function resetToDefaults() {
  if (confirm('Reset all settings to defaults?')) {
    localStorage.removeItem('teacherTheme');
    localStorage.removeItem('teacherDefaultView');
    localStorage.removeItem('backupFrequency');
    localStorage.removeItem('emailNotifications');
    localStorage.removeItem('browserNotifications');
    localStorage.removeItem('dailyReports');
    
    loadTeacherSettings();
    NotificationManager.showToast('Settings reset to defaults');
  }
}

function loadMessages() {
  const messagesList = document.getElementById('messagesList');
  if (!messagesList) return;
  
  const messages = [
    { id: 1, subject: 'Welcome to the platform', type: 'sent', date: '2024-01-15', unread: false },
    { id: 2, subject: 'Course completion notification', type: 'sent', date: '2024-01-14', unread: false },
    { id: 3, subject: 'User feedback', type: 'response', date: '2024-01-13', unread: true }
  ];
  
  messagesList.innerHTML = messages.map(msg => `
    <div style="padding: 12px; border-bottom: 1px solid #ddd; ${msg.unread ? 'background: #f0f8ff;' : ''}">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <strong>${msg.subject}</strong>
          <div style="font-size: 12px; color: #666;">Type: ${msg.type} | Date: ${msg.date}</div>
        </div>
        <div style="display: flex; gap: 4px;">
          ${msg.unread ? '<span style="background: #007bff; color: white; padding: 2px 6px; border-radius: 8px; font-size: 10px;">NEW</span>' : ''}
          <button onclick="viewMessage(${msg.id})" style="padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 11px;">View</button>
        </div>
      </div>
    </div>
  `).join('');
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
  NotificationManager.showToast(`Opening message ${messageId}`);
}

function loadBackupHistory() {
  const backupHistory = document.getElementById('backupHistory');
  if (!backupHistory) return;
  
  const backups = [
    { date: '2024-01-15', type: 'Full Backup', size: '156 MB' },
    { date: '2024-01-10', type: 'Users Only', size: '2.3 MB' },
    { date: '2024-01-05', type: 'Content Only', size: '89 MB' }
  ];
  
  if (backups.length > 0) {
    backupHistory.innerHTML = backups.map(backup => `
      <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee;">
        <div>
          <strong>${backup.type}</strong>
          <div style="font-size: 12px; color: #666;">${backup.date}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #666;">${backup.size}</div>
          <button onclick="downloadBackup('${backup.date}')" style="padding: 2px 6px; background: #6c4fc1; color: white; border: none; border-radius: 3px; font-size: 10px;">Download</button>
        </div>
      </div>
    `).join('');
  }
}

function processBackup() {
  const backupType = document.getElementById('backupType').value;
  const progressDiv = document.getElementById('backupProgress');
  const progressFill = document.getElementById('backupProgressFill');
  const statusDiv = document.getElementById('backupStatus');
  
  progressDiv.style.display = 'block';
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    progressFill.style.width = progress + '%';
    statusDiv.textContent = `Creating ${backupType} backup... ${progress}%`;
    
    if (progress >= 100) {
      clearInterval(interval);
      statusDiv.textContent = 'Backup completed successfully!';
      NotificationManager.showToast(`${backupType} backup created`);
      loadBackupHistory();
      setTimeout(() => {
        closeModal('backupModal');
      }, 1500);
    }
  }, 100);
}

function downloadBackup(date) {
  NotificationManager.showToast(`Downloading backup from ${date}`);
}

function exportUserList() {
  exportUserData();
}

// Utility Functions
function editUser(userId) {
  NotificationManager.showToast(`Editing user: ${userId}`);
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
  
  db.ref(`users/${userId}/expiration`).set(newExpiration.getTime())
    .then(() => {
      NotificationManager.showToast('User expiration extended by 30 days');
      loadAllUsers();
      loadUserList();
    })
    .catch(error => {
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
