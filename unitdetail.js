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
      const videoPlayer = document.getElementById('video-player');
      videoPlayer.src = url;
      document.getElementById('video-title').textContent = lessonKey;
      
      // Remove any existing event listeners to prevent duplicates
      const newPlayer = videoPlayer.cloneNode(true);
      videoPlayer.parentNode.replaceChild(newPlayer, videoPlayer);
      
      // Mark lesson as completed when video ends
      newPlayer.addEventListener('ended', function() {
        ProgressTracker.markLessonCompleted(currentUnitName, lessonKey);
        NotificationManager.showToast('Lesson completed! 🎉');
      });
      
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
  videoPlayer.pause();
  videoPlayer.src = '';
  document.getElementById('video-container').style.display = 'none';
}

function goBack() {
  Navigation.goToMainPage();
}