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

let currentUnitName = null;
let currentUnitData = null;

// Initialize page
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    loadUnitFromParams();
  } else {
    Navigation.goToLogin();
  }
});

function loadUnitFromParams() {
  // Get unit name from URL parameters or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const unitName = urlParams.get('unit') || localStorage.getItem('selectedUnit');
  
  if (!unitName) {
    NotificationManager.showToast('No unit selected');
    Navigation.goToMainPage();
    return;
  }
  
  currentUnitName = unitName;
  document.getElementById('unit-title').textContent = unitName;
  document.getElementById('unit-title-header').textContent = unitName;
  
  loadUnitLessons(unitName);
}
function loadUnitLessons(unitName) {
  console.log('Loading unit:', unitName); // Debug log
  db.ref('units/' + unitName).once('value')
    .then(snapshot => {
      if (!snapshot.exists()) {
        console.log('Unit not found in database'); // Debug log
        NotificationManager.showToast('Unit not found');
        Navigation.goToMainPage();
        return;
      }
      
      currentUnitData = snapshot.val();
      console.log('Unit data loaded:', currentUnitData); // Debug log
      renderLessons();
    })
    .catch(error => {
      console.error('Error loading unit:', error);
      NotificationManager.showToast('Error loading unit: ' + error.message);
    });
}

function renderLessons() {
  console.log('Rendering lessons for unit data:', currentUnitData); // Debug log
  
  const container = document.getElementById('lessons-grid');
  container.innerHTML = '';
  
  if (!currentUnitData) {
    console.log('No unit data available'); // Debug log
    container.innerHTML = '<p>No lessons available in this unit.</p>';
    return;
  }
  
  // Get all keys that are lessons (not metadata like 'name', 'description', etc.)
  const lessonKeys = Object.keys(currentUnitData).filter(key => {
    const item = currentUnitData[key];
    const isLesson = typeof item === 'object' && 
      item !== null &&
      (item.videoURL || item.videoFile);
    console.log(`Checking key "${key}":`, item, 'Is lesson:', isLesson); // Debug log
    return isLesson;
  });
  
  console.log('Found lesson keys:', lessonKeys); // Debug log
  
  if (lessonKeys.length === 0) {
    container.innerHTML = '<p>No lessons available in this unit.</p>';
    return;
  }
  
  lessonKeys.forEach(lessonKey => {
    const lesson = currentUnitData[lessonKey];
    const lessonCard = createLessonCard(lessonKey, lesson);
    container.appendChild(lessonCard);
  });
}

function createLessonCard(lessonKey, lessonData) {
  const card = document.createElement('div');
  card.className = 'lesson-card';
  
  const thumbnail = lessonData.thumbnailURL || '';
  const description = lessonData.description || 'No description available.';
  
  card.innerHTML = `
    <img src="${thumbnail}" alt="${lessonKey}" class="lesson-thumbnail" onerror="this.style.display='none'">
    <div class="lesson-title">${lessonKey}</div>
    <div class="lesson-description">${description}</div>
  `;
  
  card.onclick = () => playLesson(lessonKey, lessonData);
  
  return card;
}

function playLesson(lessonKey, lessonData) {
  console.log('playLesson called with:', lessonKey, lessonData); // Debug
  
  const videoFile = lessonData.videoURL || lessonData.videoFile;
  
  if (!videoFile) {
    NotificationManager.showToast('No video available for this lesson');
    return;
  }
  
  // Show loading message
  document.getElementById('video-title').textContent = 'Loading: ' + lessonKey;
  document.getElementById('video-container').style.display = 'block';
  
  // Get video URL from Firebase Storage
  storage.ref('videos/' + videoFile).getDownloadURL()
    .then(url => {
      console.log('Video URL loaded:', url); // Debug
      
      const videoPlayer = document.getElementById('video-player');
      videoPlayer.src = url;
      document.getElementById('video-title').textContent = lessonKey;
      
      // Remove any existing event listeners to prevent duplicates
      const newPlayer = videoPlayer.cloneNode(true);
      videoPlayer.parentNode.replaceChild(newPlayer, videoPlayer);
      
      console.log('About to initialize custom video player'); // Debug
      
      // Initialize custom video player
      initCustomVideoPlayer(newPlayer, lessonKey);
      
      // Scroll to video
      document.getElementById('video-container').scrollIntoView({ 
        behavior: 'smooth' 
      });
    })
    .catch(error => {
      console.error('Error loading video:', error);
      NotificationManager.showToast('Error loading video: ' + error.message);
      document.getElementById('video-container').style.display = 'none';
    });
}

function closeVideo() {
  const videoPlayer = document.getElementById('video-player');
  
  // Save current position before closing
  if (currentUnitName && videoPlayer.src) {
    const lessonKey = document.getElementById('video-title').textContent;
    ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, videoPlayer.currentTime);
  }
  
  videoPlayer.pause();
  videoPlayer.src = '';
  document.getElementById('video-container').style.display = 'none';
}

function goBack() {
  Navigation.goToMainPage();
}

// Custom Video Player Functions
function initCustomVideoPlayer(videoPlayer, lessonKey) {
  console.log('initCustomVideoPlayer called with:', videoPlayer, lessonKey); // Debug
  
  let lastTapTime = 0;
  let savePositionInterval;
  
  // Load saved video position (async)
  console.log('Loading video position for:', currentUnitName, lessonKey); // Debug
  
  ProgressTracker.getVideoPosition(currentUnitName, lessonKey)
    .then(savedPosition => {
      console.log('Saved position loaded:', savedPosition); // Debug
      
      if (savedPosition > 0) {
        videoPlayer.addEventListener('loadedmetadata', function() {
          console.log('Setting video position to:', savedPosition); // Debug
          videoPlayer.currentTime = savedPosition;
          NotificationManager.showToast(`Resumed from ${formatTime(savedPosition)}`);
        });
      }
    })
    .catch(error => {
      console.error('Error loading video position:', error);
    });
  
  // Save video position every 5 seconds
  videoPlayer.addEventListener('play', function() {
    savePositionInterval = setInterval(() => {
      ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, videoPlayer.currentTime);
    }, 5000);
  });
  
  videoPlayer.addEventListener('pause', function() {
    clearInterval(savePositionInterval);
    ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, videoPlayer.currentTime);
  });
  
  // Mark lesson as completed when video ends
  videoPlayer.addEventListener('ended', function() {
    clearInterval(savePositionInterval);
    ProgressTracker.markLessonCompleted(currentUnitName, lessonKey);
    ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, 0); // Reset position
    NotificationManager.showToast('Lesson completed! 🎉');
  });
  
  // Disable default video keyboard shortcuts
  videoPlayer.addEventListener('keydown', function(e) {
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Keyboard controls - use capture phase to override browser defaults
  const keydownHandler = function(e) {
    console.log('Key pressed:', e.key, 'Video container visible:', document.getElementById('video-container').style.display); // Debug
    
    if (document.getElementById('video-container').style.display === 'block') {
      console.log('Processing key for video player:', e.key); // Debug
      
      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          e.stopImmediatePropagation();
          skipForward(videoPlayer, 5);
          return false;
        case 'ArrowLeft':
          e.preventDefault();
          e.stopImmediatePropagation();
          skipBackward(videoPlayer, 5);
          return false;
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          e.stopImmediatePropagation();
          togglePlayPause(videoPlayer);
          return false;
        case 'f':
        case 'F':
          e.preventDefault();
          e.stopImmediatePropagation();
          toggleFullscreen(videoPlayer);
          return false;
        case 'm':
        case 'M':
          e.preventDefault();
          e.stopImmediatePropagation();
          toggleMute(videoPlayer);
          return false;
      }
    }
  };
  
  // Remove any existing handlers and add new one with capture
  document.removeEventListener('keydown', keydownHandler, true);
  document.addEventListener('keydown', keydownHandler, true);
  
  // Touch controls for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  
  videoPlayer.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    // Double tap detection
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      const videoRect = videoPlayer.getBoundingClientRect();
      const tapX = touch.clientX - videoRect.left;
      const videoWidth = videoRect.width;
      
      if (tapX > videoWidth * 0.6) {
        // Double tap on right side - forward 5 seconds
        skipForward(videoPlayer, 5);
        showSkipIndicator('forward');
      } else if (tapX < videoWidth * 0.4) {
        // Double tap on left side - backward 5 seconds
        skipBackward(videoPlayer, 5);
        showSkipIndicator('backward');
      }
      
      e.preventDefault();
    }
    
    lastTapTime = currentTime;
  });
  
  // Swipe controls
  videoPlayer.addEventListener('touchend', function(e) {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Only process swipes that are primarily horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - forward 10 seconds
        skipForward(videoPlayer, 10);
        showSkipIndicator('forward');
      } else {
        // Swipe left - backward 10 seconds
        skipBackward(videoPlayer, 10);
        showSkipIndicator('backward');
      }
      e.preventDefault();
    }
  });
}

function skipForward(videoPlayer, seconds) {
  videoPlayer.currentTime = Math.min(videoPlayer.currentTime + seconds, videoPlayer.duration);
  NotificationManager.showToast(`⏩ +${seconds}s`);
}

function skipBackward(videoPlayer, seconds) {
  videoPlayer.currentTime = Math.max(videoPlayer.currentTime - seconds, 0);
  NotificationManager.showToast(`⏪ -${seconds}s`);
}

function togglePlayPause(videoPlayer) {
  if (videoPlayer.paused) {
    videoPlayer.play();
    NotificationManager.showToast('▶️ Play');
  } else {
    videoPlayer.pause();
    NotificationManager.showToast('⏸️ Pause');
  }
}

function toggleFullscreen(videoPlayer) {
  if (!document.fullscreenElement) {
    videoPlayer.requestFullscreen();
    NotificationManager.showToast('🔲 Fullscreen');
  } else {
    document.exitFullscreen();
    NotificationManager.showToast('🔳 Exit Fullscreen');
  }
}

function toggleMute(videoPlayer) {
  videoPlayer.muted = !videoPlayer.muted;
  NotificationManager.showToast(videoPlayer.muted ? '🔇 Muted' : '🔊 Unmuted');
}

function showSkipIndicator(direction) {
  // Create visual indicator for mobile skip
  const indicator = document.createElement('div');
  indicator.className = 'skip-indicator';
  indicator.textContent = direction === 'forward' ? '⏩ +5s' : '⏪ -5s';
  indicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 18px;
    z-index: 9999;
    pointer-events: none;
  `;
  
  document.body.appendChild(indicator);
  
  setTimeout(() => {
    document.body.removeChild(indicator);
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}