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

// Initialize Advanced Features
let advancedFeatures = null;

let currentUnitName = null;
let currentUnitData = null;
let currentVideoPlayerCleanup = null;

// Initialize page
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // Initialize Advanced Features
    if (typeof AdvancedFeatures !== 'undefined') {
      advancedFeatures = new AdvancedFeatures();
      advancedFeatures.applyFeatures();
    }
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
    <div class="lesson-actions" style="margin-top: 12px; display: flex; gap: 8px;">
      <button class="lesson-action-btn" onclick="event.stopPropagation(); playLesson('${lessonKey}', ${JSON.stringify(lessonData).replace(/"/g, '&quot;')})">
        <span class="material-icons">play_arrow</span>
        Play
      </button>
      <button class="lesson-action-btn files-btn" onclick="event.stopPropagation(); openStudentFileViewer('${currentUnitName}', '${lessonKey}')">
        <span class="material-icons">folder</span>
        Files
      </button>
    </div>
  `;
  
  // Remove the onclick from the card since we now have specific buttons
  // card.onclick = () => playLesson(lessonKey, lessonData);
  
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
  
  // Get current user email for watermark
  const currentUser = firebase.auth().currentUser;
  const userEmail = currentUser ? currentUser.email : 'Unknown Student';
  
  // Show modal and loading message
  document.getElementById('video-title').textContent = lessonKey;
  document.getElementById('video-description-text').textContent = lessonData.description || 'No description available for this lesson.';
  document.getElementById('video-modal').style.display = 'flex';
  
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
  
  // Get video URL from Firebase Storage
  storage.ref('videos/' + videoFile).getDownloadURL()
    .then(url => {
      console.log('Video URL loaded:', url);
      
      const videoPlayer = document.getElementById('video-player');
      videoPlayer.src = url;
      
      // Add watermark overlay to video
      addVideoWatermark(userEmail, lessonKey);
      
      // Initialize custom video player
      initCustomVideoPlayer(videoPlayer, lessonKey);
      
      // Auto-play the video
      videoPlayer.play().catch(error => {
        console.log('Autoplay prevented:', error);
      });
    })
    .catch(error => {
      console.error('Error loading video:', error);
      NotificationManager.showToast('Error loading video: ' + error.message);
      closeVideoModal(); // Close modal on error
    });
}

function closeVideo() {
  closeVideoModal();
}

function closeVideoModal() {
  const videoPlayer = document.getElementById('video-player');
  
  // Clean up current video player
  if (currentVideoPlayerCleanup) {
    currentVideoPlayerCleanup();
    currentVideoPlayerCleanup = null;
  }
  
  // Remove watermark overlay
  const watermarkOverlay = document.getElementById('videoWatermarkOverlay');
  if (watermarkOverlay) {
    watermarkOverlay.remove();
  }
  
  // Save current position before closing
  if (currentUnitName && videoPlayer.src) {
    const lessonKey = document.getElementById('video-title').textContent;
    ProgressTracker.saveVideoPosition(currentUnitName, lessonKey, videoPlayer.currentTime);
  }
  
  videoPlayer.pause();
  videoPlayer.src = '';
  document.getElementById('video-modal').style.display = 'none';
  
  // Restore body scrolling
  document.body.style.overflow = '';
}

function addVideoWatermark(userEmail, lessonKey) {
  // Remove existing watermark if any
  const existingWatermark = document.getElementById('videoWatermarkOverlay');
  if (existingWatermark) {
    existingWatermark.remove();
  }
  
  // Create watermark overlay
  const watermarkOverlay = document.createElement('div');
  watermarkOverlay.id = 'videoWatermarkOverlay';
  watermarkOverlay.style.cssText = `
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
      transparent 300px,
      rgba(255, 255, 255, 0.03) 300px,
      rgba(255, 255, 255, 0.03) 350px
    );
  `;
  
  // Add watermark elements
  watermarkOverlay.innerHTML = `
    <!-- Top right watermark -->
    <div style="
      position: absolute;
      top: 15px;
      right: 15px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 11px;
      font-weight: bold;
      background: rgba(0, 0, 0, 0.4);
      padding: 4px 8px;
      border-radius: 4px;
      backdrop-filter: blur(2px);
      font-family: 'Segoe UI', Arial, sans-serif;
    ">
      ${userEmail}
    </div>
    
    <!-- Bottom left watermark -->
    <div style="
      position: absolute;
      bottom: 40px;
      left: 15px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 9px;
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 3px;
      backdrop-filter: blur(1px);
      font-family: 'Segoe UI', Arial, sans-serif;
    ">
      ${new Date().toLocaleString()}
    </div>
    
    <!-- Center subtle watermark -->
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      color: rgba(255, 255, 255, 0.08);
      font-size: 24px;
      font-weight: bold;
      font-family: 'Segoe UI', Arial, sans-serif;
      text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      user-select: none;
      pointer-events: none;
    ">
      ${lessonKey}
    </div>
  `;
  
  // Find the video container and add watermark
  const videoContainer = document.querySelector('.video-modal-content');
  if (videoContainer) {
    videoContainer.style.position = 'relative';
    videoContainer.appendChild(watermarkOverlay);
  }
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
  
  // Volume icon and progress updater
  function updateVolumeDisplay(volume) {
    const volumeSliderContainer = document.querySelector('.volume-slider-container');
    const progressWidth = volume + '%';
    
    // Update visual progress bar
    volumeSliderContainer.style.setProperty('--volume-progress', progressWidth);
    
    // Update volume icon based on volume level
    const volumeIcon = volumeBtn.querySelector('.material-icons');
    if (volumeIcon) {
      if (videoPlayer.muted || volume === 0) {
        volumeIcon.textContent = 'volume_off';
      } else if (volume < 30) {
        volumeIcon.textContent = 'volume_mute';  
      } else if (volume < 70) {
        volumeIcon.textContent = 'volume_down';
      } else {
        volumeIcon.textContent = 'volume_up';
      }
    }
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
  let isDragging = false;
  const progressContainer = document.querySelector('.progress-container');
  
  const progressBarHandler = function(e) {
    if (!videoPlayer.duration) return; // Don't handle if video not loaded
    
    // Use the progress container for more accurate positioning
    const rect = progressContainer.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    
    // Calculate position relative to the container
    const containerLeft = rect.left;
    const containerWidth = rect.width;
    const clickX = clientX - containerLeft;
    
    // Calculate position as percentage (0 to 1)
    const pos = Math.max(0, Math.min(clickX / containerWidth, 1));
    const newTime = pos * videoPlayer.duration;
    
    console.log('Progress bar clicked:', {
      clientX, 
      containerLeft, 
      containerWidth, 
      clickX, 
      pos, 
      newTime, 
      duration: videoPlayer.duration
    }); // Debug log
    
    videoPlayer.currentTime = newTime;
    
    // Update progress handle position immediately
    progressHandle.style.left = (pos * 100) + '%';
    progressFilled.style.width = (pos * 100) + '%';
    
    // Show current time in toast
    showVideoToast(`Seek to ${formatTime(newTime)}`);
  };
  
  const progressBarMouseDown = function(e) {
    isDragging = true;
    progressContainer.classList.add('dragging');
    progressBarHandler(e);
    e.preventDefault();
    e.stopPropagation();
  };
  
  const progressBarMouseMove = function(e) {
    if (isDragging) {
      progressBarHandler(e);
      e.preventDefault();
    }
  };
  
  const progressBarMouseUp = function() {
    isDragging = false;
    progressContainer.classList.remove('dragging');
  };
  
  const progressBarTouchStart = function(e) {
    isDragging = true;
    progressContainer.classList.add('dragging');
    progressBarHandler(e);
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any touch timers to prevent interference with video touch controls
    clearTimeout(touchTimeout);
  };
  
  const progressBarTouchMove = function(e) {
    if (isDragging) {
      progressBarHandler(e);
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  const progressBarTouchEnd = function(e) {
    isDragging = false;
    progressContainer.classList.remove('dragging');
    e.stopPropagation();
  };
  
  // Add event listeners only to progress container for better control
  addEventListenerWithCleanup(progressContainer, 'mousedown', progressBarMouseDown);
  addEventListenerWithCleanup(progressContainer, 'click', progressBarHandler);
  addEventListenerWithCleanup(progressContainer, 'touchstart', progressBarTouchStart);
  addEventListenerWithCleanup(document, 'mousemove', progressBarMouseMove);
  addEventListenerWithCleanup(document, 'mouseup', progressBarMouseUp);
  addEventListenerWithCleanup(document, 'touchmove', progressBarTouchMove);
  addEventListenerWithCleanup(document, 'touchend', progressBarTouchEnd);
  
  // Volume controls
  const volumeBtnHandler = function() {
    if (videoPlayer.muted) {
      videoPlayer.muted = false;
      showVideoToast('UnMuted 🔊');
      volumeSlider.value = videoPlayer.volume * 100;
      updateVolumeDisplay(videoPlayer.volume * 100);
    } else {
      videoPlayer.muted = true;
      showVideoToast('Muted 🔇');
      updateVolumeDisplay(0);
    }
  };
  addEventListenerWithCleanup(volumeBtn, 'click', volumeBtnHandler);
  
  const volumeSliderHandler = function() {
    const volume = this.value;
    videoPlayer.volume = volume / 100;
    videoPlayer.muted = false;
    updateVolumeDisplay(volume);
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
  
  // Mobile orientation handler
  function handleMobileOrientation() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && document.fullscreenElement) {
      // Try to lock orientation to landscape on mobile when in fullscreen
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(err => {
          console.log('Orientation lock not supported or failed:', err);
        });
      }
    }
  }
  
  // Fullscreen change events
  const fullscreenChangeHandler = function() {
    if (document.fullscreenElement) {
      fullscreenBtn.querySelector('.material-icons').textContent = 'fullscreen_exit';
      handleMobileOrientation();
    } else {
      fullscreenBtn.querySelector('.material-icons').textContent = 'fullscreen';
      // Unlock orientation when exiting fullscreen
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    }
  };
  addEventListenerWithCleanup(document, 'fullscreenchange', fullscreenChangeHandler);
  
  // Orientation change handler for mobile
  const orientationChangeHandler = function() {
    handleMobileOrientation();
  };
  addEventListenerWithCleanup(window, 'orientationchange', orientationChangeHandler);
  
  // Mouse/touch events for controls
  let cursorHideTimeout;
  
  const mouseMoveHandler = function() {
    // Show cursor and controls
    videoWrapper.style.cursor = 'default';
    resetControlsTimeout();
    
    // Clear existing cursor hide timeout
    clearTimeout(cursorHideTimeout);
    
    // Set timeout to hide cursor after 3 seconds of no movement
    cursorHideTimeout = setTimeout(() => {
      videoWrapper.style.cursor = 'none';
      customControls.classList.remove('visible');
      // Also hide controls when cursor is hidden
      if (!isMouseOverControls) {
        customControls.classList.remove('visible');
      }
    }, 3000);
  };
  addEventListenerWithCleanup(videoWrapper, 'mousemove', mouseMoveHandler);
  
  // Show cursor when mouse enters video area
  const mouseEnterVideoHandler = function() {
    videoWrapper.style.cursor = 'default';
    clearTimeout(cursorHideTimeout);
  };
  addEventListenerWithCleanup(videoWrapper, 'mouseenter', mouseEnterVideoHandler);
  
  // Hide cursor when mouse leaves video area
  const mouseLeaveVideoHandler = function() {
    videoWrapper.style.cursor = 'default';
    clearTimeout(cursorHideTimeout);
    if (!isMouseOverControls) {
      customControls.classList.remove('visible');
    }
  };
  addEventListenerWithCleanup(videoWrapper, 'mouseleave', mouseLeaveVideoHandler);
  
  const videoWrapperClickHandler = function(e) {
    // Only handle clicks on video itself, not on controls, and not on mobile
    const isMobile = window.innerWidth <= 768;
    if (!isMobile && (e.target === videoWrapper || e.target === videoPlayer)) {
      if (videoPlayer.ended) {
        // If video ended, restart from beginning
        videoPlayer.currentTime = 0;
        videoPlayer.play();
      } else if (videoPlayer.paused) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }
  };
  addEventListenerWithCleanup(videoWrapper, 'click', videoWrapperClickHandler);

  const mouseEnterHandler = function() {
    isMouseOverControls = true;
    // Show cursor when over controls
    videoWrapper.style.cursor = 'default';
    clearTimeout(cursorHideTimeout);
    showControls();
  };
  addEventListenerWithCleanup(customControls, 'mouseenter', mouseEnterHandler);

  const mouseLeaveHandler = function() {
    isMouseOverControls = false;
    // Start cursor hide timer when leaving controls
    cursorHideTimeout = setTimeout(() => {
      videoWrapper.style.cursor = 'none';
      customControls.classList.remove('visible');
    }, 3000);
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
    if (document.getElementById('video-modal').style.display === 'flex') {
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
  
  // Touch controls for mobile with double-tap seeking
  let lastTouchTime = 0;
  let lastTouchX = 0;
  let touchTimeout;
  
  const touchEndHandler = function(e) {
    // Don't handle touches on controls or progress bar
    if (customControls.contains(e.target) || progressContainer.contains(e.target)) {
      return;
    }
    
    // Only handle touches on video itself
    if ((e.target === videoWrapper || e.target === videoPlayer)) {
      if (e.changedTouches && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTouchTime;
        const touchX = touch.clientX;
        const isMobile = window.innerWidth <= 768 || !!document.fullscreenElement;
        
        console.log('Touch detected:', {
          isMobile, 
          timeDiff, 
          touchX, 
          isFullscreen: !!document.fullscreenElement,
          target: e.target.tagName
        }); // Debug log
        
        // Check if this is a double-tap (within 400ms)
        if (timeDiff < 400 && timeDiff > 50 ) {
          // Clear any pending single-tap action
          clearTimeout(touchTimeout);
          
          // Determine if tap was on left or right side of video
          const videoRect = videoWrapper.getBoundingClientRect();
          const videoCenter = videoRect.left + videoRect.width / 2;
          
          console.log('Double-tap detected:', {
            touchX, 
            videoCenter, 
            isFullscreen: !!document.fullscreenElement,
            side: touchX < videoCenter ? 'left' : 'right'
          }); // Debug log
          
          if (touchX < videoCenter) {
            // Double-tap on left side - seek backward 5 seconds
            videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 5);
            showVideoToast('⏪ Backward 5s');
          } else {
            // Double-tap on right side - seek forward 5 seconds
            videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 5);
            showVideoToast('⏩ Forward 5s');
          }
          
          // Reset touch tracking
          lastTouchTime = 0;
          lastTouchX = 0;
          
          // Prevent default behavior and stop propagation
          e.preventDefault();
          e.stopPropagation();
          return; // Exit early to prevent single-tap handling
        } else {
          // This could be a single tap - wait to see if there's a second tap
          lastTouchTime = currentTime;
          lastTouchX = touchX;
          
          // Set timeout for single-tap action (play/pause)
          touchTimeout = setTimeout(() => {
            console.log('Single tap - toggling play/pause');
            if (videoPlayer.ended) {
              // If video ended, restart from beginning
              videoPlayer.currentTime = 0;
              videoPlayer.play();
            } else if (videoPlayer.paused) {
              videoPlayer.play();
            } else {
              videoPlayer.pause();
            }
          }, 400);
        }
      }
    }
  };
  
  // Add touch event listeners to video wrapper only
  addEventListenerWithCleanup(videoWrapper, 'touchend', touchEndHandler);
  
  // Show controls initially
  resetControlsTimeout();
  
  // Initialize cursor state for desktop
  const isMobile = window.innerWidth <= 768;
  if (!isMobile) {
    // On desktop, start cursor hide timer
    cursorHideTimeout = setTimeout(() => {
      videoWrapper.style.cursor = 'none';
      customControls.classList.remove('visible');
    }, 3000);
  }
  
  // Load and set saved volume - delay to ensure video is ready
  setTimeout(() => {
    const savedVolume = localStorage.getItem('videoVolume');
    if (savedVolume !== null) {
      const volume = parseFloat(savedVolume);
      if (volume >= 0 && volume <= 100) {
        videoPlayer.volume = volume / 100;
        volumeSlider.value = volume;
        updateVolumeDisplay(volume);
        console.log('Restored volume:', volume);
      }
    }
  }, 100);
  
  // Initialize volume display
  updateVolumeDisplay(videoPlayer.volume * 100);
  
  // Add volumechange event listener to ensure icon updates and save volume
  const volumeChangeHandler = function() {
    const currentVolume = videoPlayer.muted ? 0 : videoPlayer.volume * 100;
    updateVolumeDisplay(currentVolume);
    
    // Save volume to localStorage (but not when muted)
    if (!videoPlayer.muted && videoPlayer.volume > 0) {
      localStorage.setItem('videoVolume', videoPlayer.volume * 100);
    }
  };
  addEventListenerWithCleanup(videoPlayer, 'volumechange', volumeChangeHandler);
  
  // Create cleanup function
  currentVideoPlayerCleanup = function() {
    console.log('Cleaning up video player...');
    
    // Clear all intervals and timeouts
    clearInterval(savePositionInterval);
    clearTimeout(controlsTimeout);
    clearTimeout(videoToastTimeout);
    clearTimeout(cursorHideTimeout);
    
    // Remove all event listeners
    eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    eventListeners.length = 0;
    
    // Reset control states
    customControls.classList.remove('visible');
    settingsMenu.classList.remove('show');
    
    // Reset cursor
    if (videoWrapper) {
      videoWrapper.style.cursor = 'default';
    }
    
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

// ========= STUDENT FILE VIEWER FUNCTIONS =========

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
  const dbPath = lessonKey ? 
    `units/${unitKey}/lessons/${lessonKey}/files` : 
    `units/${unitKey}/files`;
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      filesList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <span class="material-icons" style="font-size: 48px; color: #ddd; margin-bottom: 16px;">folder_open</span>
          <div>No files available for this lesson</div>
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
            ${canPreview ? `<button onclick="previewStudentFile('${file.id}', '${unitKey}', '${lessonKey}')" style="flex: 1; padding: 6px 12px; background: #6c4fc1; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;">
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

function previewStudentFile(fileId, unitKey, lessonKey) {
  const dbPath = lessonKey ? 
    `units/${unitKey}/lessons/${lessonKey}/files/${fileId}` : 
    `units/${unitKey}/files/${fileId}`;
  
  db.ref(dbPath).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      alert('File not found');
      return;
    }
    
    const file = snapshot.val();
    showStudentFilePreview(file);
  }).catch(error => {
    console.error('Error loading file:', error);
    alert('Error loading file');
  });
}

function showStudentFilePreview(file) {
  // Get current user email for watermark
  const currentUser = firebase.auth().currentUser;
  const userEmail = currentUser ? currentUser.email : 'Unknown Student';
  
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
          <div id="secureDocViewer" style="
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
          <div id="secureTextViewer" style="
            font-family: monospace;
            white-space: pre-wrap;
            color: black;
            position: relative;
            z-index: 1;
            user-select: text;
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
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
          ${file.access === 'downloadable' ? `<button onclick="downloadStudentFile('${file.url}', '${file.name}')" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span class="material-icons" style="font-size: 14px;">download</span>
            Download
          </button>` : ''}
          <button onclick="closeStudentFilePreview()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;">&times;</button>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; overflow-y: auto; max-height: calc(90vh - 100px);">
        ${previewContent}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Add spinner animation
  const spinnerStyle = document.createElement('style');
  spinnerStyle.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(spinnerStyle);
  
  // Handle secure content loading
  if (file.extension.toLowerCase() === 'pdf') {
    loadSecurePDFContent(file.url, userEmail);
  } else if (file.extension.toLowerCase() === 'txt') {
    loadSecureTextContent(file.url, userEmail);
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

function closeStudentFilePreview() {
  const modal = document.getElementById('studentFilePreviewModal');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
}

// Secure content loading functions
function loadSecurePDFContent(url, userEmail) {
  // This is a simplified secure PDF viewer
  // In a real implementation, you would process the PDF server-side
  // and return only the text content or rendered images
  const viewer = document.getElementById('secureDocViewer');
  if (!viewer) return;
  
  viewer.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #666;">
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 600px; border-left: 4px solid #6c4fc1;">
        <h3 style="color: #6c4fc1; margin-top: 0;">Secure Document Viewer</h3>
        <p style="color: #666; margin-bottom: 20px;">This document is being viewed in secure mode. The original file cannot be downloaded or copied.</p>
        <div style="background: white; padding: 15px; border-radius: 4px; text-align: left; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 14px; color: #333; line-height: 1.6;">
            <strong>Document: ${url.split('/').pop()}</strong><br>
            <em>Content preview is not available in this demo version.</em><br><br>
            In a production environment, this would show the actual document content<br>
            processed through a secure server-side renderer that prevents direct<br>
            access to the original file while displaying the content.
          </div>
        </div>
        <div style="margin-top: 20px; font-size: 12px; color: #999;">
          Viewed by: ${userEmail} | ${new Date().toLocaleString()}
        </div>
      </div>
    </div>
  `;
}

function loadSecureTextContent(url, userEmail) {
  const viewer = document.getElementById('secureTextViewer');
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
          user-select: ${file.access === 'view-only' ? 'none' : 'text'};
          -webkit-user-select: ${file.access === 'view-only' ? 'none' : 'text'};
          -moz-user-select: ${file.access === 'view-only' ? 'none' : 'text'};
          -ms-user-select: ${file.access === 'view-only' ? 'none' : 'text'};
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

function downloadStudentFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Security measures for file viewing
function addSecurityMeasures() {
  // Disable right-click context menu on secure content
  document.addEventListener('contextmenu', function(e) {
    const modal = document.getElementById('studentFilePreviewModal');
    if (modal) {
      e.preventDefault();
    }
  });
  
  // Disable keyboard shortcuts for developer tools and saving
  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('studentFilePreviewModal');
    if (modal) {
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
    const modal = document.getElementById('studentFilePreviewModal');
    if (modal && e.key === 'PrintScreen') {
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
    const modal = document.getElementById('studentFilePreviewModal');
    if (modal) {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          // Close the modal if developer tools are detected
          closeStudentFilePreview();
          alert('Developer tools detected. File preview has been closed for security reasons.');
        }
      } else {
        devtools.open = false;
      }
    }
  }, 500);
}

// Modal event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Close modal when clicking outside the video content
  const videoModal = document.getElementById('video-modal');
  if (videoModal) {
    videoModal.addEventListener('click', function(e) {
      if (e.target === videoModal) {
        closeVideoModal();
      }
    });
  }
  
  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('video-modal').style.display === 'flex') {
      closeVideoModal();
    }
  });
  
  // Initialize security measures
  addSecurityMeasures();
});

// Security measures for file viewing
function addSecurityMeasures() {
  // Disable right-click context menu on secure content
  document.addEventListener('contextmenu', function(e) {
    const modal = document.getElementById('studentFilePreviewModal');
    if (modal && modal.style.display === 'block') {
      e.preventDefault();
    }
  });
  
  // Disable keyboard shortcuts for developer tools and saving
  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('studentFilePreviewModal');
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
    const modal = document.getElementById('studentFilePreviewModal');
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
    const modal = document.getElementById('studentFilePreviewModal');
    if (modal && modal.style.display === 'block') {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          // Close the modal if developer tools are detected
          closeStudentFilePreview();
          alert('Developer tools detected. File preview has been closed for security reasons.');
        }
      } else {
        devtools.open = false;
      }
    }
  }, 500);
}