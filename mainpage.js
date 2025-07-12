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
        
        snapshot.forEach(unitSnap => {
          const unitName = unitSnap.key;
          const unitData = unitSnap.val();
          
          // Calculate progress for this unit
          const progress = calculateUnitProgress(unitName, unitData, userProgress);
          
          const li = document.createElement('li');
          li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span>${unitName}</span>
              <span style="font-size: 12px; color: #666; margin-left: 8px;">
                ${progress.completed}/${progress.total} lessons
                ${progress.percentage > 0 ? `(${progress.percentage}%)` : ''}
              </span>
            </div>
          `;
          
          li.onclick = () => {
            // Navigate to unit detail page
            localStorage.setItem('selectedUnit', unitName);
            window.location.href = `unitdetail.html?unit=${encodeURIComponent(unitName)}`;
          };
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
      li.textContent = unitName;
      li.onclick = () => {
        // Navigate to unit detail page
        localStorage.setItem('selectedUnit', unitName);
        window.location.href = `unitdetail.html?unit=${encodeURIComponent(unitName)}`;
      };
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
      <div>${lessonKey}</div>
    `;
    card.onclick = () => showLessonDetails(lessonKey);
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

window.openProgress = function() {
  Navigation.goToProgress();
};

firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {
    // If no user is logged in, send them back to login
    window.location.href = "index.html";
  }
});

document.getElementById('fullscreen-video').addEventListener('contextmenu', e => e.preventDefault());
document.getElementById('fullscreen-video').addEventListener('dragstart', e => e.preventDefault());

