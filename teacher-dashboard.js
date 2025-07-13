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
  // Redirect to user management page or open detailed modal
  console.log('Opening User Management');
  NotificationManager.showToast('User Management feature coming soon!');
}

function openContentManagement() {
  console.log('Opening Content Management');
  NotificationManager.showToast('Content Management feature coming soon!');
}

function openAnalytics() {
  console.log('Opening Analytics');
  NotificationManager.showToast('Analytics feature coming soon!');
}

function openCommunication() {
  // Open send notification page
  window.location.href = 'send_notification.html';
}

function openVideoManagement() {
  console.log('Opening Video Management');
  NotificationManager.showToast('Video Management feature coming soon!');
}

function openTeacherSettings() {
  console.log('Opening Teacher Settings');
  NotificationManager.showToast('Teacher Settings feature coming soon!');
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
  NotificationManager.showToast('Add Lesson feature coming soon!');
}

function openUploadVideoModal() {
  openModal('uploadVideoModal');
}

function viewAllUsers() {
  console.log('Viewing All Users');
  NotificationManager.showToast('User list feature coming soon!');
}

function generateReport() {
  console.log('Generating Report');
  NotificationManager.showToast('Report generation feature coming soon!');
}

function exportData() {
  console.log('Exporting Data');
  NotificationManager.showToast('Data export feature coming soon!');
}

function openSendNotification() {
  window.location.href = 'send_notification.html';
}

function viewMessages() {
  console.log('Viewing Messages');
  NotificationManager.showToast('Messages feature coming soon!');
}

function manageVideos() {
  console.log('Managing Videos');
  NotificationManager.showToast('Video management feature coming soon!');
}

function openPreferences() {
  console.log('Opening Preferences');
  NotificationManager.showToast('Preferences feature coming soon!');
}

function backupData() {
  console.log('Backing up Data');
  NotificationManager.showToast('Backup feature coming soon!');
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
