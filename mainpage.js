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
const storage = firebase.storage();

const messaging = firebase.messaging();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('firebase-messaging-sw.js')
    .then(function(registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch(function(err) {
      console.log('Service Worker registration failed:', err);
    });
}

function requestNotificationPermission() {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      messaging.getToken({ vapidKey: 'BOrHxEJA2I5f7r9PkZ63GNG5mkRZIk3USWLz-ELZoSICdTKFfsjiOHdHuao5kAwwsp7FKBuiZPKRVaMFF7lb3gI' })
        .then((token) => {
          console.log('FCM Token:', token);
          // Save this token to your database for the user, so you can send them notifications
        })
        .catch((err) => {
          console.log('Unable to get FCM token.', err);
        });
    } else {
      console.log('Notification permission not granted.');
    }
  });
}

// Call this after user login or on page load
requestNotificationPermission();

// Listen for foreground messages
messaging.onMessage((payload) => {
  // Show notification in-app
  alert(payload.notification.title + "\n" + payload.notification.body);
});

let currentUnit = null;
let lessons = [];
let openedLessonKey = null; // Add this at the top with your other globals
let plyrPlayer = null;

// Load units into drawer
function loadUnits() {
  // Load user progress first, then units
  ProgressTracker.getUserProgress()
    .then(userProgress => {
      return db.ref('units').once('value').then(snapshot => {
        const unitsList = document.getElementById('units-list');
        
        // Clear only the units, preserve Progress and Settings
        const staticItems = unitsList.querySelectorAll('li[data-static="true"]');
        unitsList.innerHTML = '';
        
        // Re-add static items (Progress and Settings)
        staticItems.forEach(item => unitsList.appendChild(item));
        
        // Add Teacher Dashboard for teachers
        addTeacherDashboardIfApplicable();
        
        snapshot.forEach(unitSnap => {
          const unitName = unitSnap.key;
          const unitData = unitSnap.val();
          
          // Calculate progress for this unit
          const progress = calculateUnitProgress(unitName, unitData, userProgress);
          
          const li = document.createElement('li');
          li.onclick = () => goToUnit(unitName);
          li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div style="flex: 1; cursor: pointer;"">
                <span>${unitName}</span>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                  ${progress.completed}/${progress.total} lessons
                  ${progress.percentage > 0 ? `(${progress.percentage}%)` : ''}
                </div>
              </div>
              <button onclick="event.stopPropagation(); openMainPageFileViewer('${unitName}', null)" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; font-size: 10px; cursor: pointer; margin: 0%; align-items: center; gap: 4px;">
                <span class="material-icons" style="font-size: 12px;">folder</span>
                Files
              </button>
            </div>
          `;
          
          unitsList.appendChild(li);
        });
      });
    })
    .catch(error => {
      console.error('Error loading units with progress:', error);
      // Fallback to loading units without progress
      loadUnitsWithoutProgress();
    });
}

function goToUnit(unitName) {
  console.log('Navigating to unit:', unitName); // Debug log
  // Navigate to unit detail page
  localStorage.setItem('selectedUnit', unitName);
  const url = `unitdetail.html?unit=${encodeURIComponent(unitName)}`;
  console.log('Navigation URL:', url); // Debug log
  window.location.href = url;
}

function loadUnitsWithoutProgress() {
  db.ref('units').once('value').then(snapshot => {
    const unitsList = document.getElementById('units-list');
    
    // Clear only the units, preserve Progress and Settings
    const staticItems = unitsList.querySelectorAll('li[data-static="true"]');
    unitsList.innerHTML = '';
    
    // Re-add static items (Progress and Settings)
    staticItems.forEach(item => unitsList.appendChild(item));
    
    snapshot.forEach(unitSnap => {
      const unitName = unitSnap.key;
      const li = document.createElement('li');
      li.onclick = () => goToUnit(unitName);
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="flex: 1; cursor: pointer;"">
            <span>${unitName}</span>
          </div>
          <button onclick="event.stopPropagation(); openMainPageFileViewer('${unitName}', null)" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; font-size: 10px; cursor: pointer; margin: 0%; align-items: center; gap: 4px;">
            <span class="material-icons" style="font-size: 12px;">folder</span>
            Files
          </button>
        </div>
      `;
      unitsList.appendChild(li);
    });
  });
}

function calculateUnitProgress(unitName, unitData, userProgress) {
  let totalLessons = 0;
  let completedLessons = 0;
  
  // Count lessons in this unit
  Object.keys(unitData).forEach(key => {
    const item = unitData[key];
    if (item && typeof item === 'object' && (item.videoURL || item.videoFile)) {
      totalLessons++;
      
      // Check if this lesson is completed
      if (userProgress[unitName] && userProgress[unitName][key] && userProgress[unitName][key].completed) {
        completedLessons++;
      }
    }
  });
  
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  return {
    total: totalLessons,
    completed: completedLessons,
    percentage: percentage
  };
}

// Load lessons for a unit
function loadLessons(unitName, unitSnap) {
  currentUnit = unitName;
  lessons = [];
  document.getElementById('main-content').scrollTo(0, 0);
  document.getElementById('unit-title')?.remove();

  // Remove the home fragment message if present
  const homeMsg = document.getElementById('home-fragment-msg');
  if (homeMsg) homeMsg.remove();

  // Add or update the unit title
  let unitTitle = document.getElementById('unit-title');
  if (!unitTitle) {
    unitTitle = document.createElement('h2');
    unitTitle.id = 'unit-title';
    document.getElementById('main-content').prepend(unitTitle);
  }
  unitTitle.textContent = unitName;

  const lessonGrid = document.getElementById('lesson-grid');
  lessonGrid.innerHTML = '';
  document.getElementById('lesson-details').style.display = 'none';

  // Get the unit ID from the current unit name for progress tracking
  const unitId = currentUnit;

  // Loop through all lessons in the unit
  unitSnap.forEach(lessonSnap => {
    const lessonKey = lessonSnap.key;
    const lessonData = lessonSnap.val();
    lessons.push({ ...lessonData, key: lessonKey, unitId: unitId });

    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.innerHTML = `
      <img src="${lessonData.thumbnailURL || ''}" alt="Thumbnail" class="lesson-thumbnail" style="width:80px;height:80px;object-fit:cover;margin-bottom:8px;">
      <div style="margin-bottom: 8px;">${lessonKey}</div>
      <div class="lesson-actions" style="display: flex; gap: 6px;">
        <button class="lesson-action-btn" onclick="event.stopPropagation(); showLessonDetails('${lessonKey}')" style="flex: 1; padding: 4px 8px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
          <span class="material-icons" style="font-size: 14px;">play_arrow</span>
          View
        </button>
        <button class="lesson-action-btn files-btn" onclick="event.stopPropagation(); openMainPageFileViewer('${currentUnit}', '${lessonKey}')" style="flex: 1; padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
          <span class="material-icons" style="font-size: 14px;">folder</span>
          Files
        </button>
      </div>
    `;
    // Remove the onclick from the card since we now have specific buttons
    // card.onclick = () => showLessonDetails(lessonKey);
    lessonGrid.appendChild(card);
  });
}

// Show lesson details with thumbnail and description
function showLessonDetails(lessonKey) {
  const details = document.getElementById('lesson-details');
  if (openedLessonKey === lessonKey && details.style.display === 'block') {
    details.style.display = 'none';
    openedLessonKey = null;
    return;
  }
  openedLessonKey = lessonKey;

  const lesson = lessons.find(l => l.key === lessonKey);
  if (!lesson) return;
  
  // Store current lesson info for progress tracking
  window.currentUnitId = lesson.unitId;
  window.currentLessonId = lesson.key;
  
  details.style.display = 'block';

  const thumbnail = lesson.thumbnailURL || "";
  const description = lesson.description || "No description.";
  const videoFile = lesson.videoFile || lesson.videoURL || "";

  // Show thumbnail and description immediately
  details.innerHTML = `
    <img class="lesson-thumbnail" src="${thumbnail}" alt="Thumbnail" />
    <div style="margin:12px 0 8px 0; font-size:1.2em; font-weight:bold;">${lessonKey}</div>
    <div style="margin-bottom:16px;">${description}</div>
    <div id="video-btn-area"><span style="color:#888;">Loading video...</span></div>
  `;

  if (!videoFile) {
    document.getElementById('video-btn-area').innerHTML = "<div>No video available.</div>";
    return;
  }

  storage.ref('videos/' + videoFile).getDownloadURL().then(function(url) {
    document.getElementById('video-btn-area').innerHTML = `
      <button class="play-btn" onclick="playLessonVideo('${url.replace(/'/g, "\\'")}')">Play Video</button>
    `;
  }).catch(function(error) {
    document.getElementById('video-btn-area').innerHTML = "<div>Could not load video.</div>";
  });
}

// Play video in fullscreen modal
let vjsPlayer = null;

window.playLessonVideo = function(videoURL) {
  const modal = document.getElementById('video-modal');

  // Remove old video element if exists
  let oldVideo = document.getElementById('fullscreen-video');
  if (oldVideo) oldVideo.remove();

  // Create a new video element
  const videoContainer = modal.querySelector('div'); // assuming your modal has a single div wrapper
  const newVideo = document.createElement('video');
  newVideo.id = 'fullscreen-video';
  newVideo.className = 'video-js vjs-default-skin';
  newVideo.setAttribute('playsinline', '');
  newVideo.setAttribute('controls', '');
  newVideo.setAttribute('preload', 'auto');
  videoContainer.appendChild(newVideo);

  modal.style.display = 'flex';

  // Destroy previous player if exists
  if (vjsPlayer) {
    vjsPlayer.dispose();
    vjsPlayer = null;
  }

  // Set up Video.js player
  vjsPlayer = videojs(newVideo, {
    controls: true,
    autoplay: true,
    preload: 'auto',
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    controlBar: {
      volumePanel: {inline: false}
    }
  });

  vjsPlayer.src({ type: 'video/mp4', src: videoURL });

  // Enable mobile UI (double-tap seek, better fullscreen, etc.)
  vjsPlayer.mobileUi();

  // Track video completion for progress
  vjsPlayer.on('ended', function() {
    // Mark lesson as completed when video ends
    if (window.currentUnitId && window.currentLessonId) {
      ProgressTracker.markLessonCompleted(window.currentUnitId, window.currentLessonId);
      NotificationManager.showToast('Lesson completed! 🎉');
    }
  });

  // Auto fullscreen on play (optional)
  vjsPlayer.ready(function() {
    vjsPlayer.play();
    if (vjsPlayer.requestFullscreen) {
      vjsPlayer.requestFullscreen();
      // Try to lock orientation to landscape
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    }
  });

  // Prevent right-click and drag
  newVideo.oncontextmenu = e => e.preventDefault();
  newVideo.ondragstart = e => e.preventDefault();
};

// Close video modal
window.closeVideoModal = function() {
  const modal = document.getElementById('video-modal');
  modal.style.display = 'none';
  if (vjsPlayer) {
    vjsPlayer.pause();
    vjsPlayer.dispose();
    vjsPlayer = null;
  }
  // Unlock orientation if needed
  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
};

// Drawer open/close logic (matches HTML)
window.openDrawer = function() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-backdrop').style.display = 'block';
};
window.closeDrawer = function() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-backdrop').style.display = 'none';
};

window.onload = loadUnits;

// Load user preferences
function loadUserPreferences() {
  // Theme is now handled by global.js ThemeManager
}

// Initialize preferences on page load
document.addEventListener('DOMContentLoaded', loadUserPreferences);

// Attempt to deter screen recording (not foolproof)
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden') {
    const video = document.getElementById('fullscreen-video');
    if (video && !video.paused) video.pause();
  }
});

// Optional: FAB click logic
window.onFabClick = function() {
  // Example: open mail or show a message
  alert("FAB clicked!");
};

window.logout = function() {
  AuthManager.logout();
};

window.openSettings = function() {
  Navigation.goToSettings();
};

window.openAdvancedSettings = function() {
  window.location.href = "advanced-settings.html";
};

window.openProgress = function() {
  Navigation.goToProgress();
};

firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {
    // If no user is logged in, send them back to login
    window.location.href = "index.html";
  } else {
    // Initialize Advanced Features
    if (typeof AdvancedFeatures !== 'undefined') {
      window.advancedFeatures = new AdvancedFeatures();
      window.advancedFeatures.applyFeatures();
    }
    
    // User is authenticated, load units with progress
    loadUnits();
  }
});

// Apply advanced features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (typeof AdvancedFeatures !== 'undefined') {
    setTimeout(() => {
      if (window.advancedFeatures) {
        window.advancedFeatures.applyFeatures();
      }
    }, 100);
  }
});

// Refresh progress when page becomes visible (user returns from other pages)
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && firebase.auth().currentUser) {
    console.log('Page became visible, refreshing units with progress');
    loadUnits();
  }
});

document.getElementById('fullscreen-video').addEventListener('contextmenu', e => e.preventDefault());
document.getElementById('fullscreen-video').addEventListener('dragstart', e => e.preventDefault());

// Search functionality
let allLessonsCache = null;

// Initialize search functionality
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearButton = document.getElementById('clearSearch');
  
  if (searchInput) {
    searchInput.addEventListener('input', performSearch);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
  
  if (clearButton) {
    clearButton.addEventListener('click', clearSearch);
  }
}

// Cache all lessons for faster searching
function cacheAllLessons() {
  if (allLessonsCache) return Promise.resolve(allLessonsCache);
  
  return db.ref('units').once('value')
    .then(snapshot => {
      const lessons = [];
      snapshot.forEach(unitSnap => {
        const unitName = unitSnap.key;
        const unitData = unitSnap.val();
        
        Object.keys(unitData).forEach(lessonKey => {
          const lesson = unitData[lessonKey];
          if (lesson && typeof lesson === 'object') {
            lessons.push({
              unitName,
              lessonKey,
              title: lesson.title || lessonKey,
              description: lesson.description || '',
              videoURL: lesson.videoURL || '',
              thumbnailURL: lesson.thumbnailURL || ''
            });
          }
        });
      });
      
      allLessonsCache = lessons;
      return lessons;
    })
    .catch(error => {
      console.error('Error caching lessons:', error);
      return [];
    });
}

// Perform search across all lessons
function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) {
    clearSearch();
    return;
  }
  
  cacheAllLessons().then(lessons => {
    const results = lessons.filter(lesson => {
      return lesson.title.toLowerCase().includes(query) ||
             lesson.description.toLowerCase().includes(query) ||
             lesson.unitName.toLowerCase().includes(query);
    });
    
    displaySearchResults(results);
  });
}

// Display search results
function displaySearchResults(results) {
  const resultsContainer = document.getElementById('searchResults');
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 24px;">No lessons found</div>';
    return;
  }
  
  resultsContainer.innerHTML = results.map(lesson => `
    <div class="search-result-item" onclick="openLesson('${lesson.unitName}', '${lesson.lessonKey}')">
      <div class="search-result-unit">${lesson.unitName}</div>
      <div class="search-result-title">${lesson.title}</div>
      <div class="search-result-description">${lesson.description}</div>
    </div>
  `).join('');
}

// Clear search results
function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');
  
  searchInput.value = '';
  resultsContainer.innerHTML = '';
}

// Open lesson from search results
window.openLesson = function(unitName, lessonKey) {
  // Store the selected unit and lesson
  localStorage.setItem('selectedUnit', unitName);
  localStorage.setItem('selectedLesson', lessonKey);
  
  // Navigate to the unit detail page with the lesson
  window.location.href = `unitdetail.html?unit=${encodeURIComponent(unitName)}&lesson=${encodeURIComponent(lessonKey)}`;
};

// Show search section
window.showSearchSection = function() {
  const mainContent = document.querySelector('.main-content');
  const searchSection = document.getElementById('searchSection');
  
  // Hide main content, show search
  if (mainContent) {
    mainContent.style.display = 'none';
  }
  if (searchSection) {
    searchSection.style.display = 'block';
    document.getElementById('searchInput').focus();
  }
  
  // Cache lessons for faster search
  cacheAllLessons();
  
  // Close drawer
  closeDrawer();
};

// Hide search section and return to main content
window.hideSearchSection = function() {
  const mainContent = document.querySelector('.main-content');
  const searchSection = document.getElementById('searchSection');
  
  // Show main content, hide search
  if (mainContent) {
    mainContent.style.display = 'flex';
  }
  if (searchSection) {
    searchSection.style.display = 'none';
  }
  
  // Clear search results
  clearSearch();
};

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initSearch();
  
  // Add click handler for search menu item
  const searchMenuItem = document.getElementById('searchMenuItem');
  if (searchMenuItem) {
    searchMenuItem.addEventListener('click', showSearchSection);
  }
  
  // Initialize security measures for file viewing
  addMainPageSecurityMeasures();
});

// Function to add additional security overlay to PDF iframe on main page
function addMainPagePDFSecurityOverlay(iframe) {
  try {
    // Try to access iframe content to add security measures
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    // Add CSS to hide download buttons and toolbar
    const style = document.createElement('style');
    style.textContent = `
      #toolbar, #toolbarContainer, #downloadButton, #printButton, #openFileButton {
        display: none !important;
      }
      #viewerContainer {
        top: 0 !important;
      }
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    
    if (iframeDoc && iframeDoc.head) {
      iframeDoc.head.appendChild(style);
    }
  } catch (e) {
    // Cross-origin restrictions prevent direct access
    // PDF will still display but with basic restrictions
    console.log('Main page PDF security overlay applied with basic restrictions');
  }
}

// Security measures for file viewing
function addMainPageSecurityMeasures() {
  // Disable right-click context menu on secure content
  document.addEventListener('contextmenu', function(e) {
    const modal = document.getElementById('mainPageFilePreviewModal');
    if (modal && modal.style.display === 'block') {
      e.preventDefault();
    }
  });
  
  // Disable keyboard shortcuts for developer tools and saving
  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('mainPageFilePreviewModal');
    if (modal && modal.style.display === 'block') {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
      }
    }
  });
  
  // Disable print screen
  document.addEventListener('keyup', function(e) {
    const modal = document.getElementById('mainPageFilePreviewModal');
    if (modal && modal.style.display === 'block' && e.key === 'PrintScreen') {
      alert('Screenshots are not allowed while viewing secure content');
    }
  });
  
  // Detect if developer tools are open
  let devtools = {
    open: false,
    orientation: null
  };
  
  const threshold = 160;
  
  setInterval(() => {
    const modal = document.getElementById('mainPageFilePreviewModal');
    if (modal && modal.style.display === 'block') {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          // Close the modal if developer tools are detected
          closeMainPageFilePreview();
          alert('Developer tools detected. File preview has been closed for security reasons.');
        }
      } else {
        devtools.open = false;
      }
    }
  }, 500);
}

function addTeacherDashboardIfApplicable() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  // Check if teacher dashboard already exists
  const unitsList = document.getElementById('units-list');
  const existingTeacherDashboard = unitsList.querySelector('li[data-teacher-dashboard="true"]');
  if (existingTeacherDashboard) {
    return; // Already exists, don't add another one
  }
  
  // Search for user by email in database
  db.ref('users').orderByChild('email').equalTo(user.email).once('value').then(snapshot => {
    if (!snapshot.exists()) return;
    
    // Get the first (and should be only) matching user
    const userData = Object.values(snapshot.val())[0];
    if (userData && userData.type === 'teacher') {
      // Add Teacher Dashboard link
      const teacherDashboardItem = document.createElement('li');
      teacherDashboardItem.setAttribute('data-static', 'true');
      teacherDashboardItem.setAttribute('data-teacher-dashboard', 'true');
      teacherDashboardItem.style.borderBottom = '1px solid #eee';
      teacherDashboardItem.style.backgroundColor = 'transparent';
      teacherDashboardItem.innerHTML = `
        <span class="material-icons" style="vertical-align: middle; margin-right: 12px;">dashboard</span>
        <span data-translate="teacherDashboard">Teacher Dashboard</span>
      `;
      teacherDashboardItem.onclick = () => {
        window.location.href = 'teacher-dashboard.html';
      };
      
      // Insert after the settings items but before units
      const lastStaticItem = unitsList.querySelector('li[data-static="true"]:last-of-type');
      if (lastStaticItem) {
        lastStaticItem.parentNode.insertBefore(teacherDashboardItem, lastStaticItem.nextSibling);
      } else {
        unitsList.appendChild(teacherDashboardItem);
      }
      
      // Update translations if advanced features are available
      if (typeof advancedFeatures !== 'undefined' && advancedFeatures) {
        advancedFeatures.updateUITexts();
      }
    }
  }).catch(error => {
    console.error('Error checking user type:', error);
  });
}

// ========= MAIN PAGE FILE VIEWER FUNCTIONS =========

function openMainPageFileViewer(unitKey, lessonKey) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'mainPageFileViewerModal';
  modal.style.display = 'flex';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  modal.style.zIndex = '10000';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.padding = '20px';
  modal.style.boxSizing = 'border-box';
  
  const targetName = lessonKey ? `Lesson: ${lessonKey}` : `Unit: ${unitKey}`;
  
  modal.innerHTML = `
    <div class="modal-content" style="background: white; border-radius: 12px; max-width: 900px; max-height: 90vh; width: 100%; overflow-y: auto; position: relative;">
      <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: #6c4fc1; font-size: 20px;">📁 Files - ${targetName}</h3>
        <button onclick="closeMainPageFileViewer()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div id="mainPageFilesList" style="min-height: 200px;">
          <div style="text-align: center; padding: 40px; color: #666;">
            <span class="material-icons" style="font-size: 48px; color: #ddd; margin-bottom: 16px;">folder_open</span>
            <div>Loading files...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load files
  loadMainPageFiles(unitKey, lessonKey);
}

function closeMainPageFileViewer() {
  const modal = document.getElementById('mainPageFileViewerModal');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
}

function loadMainPageFiles(unitKey, lessonKey) {
  const filesList = document.getElementById('mainPageFilesList');
  const dbPath = lessonKey ? 
    `units/${unitKey}/lessons/${lessonKey}/files` : 
    `units/${unitKey}/files`;
  
  console.log('Loading main page files from path:', dbPath); // Debug log
  
  db.ref(dbPath).once('value').then(snapshot => {
    console.log('Main page files snapshot exists:', snapshot.exists()); // Debug log
    if (!snapshot.exists()) {
      filesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; color: #ddd; margin-bottom: 16px;">folder_open</span>
          <div>No files available for this ${lessonKey ? 'lesson' : 'unit'}</div>
          <div style="font-size: 12px; color: #999; margin-top: 8px;">Files will appear here once uploaded by your teacher</div>
        </div>
      `;
      return;
    }
    
    const files = [];
    snapshot.forEach(child => {
      const fileData = child.val();
      fileData.id = child.key;
      
      // Only show files that students can access (not restricted)
      if (fileData.access !== 'restricted') {
        files.push(fileData);
      }
    });
    
    if (files.length === 0) {
      filesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; color: #ddd; margin-bottom: 16px;">folder_open</span>
          <div>No files available for students</div>
        </div>
      `;
      return;
    }
    
    // Sort files by upload date (newest first)
    files.sort((a, b) => b.uploadedAt - a.uploadedAt);
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">';
    
    files.forEach(file => {
      const fileIcon = getMainPageFileIcon(file.extension);
      const fileSize = formatMainPageFileSize(file.size);
      const uploadDate = new Date(file.uploadedAt).toLocaleDateString();
      const canDownload = file.access === 'downloadable';
      const canPreview = canMainPagePreviewFile(file.extension);
      
      html += `
        <div class="main-page-file-card" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; transition: all 0.2s ease;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span class="material-icons" style="font-size: 32px; color: #6c4fc1;">${fileIcon}</span>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: bold; font-size: 14px; color: #333; margin-bottom: 4px; word-break: break-word;">${file.name}</div>
              <div style="font-size: 12px; color: #666;">${file.type} • ${fileSize}</div>
            </div>
          </div>
          
          ${file.description ? `<div style="font-size: 12px; color: #666; margin-bottom: 12px; line-height: 1.4;">${file.description}</div>` : ''}
          
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #888; margin-bottom: 12px;">
            <span>Uploaded: ${uploadDate}</span>
            <span class="main-page-access-badge ${file.access}">${file.access === 'view-only' ? 'View Only' : 'Downloadable'}</span>
          </div>
          
          <div style="display: flex; gap: 8px;">
            ${canPreview ? `<button onclick="previewMainPageFile('${file.id}', '${unitKey}', '${lessonKey}')" style="flex: 1; padding: 6px 12px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;">
              <span class="material-icons" style="font-size: 14px;">visibility</span>
              Preview
            </button>` : ''}
            
            ${canDownload ? `<button onclick="downloadMainPageFile('${file.url}', '${file.name}')" style="flex: 1; padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;">
              <span class="material-icons" style="font-size: 14px;">download</span>
              Download
            </button>` : `<button disabled style="flex: 1; padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span class="material-icons" style="font-size: 14px;">block</span>
              No Download
            </button>`}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    filesList.innerHTML = html;
  }).catch(error => {
    console.error('Error loading files:', error);
    filesList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">error</span>
        <div>Error loading files</div>
      </div>
    `;
  });
}

function getMainPageFileIcon(extension) {
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

function formatMainPageFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function canMainPagePreviewFile(extension) {
  const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'txt'];
  return previewableTypes.includes(extension.toLowerCase());
}

function previewMainPageFile(fileId, unitKey, lessonKey) {
  const dbPath = lessonKey ? 
    `units/${unitKey}/lessons/${lessonKey}/files/${fileId}` : 
    `units/${unitKey}/files/${fileId}`;
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      alert('File not found');
      return;
    }
    
    const file = snapshot.val();
    showMainPageFilePreview(file);
  }).catch(error => {
    console.error('Error loading file:', error);
    alert('Error loading file');
  });
}

function showMainPageFilePreview(file) {
  // Get current user email for watermark
  const currentUser = firebase.auth().currentUser;
  const userEmail = currentUser ? currentUser.email : 'Unknown Student';
  
  const modal = document.createElement('div');
  modal.id = 'mainPageFilePreviewModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 15000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
  `;
  
  let previewContent = '';
  
  // Create watermark overlay
  const watermarkOverlay = `
    <div class="watermark-overlay" style="
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 200px,
        rgba(255, 255, 255, 0.05) 200px,
        rgba(255, 255, 255, 0.05) 250px
      );
    ">
      <div style="
        position: absolute;
        top: 20px;
        right: 20px;
        color: rgba(255, 255, 255, 0.3);
        font-size: 12px;
        font-weight: bold;
        background: rgba(0, 0, 0, 0.3);
        padding: 8px 12px;
        border-radius: 4px;
        backdrop-filter: blur(2px);
      ">
        ${userEmail}
      </div>
      <div style="
        position: absolute;
        bottom: 20px;
        left: 20px;
        color: rgba(255, 255, 255, 0.2);
        font-size: 10px;
        background: rgba(0, 0, 0, 0.3);
        padding: 4px 8px;
        border-radius: 4px;
        backdrop-filter: blur(2px);
      ">
        ${new Date().toLocaleString()}
      </div>
    </div>
  `;
  
  switch (file.extension.toLowerCase()) {
    case 'pdf':
      previewContent = `
        <div style="position: relative; width: 100%; height: 70vh; background: white; border-radius: 8px; overflow: hidden;">
          ${watermarkOverlay}
          <div id="mainPageSecureDocViewer" style="
            width: 100%;
            height: 100%;
            overflow-y: auto;
            padding: 20px;
            background: white;
            color: black;
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            position: relative;
            z-index: 1;
          ">
            <div style="text-align: center; padding: 40px; color: #666;">
              <div class="loading-spinner" style="
                border: 4px solid #f3f3f3;
                border-top: 4px solid #6c4fc1;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
              "></div>
              Loading document content...
            </div>
          </div>
        </div>
      `;
      break;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      previewContent = `
        <div style="position: relative; max-width: 100%; max-height: 70vh; border-radius: 8px; overflow: hidden;">
          ${watermarkOverlay}
          <img src="${file.url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px; object-fit: contain; position: relative; z-index: 1;">
        </div>
      `;
      break;
    case 'mp4':
      previewContent = `
        <div style="position: relative; max-width: 100%; max-height: 70vh; border-radius: 8px; overflow: hidden;">
          ${watermarkOverlay}
          <video controls style="max-width: 100%; max-height: 70vh; border-radius: 8px; position: relative; z-index: 1;" controlsList="nodownload">
            <source src="${file.url}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      `;
      break;
    case 'mp3':
      previewContent = `
        <div style="position: relative; width: 100%; max-width: 400px; background: #333; border-radius: 8px; padding: 20px;">
          ${watermarkOverlay}
          <audio controls style="width: 100%; position: relative; z-index: 1;" controlsList="nodownload">
            <source src="${file.url}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
        </div>
      `;
      break;
    case 'txt':
      previewContent = `
        <div style="position: relative; background: white; padding: 20px; border-radius: 8px; max-width: 100%; max-height: 70vh; overflow-y: auto;">
          ${watermarkOverlay}
          <div id="mainPageSecureTextViewer" style="
            font-family: monospace;
            white-space: pre-wrap;
            color: black;
            position: relative;
            z-index: 1;
            user-select: ${file.access === 'view-only' ? 'none' : 'text'};
            -webkit-user-select: ${file.access === 'view-only' ? 'none' : 'text'};
            -moz-user-select: ${file.access === 'view-only' ? 'none' : 'text'};
            -ms-user-select: ${file.access === 'view-only' ? 'none' : 'text'};
          ">
            <div style="text-align: center; padding: 20px; color: #666;">Loading text content...</div>
          </div>
        </div>
      `;
      break;
    default:
      previewContent = `
        <div style="text-align: center; color: white; padding: 40px; position: relative;">
          ${watermarkOverlay}
          <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">insert_drive_file</span>
          <div>Preview not available for this file type</div>
        </div>
      `;
  }
  
  modal.innerHTML = `
    <div style="background: #333; border-radius: 12px; max-width: 90vw; max-height: 90vh; width: 100%; position: relative; overflow: hidden;">
      <div style="background: #444; padding: 16px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px 12px 0 0;">
        <h3 style="margin: 0; color: white; font-size: 18px;">📄 ${file.name}</h3>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${file.access === 'downloadable' ? `<button onclick="downloadMainPageFile('${file.url}', '${file.name}')" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span class="material-icons" style="font-size: 14px;">download</span>
            Download
          </button>` : ''}
          <button onclick="closeMainPageFilePreview()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">&times;</button>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; overflow-y: auto; max-height: calc(90vh - 100px);">
        ${previewContent}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Handle secure content loading
  if (file.extension.toLowerCase() === 'pdf') {
    loadMainPageSecurePDFContent(file.url, userEmail);
  } else if (file.extension.toLowerCase() === 'txt') {
    loadMainPageSecureTextContent(file.url, userEmail, file.access);
  }
  
  // Prevent right-click context menu on the modal
  modal.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });
  
  // Prevent text selection for secure viewing
  modal.addEventListener('selectstart', function(e) {
    if (file.access === 'view-only') {
      e.preventDefault();
    }
  });
}

function closeMainPageFilePreview() {
  const modal = document.getElementById('mainPageFilePreviewModal');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
}

// Secure content loading functions for main page
function loadMainPageSecurePDFContent(url, userEmail) {
  const viewer = document.getElementById('mainPageSecureDocViewer');
  if (!viewer) return;
  
  viewer.innerHTML = `
    <div style="position: relative; width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 1000;">
        ${userEmail} | ${new Date().toLocaleString()}
      </div>
      <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 1000;">
        🔒 Secure View
      </div>
      <iframe 
        src="${url}#toolbar=0&navpanes=0&scrollbar=0" 
        style="width: 100%; height: 100%; border: none; pointer-events: auto;"
        onload="addMainPagePDFSecurityOverlay(this)"
        oncontextmenu="return false;"
        sandbox="allow-same-origin allow-scripts"
      ></iframe>
      <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; z-index: 1000;">
        Viewed by: ${userEmail} | ${new Date().toLocaleString()}
      </div>
    </div>
  `;
}

function loadMainPageSecureTextContent(url, userEmail, fileAccess) {
  const viewer = document.getElementById('mainPageSecureTextViewer');
  if (!viewer) return;
  
  fetch(url)
    .then(response => response.text())
    .then(text => {
      // Process text to add watermarks periodically
      const lines = text.split('\n');
      let processedText = '';
      
      lines.forEach((line, index) => {
        processedText += line + '\n';
        // Add subtle watermark every 10 lines
        if ((index + 1) % 10 === 0) {
          processedText += `\n[Viewed by: ${userEmail} - ${new Date().toLocaleString()}]\n\n`;
        }
      });
      
      viewer.innerHTML = `
        <div style="
          background: rgba(255, 255, 255, 0.95);
          padding: 20px;
          border-radius: 8px;
          position: relative;
          user-select: ${fileAccess === 'view-only' ? 'none' : 'text'};
          -webkit-user-select: ${fileAccess === 'view-only' ? 'none' : 'text'};
          -moz-user-select: ${fileAccess === 'view-only' ? 'none' : 'text'};
          -ms-user-select: ${fileAccess === 'view-only' ? 'none' : 'text'};
        ">
          <pre style="white-space: pre-wrap; font-family: monospace; font-size: 14px; line-height: 1.6; color: #333; margin: 0;">${processedText}</pre>
        </div>
      `;
    })
    .catch(error => {
      console.error('Error loading text file:', error);
      viewer.innerHTML = `
        <div style="text-align: center; color: #dc3545; padding: 20px;">
          <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">error</span>
          <div>Error loading text file content</div>
        </div>
      `;
    });
}

function downloadMainPageFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Open assignments and quizzes page
function openAssignments() {
  window.location.href = "student-assignments.html";
}
