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
let currentVideoPlayerCleanup = null;

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
  
  // Clean up previous video player if exists
  if (currentVideoPlayerCleanup) {
    currentVideoPlayerCleanup();
    currentVideoPlayerCleanup = null;
  }
  
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
      initCustomVideoPlayer(videoPlayer, lessonKey);
      
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
  
  // Clean up current video player
  if (currentVideoPlayerCleanup) {
    currentVideoPlayerCleanup();
    currentVideoPlayerCleanup = null;
  }
  
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
  let videoToastTimeout;
  
  // Arrays to store event listeners for cleanup
  const eventListeners = [];
  const addEventListenerWithCleanup = (element, event, handler, options) => {
    element.addEventListener(event, handler, options);
    eventListeners.push({ element, event, handler, options });
  };
  
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
  const videoToast = document.getElementById('video-toast');
  
  // Video Toast Manager
  function showVideoToast(message, duration = 2000) {
    clearTimeout(videoToastTimeout);
    videoToast.textContent = message;
    videoToast.style.display = 'block';
    videoToast.style.opacity = '1';
    
    videoToastTimeout = setTimeout(() => {
      videoToast.style.opacity = '0';
      setTimeout(() => {
        videoToast.style.display = 'none';
      }, 300);
    }, duration);
  }
  
  // Controls visibility functions
  function showControls() {
    customControls.classList.add('visible');
    clearTimeout(controlsTimeout);
  }
  
  function hideControls() {
    if (!isMouseOverControls && !videoPlayer.paused) {
      customControls.classList.remove('visible');
    }
  }
  
  function resetControlsTimeout() {
    showControls();
    controlsTimeout = setTimeout(hideControls, 3000);
  }
  
  // Load saved video position
  ProgressTracker.getVideoPosition(currentUnitName, lessonKey)
    .then(savedPosition => {
      if (savedPosition > 0) {
        const loadedMetadataHandler = function() {
          videoPlayer.currentTime = savedPosition;
          showVideoToast(`Resumed from ${formatTime(savedPosition)}`);
        };
        addEventListenerWithCleanup(videoPlayer, 'loadedmetadata', loadedMetadataHandler);
      }
    })
    .catch(error => console.error('Error loading video position:', error));
  
  // Save video position periodically
  const playHandler = function() {
    savePositionInterval = setInterval(() => {
      ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, videoPlayer.currentTime);
    }, 5000);
    playPauseBtn.querySelector('.material-icons').textContent = 'pause';
  };
  addEventListenerWithCleanup(videoPlayer, 'play', playHandler);
  
  const pauseHandler = function() {
    clearInterval(savePositionInterval);
    ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, videoPlayer.currentTime);
    playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow';
  };
  addEventListenerWithCleanup(videoPlayer, 'pause', pauseHandler);
  
  // Mark lesson complete on end
  const endedHandler = function() {
    clearInterval(savePositionInterval);
    ProgressTracker.markLessonCompleted(currentUnitName, lessonKey);
    ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, 0);
    showVideoToast('Lesson completed! 🎉', 3000);
    // Update play button icon to show replay
    playPauseBtn.querySelector('.material-icons').textContent = 'replay';
  };
  addEventListenerWithCleanup(videoPlayer, 'ended', endedHandler);
  
  // Play/Pause button
  const playPauseHandler = function() {
    if (videoPlayer.paused) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  };
  addEventListenerWithCleanup(playPauseBtn, 'click', playPauseHandler);
  
  // Progress bar functionality
  const timeUpdateHandler = function() {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressFilled.style.width = progress + '%';
    progressHandle.style.left = progress + '%';
    currentTimeSpan.textContent = formatTime(videoPlayer.currentTime);
  };
  addEventListenerWithCleanup(videoPlayer, 'timeupdate', timeUpdateHandler);
  
  const loadedMetadataHandler = function() {
    durationSpan.textContent = formatTime(videoPlayer.duration);
  };
  addEventListenerWithCleanup(videoPlayer, 'loadedmetadata', loadedMetadataHandler);
  
  // Progress bar click/drag
  const progressBarHandler = function(e) {
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoPlayer.currentTime = pos * videoPlayer.duration;
  };
  addEventListenerWithCleanup(progressBar, 'click', progressBarHandler);
  
  // Volume controls
  const volumeBtnHandler = function() {
    if (videoPlayer.muted) {
      videoPlayer.muted = false;
      showVideoToast('UnMuted 🔊');
      volumeBtn.querySelector('.material-icons').textContent = 'volume_up';
      volumeSlider.value = videoPlayer.volume * 100;
    } else {
      videoPlayer.muted = true;
      showVideoToast('Muted 🔇');
      volumeBtn.querySelector('.material-icons').textContent = 'volume_off';
    }
  };
  addEventListenerWithCleanup(volumeBtn, 'click', volumeBtnHandler);
  
  const volumeSliderHandler = function() {
    videoPlayer.volume = this.value / 100;
    videoPlayer.muted = false;
    volumeBtn.querySelector('.material-icons').textContent = this.value > 0 ? 'volume_up' : 'volume_off';
  };
  addEventListenerWithCleanup(volumeSlider, 'input', volumeSliderHandler);
  
  // Speed control
  const speedSelectHandler = function() {
    videoPlayer.playbackRate = parseFloat(this.value);
    localStorage.setItem('playbackSpeed', this.value);
    showVideoToast(`Speed: ${this.value}x`);
  };
  addEventListenerWithCleanup(speedSelect, 'change', speedSelectHandler);
  
  // Load saved speed
  const savedSpeed = localStorage.getItem('playbackSpeed') || '1';
  speedSelect.value = savedSpeed;
  videoPlayer.playbackRate = parseFloat(savedSpeed);
  
  // Quality control (placeholder - would need actual implementation)
  const qualitySelectHandler = function() {
    localStorage.setItem('videoQuality', this.value);
    showVideoToast(`Quality: ${this.value === 'auto' ? 'Auto' : this.value + 'p'}`);
  };
  addEventListenerWithCleanup(qualitySelect, 'change', qualitySelectHandler);
  
  // Load saved quality
  const savedQuality = localStorage.getItem('videoQuality') || 'auto';
  qualitySelect.value = savedQuality;
  
  // Settings menu toggle
  const settingsBtnHandler = function() {
    settingsMenu.classList.toggle('show');
  };
  addEventListenerWithCleanup(settingsBtn, 'click', settingsBtnHandler);
  
  // Close settings when clicking outside
  const documentClickHandler = function(e) {
    if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
      settingsMenu.classList.remove('show');
    }
  };
  addEventListenerWithCleanup(document, 'click', documentClickHandler);
  
  // Fullscreen functionality
  const fullscreenHandler = function() {
    if (!document.fullscreenElement) {
      videoWrapper.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };
  addEventListenerWithCleanup(fullscreenBtn, 'click', fullscreenHandler);
  
  // Fullscreen change events
  const fullscreenChangeHandler = function() {
    if (document.fullscreenElement) {
      fullscreenBtn.querySelector('.material-icons').textContent = 'fullscreen_exit';
    } else {
      fullscreenBtn.querySelector('.material-icons').textContent = 'fullscreen';
    }
  };
  addEventListenerWithCleanup(document, 'fullscreenchange', fullscreenChangeHandler);
  
  // Mouse/touch events for controls
  const mouseMoveHandler = function() {
    resetControlsTimeout();
  };
  addEventListenerWithCleanup(videoWrapper, 'mousemove', mouseMoveHandler);
  
  const videoWrapperClickHandler = function(e) {
    // Only toggle play/pause if clicked on video itself, not on controls
    if (e.target === videoWrapper || e.target === videoPlayer) {
      if (videoPlayer.paused) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }
  };
  addEventListenerWithCleanup(videoWrapper, 'click', videoWrapperClickHandler);

  const mouseEnterHandler = function() {
    isMouseOverControls = true;
    showControls();
  };
  addEventListenerWithCleanup(customControls, 'mouseenter', mouseEnterHandler);

  const mouseLeaveHandler = function() {
    isMouseOverControls = false;
    resetControlsTimeout();
  };
  addEventListenerWithCleanup(customControls, 'mouseleave', mouseLeaveHandler);

  // Prevent click events on controls from bubbling to video wrapper
  const controlsClickHandler = function(e) {
    e.stopPropagation();
  };
  addEventListenerWithCleanup(customControls, 'click', controlsClickHandler);
  
  // Keyboard controls
  const keydownHandler = function(e) {
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
          if (videoPlayer.ended) {
            // If video ended, restart from beginning
            videoPlayer.currentTime = 0;
            videoPlayer.play();
          } else if (videoPlayer.paused) {
            videoPlayer.play();
          } else {
            videoPlayer.pause();
          }
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
  };
  addEventListenerWithCleanup(document, 'keydown', keydownHandler);
  
  // Touch controls for mobile (simple version)
  const touchEndHandler = function(e) {
    // Only toggle play/pause if touched on video itself, not on controls
    if (e.target === videoWrapper || e.target === videoPlayer) {
      if (e.touches.length === 0) {
        // Single touch end - toggle play/pause
        if (videoPlayer.paused) {
          videoPlayer.play();
        } else {
          videoPlayer.pause();
        }
      }
    }
  };
  addEventListenerWithCleanup(videoWrapper, 'touchend', touchEndHandler);
  
  // Show controls initially
  resetControlsTimeout();
  
  // Create cleanup function
  currentVideoPlayerCleanup = function() {
    console.log('Cleaning up video player...');
    
    // Clear all intervals and timeouts
    clearInterval(savePositionInterval);
    clearTimeout(controlsTimeout);
    clearTimeout(videoToastTimeout);
    
    // Remove all event listeners
    eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    eventListeners.length = 0;
    
    // Reset control states
    customControls.classList.remove('visible');
    settingsMenu.classList.remove('show');
    
    // Hide video toast
    videoToast.style.display = 'none';
    videoToast.style.opacity = '0';
    
    // Reset video player state
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    
    console.log('Video player cleanup completed');
  };
}

// Helper function to format time
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}


function getLanguageName(code) {
    const languages = {
      'en': 'English',
      'ar': 'Arabic',
      'auto': 'Auto-generated'
    };
    return languages[code] || code;
  }