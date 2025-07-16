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

// Cache management
const CacheManager = {
  // Cache duration in milliseconds (24 hours)
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  
  // Cache keys
  CACHE_KEYS: {
    UNITS: 'cached_units',
    LESSONS: 'cached_lessons',
    PROGRESS: 'cached_progress',
    ASSIGNMENTS: 'cached_assignments',
    QUIZZES: 'cached_quizzes'
  },
  
  // Set cache with timestamp
  setCache: function(key, data) {
    const cacheData = {
      timestamp: Date.now(),
      data: data
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
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
      console.error('Error parsing cache:', error);
      localStorage.removeItem(key);
      return null;
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
  },
  
  // Force refresh cache
  forceRefresh: function(key, fetchFunction) {
    this.clearCache(key);
    return fetchFunction();
  }
};

// Load units into drawer with caching
function loadUnits() {
  // Try to load from cache first
  const cachedUnits = CacheManager.getCache(CacheManager.CACHE_KEYS.UNITS);
  const cachedProgress = CacheManager.getCache(CacheManager.CACHE_KEYS.PROGRESS);
  
  if (cachedUnits && cachedProgress) {
    console.log('Loading units from cache');
    displayUnits(cachedUnits, cachedProgress);
    return;
  }
  
  console.log('Loading units from database');
  
  // Load user progress first, then units
  ProgressTracker.getUserProgress()
    .then(userProgress => {
      // Cache progress
      CacheManager.setCache(CacheManager.CACHE_KEYS.PROGRESS, userProgress);
      
      return db.ref('units').once('value').then(snapshot => {
        const unitsData = snapshot.val();
        
        // Cache units data
        CacheManager.setCache(CacheManager.CACHE_KEYS.UNITS, unitsData);
        
        displayUnits(unitsData, userProgress);
      });
    })
    .catch(error => {
      console.error('Error loading units with progress:', error);
      // Fallback to loading units without progress
      loadUnitsWithoutProgress();
    });
}

// Display units in the drawer
function displayUnits(unitsData, userProgress) {
  const unitsList = document.getElementById('units-list');
  
  // Clear the units list
  unitsList.innerHTML = '';
  
  // Add Teacher Dashboard for teachers
  addTeacherDashboardIfApplicable();
  
  if (unitsData) {
    Object.keys(unitsData).forEach(unitName => {
      const unitData = unitsData[unitName];
      
      // Calculate progress for this unit
      const progress = calculateUnitProgress(unitName, unitData, userProgress);
      
      const li = document.createElement('li');
      li.onclick = () => goToUnit(unitName);
      li.innerHTML = `
        <div class="unit-item">
          <div class="unit-info">
            <div class="unit-name">${unitName}</div>
            <div class="unit-progress">
              ${progress.completed}/${progress.total} lessons
              ${progress.percentage > 0 ? `(${progress.percentage}%)` : ''}
            </div>
          </div>
          <button class="unit-files-btn" onclick="event.stopPropagation(); openStudentFileViewer('${unitName}', null)" style="margin: 0%; width: 50%;">
            <span class="material-icons">folder</span>
            Files
          </button>
        </div>
      `;
      
      unitsList.appendChild(li);
    });
  }
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
  // Try to load from cache first
  const cachedUnits = CacheManager.getCache(CacheManager.CACHE_KEYS.UNITS);
  
  if (cachedUnits) {
    console.log('Loading units from cache (no progress)');
    displayUnitsWithoutProgress(cachedUnits);
    return;
  }
  
  console.log('Loading units from database (no progress)');
  
  db.ref('units').once('value').then(snapshot => {
    const unitsData = snapshot.val();
    
    // Cache units data
    CacheManager.setCache(CacheManager.CACHE_KEYS.UNITS, unitsData);
    
    displayUnitsWithoutProgress(unitsData);
  });
}

function displayUnitsWithoutProgress(unitsData) {
  const unitsList = document.getElementById('units-list');
  
  // Clear the units list
  unitsList.innerHTML = '';
  
  if (unitsData) {
    Object.keys(unitsData).forEach(unitName => {
      const li = document.createElement('li');
      li.onclick = () => goToUnit(unitName);
      li.innerHTML = `
        <div class="unit-item">
          <div class="unit-info">
            <div class="unit-name">${unitName}</div>
          </div>
          <button class="unit-files-btn" onclick="event.stopPropagation(); openStudentFileViewer('${unitName}', null)" style="margin: 0%; width: 50%;">
            <span class="material-icons">folder</span>
            Files
          </button>
        </div>
      `;
      unitsList.appendChild(li);
    });
  }
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
        <button class="lesson-action-btn files-btn" onclick="event.stopPropagation(); openStudentFileViewer('${currentUnit}', '${lessonKey}')" style="flex: 1; padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
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

  // Add moving watermark with user email
  vjsPlayer.ready(function() {
    addVideoWatermark();
    vjsPlayer.play();
    if (vjsPlayer.requestFullscreen) {
      vjsPlayer.requestFullscreen();
      // Try to lock orientation to landscape
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    }
  });

  // Track video completion for progress
  vjsPlayer.on('ended', function() {
    // Mark lesson as completed when video ends
    if (window.currentUnitId && window.currentLessonId) {
      ProgressTracker.markLessonCompleted(window.currentUnitId, window.currentLessonId);
      NotificationManager.showToast('Lesson completed! 🎉');
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

// Add moving watermark to video player
function addVideoWatermark() {
  if (!vjsPlayer) return;
  
  const currentUser = firebase.auth().currentUser;
  const userEmail = currentUser ? currentUser.email : 'Unknown User';
  
  // Remove existing watermark if any
  const existingWatermark = document.querySelector('.video-watermark-overlay');
  if (existingWatermark) {
    existingWatermark.remove();
  }
  
  // Create watermark overlay
  const watermarkOverlay = document.createElement('div');
  watermarkOverlay.className = 'video-watermark-overlay';
  watermarkOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `;
  
  // Create moving watermark element
  const watermark = document.createElement('div');
  watermark.className = 'moving-watermark';
  watermark.textContent = userEmail;
  watermark.style.cssText = `
    position: absolute;
    color: rgba(255, 255, 255, 0.6);
    font-size: 16px;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    white-space: nowrap;
    user-select: none;
    animation: moveWatermark 15s linear infinite;
  `;
  
  // Add CSS animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes moveWatermark {
      0% { 
        top: 10%; 
        left: 10%; 
        transform: rotate(0deg); 
      }
      25% { 
        top: 20%; 
        left: 80%; 
        transform: rotate(-15deg); 
      }
      50% { 
        top: 70%; 
        left: 70%; 
        transform: rotate(15deg); 
      }
      75% { 
        top: 80%; 
        left: 20%; 
        transform: rotate(-10deg); 
      }
      100% { 
        top: 10%; 
        left: 10%; 
        transform: rotate(0deg); 
      }
    }
  `;
  
  document.head.appendChild(style);
  watermarkOverlay.appendChild(watermark);
  document.body.appendChild(watermarkOverlay);
  
  // Clean up watermark when video ends or is closed
  vjsPlayer.on('dispose', function() {
    if (watermarkOverlay && watermarkOverlay.parentNode) {
      watermarkOverlay.parentNode.removeChild(watermarkOverlay);
    }
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
  });
  
  // Handle fullscreen changes
  const handleFullscreenChange = () => {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    if (isFullscreen) {
      watermarkOverlay.style.position = 'fixed';
      watermarkOverlay.style.zIndex = '9999';
    } else {
      watermarkOverlay.style.position = 'fixed';
      watermarkOverlay.style.zIndex = '9999';
    }
  };
  
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
}

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
  
  // Initialize security measures for file viewing (removed for simplified implementation)
});

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

// Student file viewer functions
function openStudentFileViewer(unitKey, lessonKey) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'studentFileViewerModal';
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
        <button onclick="closeStudentFileViewer()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div id="studentFilesList" style="min-height: 200px;">
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
  loadStudentFiles(unitKey, lessonKey);
}

function closeStudentFileViewer() {
  const modal = document.getElementById('studentFileViewerModal');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
}

function loadStudentFiles(unitKey, lessonKey) {
  const filesList = document.getElementById('studentFilesList');
  
  if (lessonKey) {
    // Load lesson files
    loadStudentLessonFiles(unitKey, lessonKey);
  } else {
    // Load unit files
    loadStudentUnitFiles(unitKey);
  }
}

function loadStudentUnitFiles(unitKey) {
  const filesList = document.getElementById('studentFilesList');
  const dbPath = `units/${unitKey}/files`;
  
  console.log('Loading student unit files from path:', dbPath);
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      console.log('No unit files found at path:', dbPath);
      filesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; color: #ddd; margin-bottom: 16px;">folder_open</span>
          <div>No unit files available</div>
          <div style="font-size: 12px; color: #999; margin-top: 8px;">Unit files will appear here once uploaded by your teacher</div>
        </div>
      `;
      return;
    }
    
    const files = [];
    snapshot.forEach(child => {
      const fileData = child.val();
      fileData.id = child.key;
      console.log('Found student unit file:', child.key, fileData);
      
      // Only show files that students can access (not restricted)
      if (fileData.access !== 'restricted') {
        files.push(fileData);
      }
    });
    
    if (files.length === 0) {
      filesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; color: #ddd; margin-bottom: 16px;">folder_open</span>
          <div>No unit files available for students</div>
        </div>
      `;
      return;
    }
    
    // Sort files by upload date (newest first)
    files.sort((a, b) => b.uploadedAt - a.uploadedAt);
    
    displayStudentUnitFiles(files, unitKey);
  }).catch(error => {
    console.error('Error loading student unit files:', error);
    filesList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">error</span>
        <div>Error loading unit files</div>
      </div>
    `;
  });
}

function displayStudentUnitFiles(files, unitKey) {
  const filesList = document.getElementById('studentFilesList');
  
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">';
  
  files.forEach(file => {
    const fileIcon = getStudentFileIcon(file.extension);
    const fileSize = formatStudentFileSize(file.size);
    const uploadDate = new Date(file.uploadedAt).toLocaleDateString();
    const canDownload = file.access === 'downloadable';
    const canPreview = canStudentPreviewFile(file.extension);
    
    html += `
      <div class="student-file-card" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; transition: all 0.2s ease;">
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
          <span class="student-access-badge ${file.access}">${file.access === 'view-only' ? 'View Only' : 'Downloadable'}</span>
        </div>
        
        <div style="display: flex; gap: 8px;">
          ${canPreview ? `<button onclick="previewStudentFile('${file.id}', '${unitKey}', null)" style="flex: 1; padding: 6px 12px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;">
            <span class="material-icons" style="font-size: 14px;">visibility</span>
            Preview
          </button>` : ''}
          
          ${canDownload ? `<button onclick="downloadStudentFile('${file.url}', '${file.name}')" style="flex: 1; padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;">
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
}

function previewStudentFile(fileId, unitKey, lessonKey) {
  const dbPath = lessonKey ? 
    `units/${unitKey}/lesson${lessonKey}/files/${fileId}` : 
    `units/${unitKey}/files/${fileId}`;
  
  console.log('Loading student file for preview from path:', dbPath);
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      console.log('File not found at path:', dbPath);
      alert('File not found');
      return;
    }
    
    const file = snapshot.val();
    showStudentFilePreview(file);
  }).catch(error => {
    console.error('Error loading student file:', error);
    alert('Error loading file preview');
  });
}

function getStudentFileIcon(extension) {
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

function formatStudentFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function canStudentPreviewFile(extension) {
  const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'txt'];
  return previewableTypes.includes(extension.toLowerCase());
}

function downloadStudentFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function createSecureProxy(originalUrl) {
  // Create a secure proxy to hide the original URL
  const proxyData = {
    url: originalUrl,
    timestamp: Date.now(),
    user: firebase.auth().currentUser?.email || 'anonymous'
  };
  
  // Store in session storage with encrypted key
  const proxyKey = btoa(Date.now().toString()).replace(/[^a-zA-Z0-9]/g, '');
  sessionStorage.setItem('proxy_' + proxyKey, btoa(JSON.stringify(proxyData)));
  
  // Return obfuscated URL
  return `viewer_readonly.html?p=${proxyKey}&t=${Date.now()}`;
}

function showStudentFilePreview(file) {
  const modal = document.createElement('div');
  modal.id = 'studentFilePreviewModal';
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

  // Only handle PDF files with the readonly viewer
  if (file.extension.toLowerCase() === 'pdf') {
    // Use secure proxy to hide original URL
    const secureViewerUrl = createSecureProxy(file.url);
    
    modal.innerHTML = `
      <div style="background: #333; border-radius: 12px; max-width: 95vw; max-height: 95vh; width: 100%; height: 100%; position: relative; overflow: hidden;">
        <div style="background: #444; padding: 16px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px 12px 0 0;">
          <h3 style="margin: 0; color: white; font-size: 18px;">📄 ${file.name}</h3>
          <div style="display: flex; gap: 10px;">
            <button onclick="toggleStudentFilePreviewFullscreen()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%;" title="Toggle Fullscreen">⛶</button>
            <button onclick="closeStudentFilePreview()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">&times;</button>
          </div>
        </div>
        <iframe src="${secureViewerUrl}" style="width: 100%; height: 85%; border: none; background: white;" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>
      </div>
    `;
  } else {
    // For non-PDF files, show a simple preview or download option
    modal.innerHTML = `
      <div style="background: #333; border-radius: 12px; max-width: 90vw; max-height: 90vh; width: 100%; position: relative; overflow: hidden;">
        <div style="background: #444; padding: 16px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px 12px 0 0;">
          <h3 style="margin: 0; color: white; font-size: 18px;">📄 ${file.name}</h3>
          <button onclick="closeStudentFilePreview()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">&times;</button>
        </div>
        <div style="padding: 40px; text-align: center; color: white;">
          <span class="material-icons" style="font-size: 48px; margin-bottom: 16px;">insert_drive_file</span>
          <div style="margin-bottom: 20px;">Preview not available for this file type</div>
          ${file.access === 'downloadable' ? `
            <button onclick="downloadStudentFile('${file.url}', '${file.name}')" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
              <span class="material-icons" style="font-size: 18px;">download</span>
              Download File
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function closeStudentFilePreview() {
  const modal = document.getElementById('studentFilePreviewModal');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
}

// Fullscreen functionality
let isStudentFilePreviewFullscreen = false;

function toggleStudentFilePreviewFullscreen() {
  const modal = document.getElementById('studentFilePreviewModal');
  const appbar = document.querySelector('.appbar');
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isStudentFilePreviewFullscreen) {
    // Enter fullscreen
    if (isMobile) {
      // For mobile - force horizontal orientation
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(e => console.log('Orientation lock failed:', e));
      }
    }
    
    // Request fullscreen on the modal
    if (modal.requestFullscreen) {
      modal.requestFullscreen().catch(e => console.log('Fullscreen failed:', e));
    } else if (modal.webkitRequestFullscreen) {
      modal.webkitRequestFullscreen();
    } else if (modal.msRequestFullscreen) {
      modal.msRequestFullscreen();
    }
    
    // Hide the appbar
    if (appbar) {
      appbar.style.display = 'none';
    }
    
    // Update modal content styling for fullscreen
    const modalContent = modal.querySelector('div[style*="background: #333"]');
    if (modalContent) {
      modalContent.style.cssText = 'background: #333; border-radius: 12px; width: 100%; height: 100%; position: relative; overflow: hidden;';
    }
    
    // Remove modal padding in fullscreen
    modal.style.padding = '0%';
    
    // Ensure controls are visible in fullscreen on all devices
    const iframe = modal.querySelector('iframe');
    if (iframe) {
      // Add a small delay to ensure fullscreen is active
      setTimeout(() => {
        // Force landscape orientation on mobile after fullscreen
        if (isMobile && screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(e => console.log('Orientation lock retry failed:', e));
        }
        
        // Add PDF navigation controls for fullscreen
        addStudentPDFNavigationControls(modal);
      }, 500);
    }
    
    isStudentFilePreviewFullscreen = true;
    
    // Update button text
    const fullscreenBtn = modal.querySelector('button[onclick="toggleStudentFilePreviewFullscreen()"]');
    if (fullscreenBtn) {
      fullscreenBtn.textContent = '❐';
    }
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    // Show the appbar
    if (appbar) {
      appbar.style.display = 'flex';
    }
    
    // Restore original modal content styling
    const modalContent = modal.querySelector('div[style*="background: #333"]');
    if (modalContent) {
      modalContent.style.cssText = 'background: #333; border-radius: 12px; max-width: 95vw; max-height: 95vh; width: 100%; height: 100%; position: relative; overflow: hidden;';
    }
    
    // Restore modal padding
    modal.style.padding = '20px';
    
    // Unlock orientation when exiting fullscreen on mobile
    if (isMobile && screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
    
    // Remove PDF navigation controls
    removeStudentPDFNavigationControls();
    
    isStudentFilePreviewFullscreen = false;

    modal.style.padding = '0%';
    
    // Update button text
    const fullscreenBtn = modal.querySelector('button[onclick="toggleStudentFilePreviewFullscreen()"]');
    if (fullscreenBtn) {
      fullscreenBtn.textContent = '⛶';
    }
  }
}

// PDF Navigation Controls for student file viewer
function addStudentPDFNavigationControls(modal) {
  // Add controls for all devices when in fullscreen
  if (!isStudentFilePreviewFullscreen) {
    return;
  }
  
  // Remove existing controls if any
  removeStudentPDFNavigationControls();
  
  // Find the header section in the modal
  const headerSection = modal.querySelector('div[style*="background: #444"]');
  if (!headerSection) {
    console.log('Header section not found');
    return;
  }
  
  // Find the button container in the header
  const buttonContainer = headerSection.querySelector('div[style*="display: flex; gap: 10px"]');
  if (!buttonContainer) {
    console.log('Button container not found');
    return;
  }
  
  // Create navigation controls container
  const navControls = document.createElement('div');
  navControls.id = 'studentPdfNavigationControls';
  navControls.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: 10px;
  `;
  
  // Create previous page button
  const prevBtn = document.createElement('button');
  prevBtn.id = 'studentPdfPrevBtn';
  prevBtn.innerHTML = '◀';
  prevBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  `;
  
  // Create next page button
  const nextBtn = document.createElement('button');
  nextBtn.id = 'studentPdfNextBtn';
  nextBtn.innerHTML = '▶';
  nextBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  `;
  
  // Add hover effects
  const addHoverEffects = (btn) => {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.3)';
      btn.style.transform = 'scale(1.1)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.2)';
      btn.style.transform = 'scale(1)';
    });
  };
  
  addHoverEffects(prevBtn);
  addHoverEffects(nextBtn);
  
  // Add click handlers that trigger the iframe's navigation
  prevBtn.addEventListener('click', () => {
    const iframe = modal.querySelector('iframe');
    if (iframe) {
      try {
        // Try to trigger the previous button in the iframe
        iframe.contentWindow.postMessage({ 
          type: 'navigate', 
          action: 'previous' 
        }, '*');
      } catch (e) {
        console.log('Failed to navigate to previous page:', e);
      }
    }
  });
  
  nextBtn.addEventListener('click', () => {
    const iframe = modal.querySelector('iframe');
    if (iframe) {
      try {
        // Try to trigger the next button in the iframe
        iframe.contentWindow.postMessage({ 
          type: 'navigate', 
          action: 'next' 
        }, '*');
      } catch (e) {
        console.log('Failed to navigate to next page:', e);
      }
    }
  });
  
  // Add touch handlers for mobile
  const addTouchHandlers = (btn, action) => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btn.style.background = 'rgba(255, 255, 255, 0.3)';
      btn.style.transform = 'scale(1.1)';
      btn.click();
    });
    
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.style.background = 'rgba(255, 255, 255, 0.2)';
      btn.style.transform = 'scale(1)';
    });
  };
  
  addTouchHandlers(prevBtn, 'prev');
  addTouchHandlers(nextBtn, 'next');
  
  // Add buttons to navigation controls
  navControls.appendChild(prevBtn);
  navControls.appendChild(nextBtn);
  
  // Insert navigation controls before the existing button container
  headerSection.insertBefore(navControls, buttonContainer);
}

function removeStudentPDFNavigationControls() {
  const navControls = document.getElementById('studentPdfNavigationControls');
  if (navControls) {
    navControls.remove();
  }
}

// Open assignments and quizzes page
function openAssignments() {
  window.location.href = "student-assignments.html";
}
