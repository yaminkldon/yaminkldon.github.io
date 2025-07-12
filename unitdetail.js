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
    if (!isMouseOverControls) {
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
  let lastMouseX = -1;
  let lastMouseY = -1;
  const mouseMoveHandler = function(e) {
    // Only reset timeout if mouse actually moved from initial position
    if (lastMouseX === -1 && lastMouseY === -1) {
      // First time, just store position
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    } else if (e.clientX !== lastMouseX || e.clientY !== lastMouseY) {
      // Mouse actually moved, show controls
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      resetControlsTimeout();
    }
  };
  addEventListenerWithCleanup(videoWrapper, 'mousemove', mouseMoveHandler);
  
  // Add mouse leave event to hide controls when cursor leaves video
  const mouseLeaveVideoHandler = function() {
    if (!isMouseOverControls) {
      hideControls();
    }
  };
  addEventListenerWithCleanup(videoWrapper, 'mouseleave', mouseLeaveVideoHandler);
  
  const videoWrapperClickHandler = function(e) {
    // Only handle clicks on video itself, not on controls, and not on mobile
    const isMobile = window.innerWidth <= 768;
    if (!isMobile && (e.target === videoWrapper || e.target === videoPlayer)) {
      // Check if this is a programmatic click from touch events
      if (e.isTrusted && e.detail === 1) {
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
          
          // Set timeout for single-tap action (toggle controls on mobile)
          touchTimeout = setTimeout(() => {
            console.log('Single tap - toggling controls visibility');
            const isMobile = window.innerWidth <= 768 || !!document.fullscreenElement;
            if (isMobile) {
              // On mobile - toggle controls visibility
              if (customControls.classList.contains('visible')) {
                customControls.classList.remove('visible');
                clearTimeout(controlsTimeout);
              } else {
                showControls();
                resetControlsTimeout();
              }
            }
            // Remove desktop behavior from touch events completely
          }, 400);
        }
      }
    }
  };
  
  // Add touch event listeners to video wrapper only
  addEventListenerWithCleanup(videoWrapper, 'touchend', touchEndHandler);
  
  // Show controls initially, then hide them after a delay
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    // On mobile, show controls briefly then hide
    showControls();
    setTimeout(() => {
      if (!isMouseOverControls) {
        customControls.classList.remove('visible');
      }
    }, 3000); // Hide after 3 seconds on mobile
  } else {
    // On desktop, don't show controls initially
    customControls.classList.remove('visible');
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