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
  
  // Initialize playback speed control
  initPlaybackSpeedControl(videoPlayer);
  
  // Initialize video quality control
  initVideoQualityControl(videoPlayer);
  
  // Initialize captions control
  initCaptionsControl(videoPlayer);
  
  // Initialize lesson notes
  initLessonNotes(videoPlayer, lessonKey);
  
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
    z-index: 999999;
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

function initPlaybackSpeedControl(videoPlayer) {
  const speedSelector = document.getElementById('speed-select');
  
  // Load saved playback speed
  const savedSpeed = localStorage.getItem('playbackSpeed') || '1';
  speedSelector.value = savedSpeed;
  videoPlayer.playbackRate = parseFloat(savedSpeed);
  
  speedSelector.addEventListener('change', function() {
    const speed = parseFloat(this.value);
    videoPlayer.playbackRate = speed;
    localStorage.setItem('playbackSpeed', speed.toString());
    NotificationManager.showToast(`Speed: ${speed}x`);
  });
}

function initVideoQualityControl(videoPlayer) {
  const qualitySelector = document.getElementById('quality-select');
  
  // Load saved quality preference
  const savedQuality = localStorage.getItem('videoQuality') || 'auto';
  qualitySelector.value = savedQuality;
  
  qualitySelector.addEventListener('change', function() {
    const quality = this.value;
    localStorage.setItem('videoQuality', quality);
    
    // For demonstration purposes, show quality change notification
    // In a real implementation, you would need different quality video files
    // or use adaptive streaming technologies like HLS or DASH
    let qualityText = quality === 'auto' ? 'Auto' : `${quality}p`;
    NotificationManager.showToast(`Quality: ${qualityText}`);
    
    // Store current video position
    const currentTime = videoPlayer.currentTime;
    const wasPaused = videoPlayer.paused;
    
    // If implementing actual quality switching, you would:
    // 1. Get the current video source URL
    // 2. Replace with quality-specific URL (e.g., video_720p.mp4)
    // 3. Set the new source and restore position
    
    // Example implementation (commented out):
    /*
    const currentSrc = videoPlayer.src;
    const qualitySrc = getQualityUrl(currentSrc, quality);
    
    videoPlayer.src = qualitySrc;
    videoPlayer.addEventListener('loadedmetadata', () => {
      videoPlayer.currentTime = currentTime;
      if (!wasPaused) {
        videoPlayer.play();
      }
    }, { once: true });
    */
  });
}

function initCaptionsControl(videoPlayer) {
  const captionsSelector = document.getElementById('captions-select');
  const captionsDisplay = document.getElementById('custom-captions');
  
  // Load saved captions preference
  const savedCaptions = localStorage.getItem('captionsLanguage') || 'off';
  captionsSelector.value = savedCaptions;
  
  let captionsData = null;
  let currentCaptionIndex = 0;
  
  captionsSelector.addEventListener('change', function() {
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
    if (captionsData && captionsSelector.value !== 'off') {
      updateCaptions(videoPlayer.currentTime);
    }
  });
  
  function loadCaptions(language) {
    if (language === 'auto') {
      // Simulate auto-generated captions
      captionsData = generateSampleCaptions();
      captionsDisplay.style.display = 'block';
    } else {
      // In a real implementation, you would load actual subtitle files
      // fetch(`captions/${currentLessonKey}_${language}.vtt`)
      //   .then(response => response.text())
      //   .then(vttContent => {
      //     captionsData = parseVTT(vttContent);
      //   });
      
      // For demonstration, load sample captions
      captionsData = generateSampleCaptions(language);
      captionsDisplay.style.display = 'block';
    }
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
    // Sample captions for demonstration
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

function initLessonNotes(videoPlayer, lessonKey) {
  const notesPanel = document.getElementById('lesson-notes-panel');
  const toggleButton = document.getElementById('toggle-notes');
  const addBookmarkBtn = document.getElementById('add-bookmark');
  const noteInput = document.getElementById('note-input');
  const saveNoteBtn = document.getElementById('save-note');
  const notesList = document.getElementById('notes-list');
  
  let currentLessonKey = lessonKey;
  let notesData = [];
  
  // Toggle notes panel
  toggleButton.addEventListener('click', function() {
    notesPanel.classList.toggle('open');
  });
  
  // Add bookmark at current time
  addBookmarkBtn.addEventListener('click', function() {
    const currentTime = videoPlayer.currentTime;
    const bookmark = {
      id: Date.now(),
      timestamp: currentTime,
      text: `Bookmark at ${formatTime(currentTime)}`,
      isBookmark: true,
      createdAt: new Date().toISOString()
    };
    
    addNote(bookmark);
    NotificationManager.showToast('Bookmark added! 📖');
  });
  
  // Save note with current timestamp
  saveNoteBtn.addEventListener('click', function() {
    const noteText = noteInput.value.trim();
    if (!noteText) return;
    
    const currentTime = videoPlayer.currentTime;
    const note = {
      id: Date.now(),
      timestamp: currentTime,
      text: noteText,
      isBookmark: false,
      createdAt: new Date().toISOString()
    };
    
    addNote(note);
    noteInput.value = '';
    NotificationManager.showToast('Note saved! 📝');
  });
  
  // Add note to storage and display
  function addNote(note) {
    notesData.push(note);
    saveNotesToFirebase();
    displayNotes();
  }
  
  // Display all notes
  function displayNotes() {
    notesList.innerHTML = '';
    
    // Sort by timestamp
    const sortedNotes = [...notesData].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedNotes.forEach(note => {
      const noteElement = createNoteElement(note);
      notesList.appendChild(noteElement);
    });
  }
  
  // Create note DOM element
  function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = `note-item ${note.isBookmark ? 'note-bookmark' : ''}`;
    
    div.innerHTML = `
      <div class="note-timestamp">${formatTime(note.timestamp)}</div>
      <div class="note-text">${note.text}</div>
      <div class="note-actions">
        <button class="note-action-btn" onclick="seekToNote(${note.timestamp})">Go to</button>
        <button class="note-action-btn" onclick="deleteNote(${note.id})">Delete</button>
      </div>
    `;
    
    return div;
  }
  
  // Format time for display
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Save notes to Firebase
  function saveNotesToFirebase() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const notesRef = db.ref(`notes/${user.uid}/${currentUnitName}/${currentLessonKey}`);
    notesRef.set(notesData)
      .then(() => {
        console.log('Notes saved to Firebase');
      })
      .catch(error => {
        console.error('Error saving notes:', error);
      });
  }
  
  // Load notes from Firebase
  function loadNotesFromFirebase() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const notesRef = db.ref(`notes/${user.uid}/${currentUnitName}/${currentLessonKey}`);
    notesRef.once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          notesData = snapshot.val() || [];
          displayNotes();
        }
      })
      .catch(error => {
        console.error('Error loading notes:', error);
      });
  }
  
  // Global functions for note actions
  window.seekToNote = function(timestamp) {
    videoPlayer.currentTime = timestamp;
    NotificationManager.showToast(`Jumped to ${formatTime(timestamp)}`);
  };
  
  window.deleteNote = function(noteId) {
    notesData = notesData.filter(note => note.id !== noteId);
    saveNotesToFirebase();
    displayNotes();
    NotificationManager.showToast('Note deleted');
  };
  
  // Load existing notes
  loadNotesFromFirebase();
}