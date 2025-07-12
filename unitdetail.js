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
  const volumeBtn = document.getElementById('volume-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const currentTimeSpan = document.getElementById('current-time');
  const durationSpan = document.getElementById('duration');
  const speedSelect = document.getElementById('speed-select');
  const qualitySelect = document.getElementById('quality-select');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const videoWrapper = document.querySelector('.video-player-wrapper');
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
  const selectedLesson = urlParams.get('lesson') || localStorage.getItem('selectedLesson');
  
  if (!unitName) {
    NotificationManager.showToast('No unit selected');
    Navigation.goToMainPage();
    return;
  }
  
  currentUnitName = unitName;
  document.getElementById('unit-title').textContent = unitName;
  document.getElementById('unit-title-header').textContent = unitName;
  
  loadUnitLessons(unitName, selectedLesson);
}
function loadUnitLessons(unitName, selectedLesson = null) {
  console.log('Loading unit:', unitName, 'Selected lesson:', selectedLesson); // Debug log
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
      renderLessons(selectedLesson);
    })
    .catch(error => {
      console.error('Error loading unit:', error);
      NotificationManager.showToast('Error loading unit: ' + error.message);
    });
}

function renderLessons(selectedLesson = null) {
  console.log('Rendering lessons for unit data:', currentUnitData, 'Auto-select:', selectedLesson); // Debug log
  
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
  
  // Auto-select lesson if specified (from search results)
  if (selectedLesson && lessonKeys.includes(selectedLesson)) {
    console.log('Auto-selecting lesson:', selectedLesson);
    // Small delay to ensure card is rendered
    setTimeout(() => {
      const lessonButton = document.querySelector(`[data-lesson="${selectedLesson}"]`);
      if (lessonButton) {
        lessonButton.click();
      }
      // Clear the selected lesson from localStorage
      localStorage.removeItem('selectedLesson');
    }, 100);
  }
}

function createLessonCard(lessonKey, lessonData) {
  const card = document.createElement('div');
  card.className = 'lesson-card';
  card.setAttribute('data-lesson', lessonKey); // Add data attribute for selection
  
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
  console.log('playLesson called with:', lessonKey, lessonData);

  // Always close any previous video player before opening a new one
  closeVideo();

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
      console.log('Video URL loaded:', url);

      const videoPlayer = document.getElementById('video-player');
      videoPlayer.src = url;
      document.getElementById('video-title').textContent = lessonKey;

      // Initialize custom video player
      console.log('About to initialize custom video player...');
      initCustomVideoPlayer(videoPlayer, lessonKey);
      console.log('Custom video player initialization completed');

      // Scroll to video
      document.getElementById('video-container').scrollIntoView({ 
        behavior: 'smooth' 
      });

      // Auto-play the video
      videoPlayer.play().catch(error => {
        console.log('Autoplay prevented:', error);
      });
    })
    .catch(error => {
      console.error('Error loading video:', error);
      NotificationManager.showToast('Error loading video: ' + error.message);
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
  console.log('initCustomVideoPlayer called with:', videoPlayer, lessonKey);
  
  let savePositionInterval;
  let isMouseOverControls = false;
  let controlsTimeout;
  let lastTapTime = 0;
  
  // Get control elements
  const customControls = document.getElementById('custom-controls');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const progressBar = document.getElementById('progress-bar');
  const progressFilled = document.getElementById('progress-filled');
  const progressHandle = document.getElementById('progress-handle');
  const volumeBtn = document.getElementById('volume-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const currentTimeSpan = document.getElementById('current-time');
  const durationSpan = document.getElementById('duration');
  const speedSelect = document.getElementById('speed-select');
  const qualitySelect = document.getElementById('quality-select');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const videoWrapper = document.querySelector('.video-player-wrapper');
  
  // Debug: Check if elements exist
  console.log('Control elements:', {
    customControls: !!customControls,
    playPauseBtn: !!playPauseBtn,
    progressBar: !!progressBar,
    progressFilled: !!progressFilled,
    progressHandle: !!progressHandle
  });
  
  // Check if essential elements exist
  if (!customControls || !playPauseBtn || !videoWrapper) {
    console.error('Essential video control elements not found!');
    return;
  }
  
  // Ensure controls are visible and clickable
  customControls.style.pointerEvents = 'auto';
  customControls.style.zIndex = '100';
  
  // Disable native video controls
  videoPlayer.controls = false;
  videoPlayer.disablePictureInPicture = true;
  
  // Load saved video position
  ProgressTracker.getVideoPosition(currentUnitName, lessonKey)
    .then(savedPosition => {
      if (savedPosition > 0) {
        videoPlayer.addEventListener('loadedmetadata', function() {
          videoPlayer.currentTime = savedPosition;
          NotificationManager.showToast(`Resumed from ${formatTime(savedPosition)}`);
        });
      }
    })
    .catch(error => console.error('Error loading video position:', error));
  
  // Save video position periodically
  videoPlayer.addEventListener('play', function() {
    savePositionInterval = setInterval(() => {
      ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, videoPlayer.currentTime);
    }, 5000);
  });
  
  videoPlayer.addEventListener('pause', function() {
    clearInterval(savePositionInterval);
    ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, videoPlayer.currentTime);
  });
  
  // Mark lesson complete on end
  videoPlayer.addEventListener('ended', function() {
    clearInterval(savePositionInterval);
    ProgressTracker.markLessonCompleted(currentUnitName, lessonKey);
    ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, 0);
    NotificationManager.showToast('Lesson completed! 🎉');
    
    // Reset video for replay
    videoPlayer.currentTime = 0;
    playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow';
  });
  
  // Play/Pause button
  playPauseBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Play/pause button clicked! Video state:', {
      paused: videoPlayer.paused,
      ended: videoPlayer.ended,
      currentTime: videoPlayer.currentTime
    });
    
    try {
      if (videoPlayer.paused || videoPlayer.ended) {
        if (videoPlayer.ended) {
          videoPlayer.currentTime = 0;
        }
        videoPlayer.play().catch(error => {
          console.log('Play error:', error);
        });
      } else {
        videoPlayer.pause();
      }
    } catch (error) {
      console.error('Error in play/pause handler:', error);
    }
  });
  
  // Update play/pause icon
  videoPlayer.addEventListener('play', function() {
    playPauseBtn.querySelector('.material-icons').textContent = 'pause';
  });
  
  videoPlayer.addEventListener('pause', function() {
    playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow';
  });
  
  // Progress bar functionality
  videoPlayer.addEventListener('timeupdate', function() {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressFilled.style.width = progress + '%';
    progressHandle.style.left = progress + '%';
    currentTimeSpan.textContent = formatTime(videoPlayer.currentTime);
  });
  
  videoPlayer.addEventListener('loadedmetadata', function() {
    durationSpan.textContent = formatTime(videoPlayer.duration);
  });
  
  // Progress bar click/drag
  progressBar.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Progress bar clicked!');
    
    try {
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoPlayer.currentTime = pos * videoPlayer.duration;
    } catch (error) {
      console.error('Error in progress bar handler:', error);
    }
  });
  
  // Volume controls
  let previousVolume = 1.0; // Store previous volume level
  
  volumeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Volume button clicked!');
    
    try {
      if (videoPlayer.muted || videoPlayer.volume === 0) {
        videoPlayer.muted = false;
        videoPlayer.volume = previousVolume;
        volumeBtn.querySelector('.material-icons').textContent = 'volume_up';
        volumeSlider.value = previousVolume * 100;
      } else {
        previousVolume = videoPlayer.volume;
        videoPlayer.muted = true;
        videoPlayer.volume = 0;
        volumeBtn.querySelector('.material-icons').textContent = 'volume_off';
        volumeSlider.value = 0;
      }
    } catch (error) {
      console.error('Error in volume handler:', error);
    }
  });
  
  volumeSlider.addEventListener('input', function() {
    const newVolume = this.value / 100;
    videoPlayer.volume = newVolume;
    videoPlayer.muted = false;
    
    if (newVolume > 0) {
      previousVolume = newVolume;
      volumeBtn.querySelector('.material-icons').textContent = 'volume_up';
    } else {
      volumeBtn.querySelector('.material-icons').textContent = 'volume_off';
    }
  });
  
  // Speed control
  speedSelect.addEventListener('change', function() {
    videoPlayer.playbackRate = parseFloat(this.value);
    localStorage.setItem('playbackSpeed', this.value);
    showVideoToast(`Speed: ${this.value}x`);
  });
  
  // Load saved speed
  const savedSpeed = localStorage.getItem('playbackSpeed') || '1';
  speedSelect.value = savedSpeed;
  videoPlayer.playbackRate = parseFloat(savedSpeed);
  
  // Quality control - basic implementation
  qualitySelect.addEventListener('change', function() {
    const newQuality = this.value;
    localStorage.setItem('videoQuality', newQuality);
    
    // Save current time
    const currentTime = videoPlayer.currentTime;
    const isPaused = videoPlayer.paused;
    
    // Apply quality setting (basic implementation)
    if (newQuality === '720p') {
      showVideoToast('Quality set to 720p');
    } else if (newQuality === '480p') {
      showVideoToast('Quality set to 480p');
    } else if (newQuality === '360p') {
      showVideoToast('Quality set to 360p');
    } else {
      showVideoToast('Quality set to Auto');
    }
    
    // Restore playback position
  });
  
  // Load saved quality
  const savedQuality = localStorage.getItem('videoQuality') || 'auto';
  qualitySelect.value = savedQuality;
  
  // Settings menu toggle
  settingsBtn.addEventListener('click', function() {
    settingsMenu.classList.toggle('show');
  });
  
  // Close settings when clicking outside
  document.addEventListener('click', function(e) {
    if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
      settingsMenu.classList.remove('show');
    }
  });
  
  // Fullscreen functionality
  fullscreenBtn.addEventListener('click', function() {
    if (!document.fullscreenElement) {
      videoWrapper.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  });
  
  // Fullscreen change events
  document.addEventListener('fullscreenchange', function() {
    if (document.fullscreenElement) {
      fullscreenBtn.querySelector('.material-icons').textContent = 'fullscreen_exit';
    } else {
      fullscreenBtn.querySelector('.material-icons').textContent = 'fullscreen';
    }
  });
  
  // Controls visibility
  function showControls() {
    console.log('showControls called');
    customControls.classList.add('visible');
    clearTimeout(controlsTimeout);
  }
  
  function hideControls() {
    console.log('hideControls called, isMouseOverControls:', isMouseOverControls, 'videoPlayer.paused:', videoPlayer.paused);
    if (!isMouseOverControls && !videoPlayer.paused) {
      customControls.classList.remove('visible');
    }
  }
  
  function resetControlsTimeout() {
    console.log('resetControlsTimeout called');
    showControls();
    controlsTimeout = setTimeout(hideControls, 3000);
  }
  
  // Mouse/touch events for controls
  videoWrapper.addEventListener('mousemove', function() {
    console.log('Video wrapper mousemove');
    resetControlsTimeout();
  });
  
  customControls.addEventListener('mouseenter', function() {
    console.log('Custom controls mouseenter');
    isMouseOverControls = true;
    showControls();
  });
  
  customControls.addEventListener('mouseleave', function() {
    console.log('Custom controls mouseleave');
    isMouseOverControls = false;
    resetControlsTimeout();
  });
  
  // Show controls initially
  resetControlsTimeout();
  
  // Debug: Add click test to video wrapper
  videoWrapper.addEventListener('click', function(e) {
    if (e.target === videoWrapper || e.target === videoPlayer) {
      console.log('Video wrapper/player clicked - should toggle play/pause');
      playPauseBtn.click();
    }
  });
  
  // Keyboard controls
  document.addEventListener('keydown', function(e) {
    if (document.getElementById('video-container').style.display === 'block') {
      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          videoPlayer.currentTime += 5;
          showVideoToast('Forward 5s');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoPlayer.currentTime -= 5;
          showVideoToast('Backward 5s');
          break;
        case ' ':
          e.preventDefault();
          if (videoPlayer.paused) videoPlayer.play();
          else videoPlayer.pause();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          fullscreenBtn.click();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          volumeBtn.click();
          break;
      }
    }
  });
  
  // Touch controls for mobile (simple version)
  videoWrapper.addEventListener('touchend', function(e) {
    if (e.touches.length === 0) {
      // Single touch end - toggle play/pause
      if (videoPlayer.paused) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }
  });
}

// Helper function to format time
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Video toast function for fullscreen notifications
function showVideoToast(message, duration = 3000) {
  const videoToast = document.getElementById('video-toast');
  if (!videoToast) return;
  
  videoToast.textContent = message;
  videoToast.style.display = 'block';
  videoToast.style.opacity = '1';
  
  setTimeout(() => {
    videoToast.style.opacity = '0';
    setTimeout(() => {
      videoToast.style.display = 'none';
    }, 300);
  }, duration);
}