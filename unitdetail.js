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

function renderUnit() {
  const unitName = localStorage.getItem('unitName');
  const videoUrls = JSON.parse(localStorage.getItem('videoUrls') || '[]');
  const thumbnailUrls = JSON.parse(localStorage.getItem('thumbnailUrls') || '[]');
  document.getElementById('unit-title').textContent = unitName || 'Unit';

  const container = document.getElementById('thumbnails');
  container.innerHTML = '';
  for (let i = 0; i < videoUrls.length; i++) {
    const videoUrl = videoUrls[i];
    const thumbnailUrl = thumbnailUrls[i];

    const div = document.createElement('div');
    div.className = 'thumbnail';

    const img = document.createElement('img');
    img.src = thumbnailUrl;
    img.alt = `Thumbnail for video ${i + 1}`;
    img.addEventListener('click', () => {
      playVideo(videoUrl);
    });

    div.appendChild(img);
    container.appendChild(div);
  }
}

function playVideo(url) {
  const videoPlayer = document.getElementById('video-player');
  videoPlayer.src = url;
  videoPlayer.play();
}

function backToMain() {
  window.location.href = "mainpage.html";
}

firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {
    window.location.href = "index.html";
  }
  // else: user is authenticated, continue loading the page
});

document.getElementById('unit-title').textContent = localStorage.getItem('unitName') || 'Unit';
renderUnit();