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
  const captionsSelect = document.getElementById('captions-select');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const videoWrapper = document.querySelector('.video-player-wrapper');
  
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
  });
  
  // Play/Pause button
  playPauseBtn.addEventListener('click', function() {
    if (videoPlayer.paused) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
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
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoPlayer.currentTime = pos * videoPlayer.duration;
  });
  
  // Volume controls
  volumeBtn.addEventListener('click', function() {
    if (videoPlayer.muted) {
      videoPlayer.muted = false;
      volumeBtn.querySelector('.material-icons').textContent = 'volume_up';
      volumeSlider.value = videoPlayer.volume * 100;
    } else {
      videoPlayer.muted = true;
      volumeBtn.querySelector('.material-icons').textContent = 'volume_off';
    }
  });
  
  volumeSlider.addEventListener('input', function() {
    videoPlayer.volume = this.value / 100;
    videoPlayer.muted = false;
    volumeBtn.querySelector('.material-icons').textContent = this.value > 0 ? 'volume_up' : 'volume_off';
  });
  
  // Speed control
  speedSelect.addEventListener('change', function() {
    videoPlayer.playbackRate = parseFloat(this.value);
    localStorage.setItem('playbackSpeed', this.value);
    NotificationManager.showToast(`Speed: ${this.value}x`);
  });
  
  // Load saved speed
  const savedSpeed = localStorage.getItem('playbackSpeed') || '1';
  speedSelect.value = savedSpeed;
  videoPlayer.playbackRate = parseFloat(savedSpeed);
  
  // Quality control (placeholder - would need actual implementation)
  qualitySelect.addEventListener('change', function() {
    localStorage.setItem('videoQuality', this.value);
    NotificationManager.showToast(`Quality: ${this.value === 'auto' ? 'Auto' : this.value + 'p'}`);
  });
  
  // Load saved quality
  const savedQuality = localStorage.getItem('videoQuality') || 'auto';
  qualitySelect.value = savedQuality;
  
  // Captions control
  initCaptionsControl(videoPlayer, captionsSelect);
  
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
  
  // Mouse/touch events for controls
  videoWrapper.addEventListener('mousemove', resetControlsTimeout);
  videoWrapper.addEventListener('click', function() {
    if (videoPlayer.paused) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  });
  
  customControls.addEventListener('mouseenter', function() {
    isMouseOverControls = true;
    showControls();
  });
  
  customControls.addEventListener('mouseleave', function() {
    isMouseOverControls = false;
    resetControlsTimeout();
  });
  
  // Show controls initially
  resetControlsTimeout();
  
  // Keyboard controls
  document.addEventListener('keydown', function(e) {
    if (document.getElementById('video-container').style.display === 'block') {
      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          videoPlayer.currentTime += 5;
          NotificationManager.showToast('Forward 5s');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoPlayer.currentTime -= 5;
          NotificationManager.showToast('Backward 5s');
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

  // Remove any existing keydown handlers and add new one
  document.removeEventListener('keydown', keydownHandler, true);
  document.addEventListener('keydown', keydownHandler, true);
  
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

// Captions functionality
function initCaptionsControl(videoPlayer, captionsSelect) {
  const captionsDisplay = document.getElementById('custom-captions');
  let captionsData = null;
  
  // Load saved captions preference
  const savedCaptions = localStorage.getItem('captionsLanguage') || 'off';
  captionsSelect.value = savedCaptions;
  
  captionsSelect.addEventListener('change', function() {
    const language = this.value;
    localStorage.setItem('captionsLanguage', language);
    
    if (language === 'off') {
      captionsDisplay.style.display = 'none';
      captionsData = null;
      NotificationManager.showToast('Captions: Off');
    } else {
      loadCaptions(language);
      NotificationManager.showToast(`Captions: ${getLanguageName(language)}`);
    }
  });
  
  // Update captions during video playback
  videoPlayer.addEventListener('timeupdate', function() {
    if (captionsData && captionsSelect.value !== 'off') {
      updateCaptions(videoPlayer.currentTime);
    }
  });
  
  function loadCaptions(language) {
    // Generate sample captions for demonstration
    captionsData = generateSampleCaptions(language);
  }
  
  function updateCaptions(currentTime) {
    if (!captionsData) return;
    
    const currentCaption = captionsData.find(caption => 
      currentTime >= caption.start && currentTime <= caption.end
    );
    
    if (currentCaption) {
      captionsDisplay.textContent = currentCaption.text;
      captionsDisplay.style.display = 'block';
    } else {
      captionsDisplay.style.display = 'none';
    }
  }
  
  function getLanguageName(code) {
    const languages = {
      'en': 'English',
      'ar': 'Arabic',
      'auto': 'Auto-generated'
    };
    return languages[code] || code;
  }
  
  function generateSampleCaptions(language = 'en') {
    if (language === 'ar') {
      return [
        { start: 0, end: 5, text: 'مرحبا بكم في هذا الدرس' },
        { start: 5, end: 10, text: 'سنتعلم اليوم موضوعا جديدا' },
        { start: 10, end: 15, text: 'دعونا نبدأ بالأساسيات' },
        { start: 15, end: 20, text: 'هذا مثال على الترجمة العربية' }
      ];
    } else {
      return [
        { start: 0, end: 5, text: 'Welcome to this lesson' },
        { start: 5, end: 10, text: 'Today we will learn something new' },
        { start: 10, end: 15, text: 'Let\'s start with the basics' },
        { start: 15, end: 20, text: 'This is an example of English captions' },
        { start: 20, end: 25, text: 'Captions help with accessibility' },
        { start: 25, end: 30, text: 'Thank you for watching' }
      ];
    }
  }
  
  // Initialize captions if previously enabled
  if (savedCaptions !== 'off') {
    loadCaptions(savedCaptions);
  }
}