// Camera and Emotion Detection Script

const video = document.getElementById('player');
const cameraToggle = document.getElementById('cameraToggle');
const emotionLabel = document.getElementById('emotionLabel');


// Load FaceAPI models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startCamera);

let stream = null;

// Start camera
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.error(err));
}

// Stop camera
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    stream = null;
  }
  // Optionally, stop emotion detection here
}

// Toggle camera on/off
cameraToggle.addEventListener('change', function() {
  if (this.checked) {
    startCamera();
  } else {
    stopCamera();
    emotionLabel.textContent = '---';
  }
});

// Dummy emotion detection (replace with your real model)
function detectEmotion() {
  // This is a placeholder for actual emotion detection logic.
  // For demonstration, we'll randomly set an emotion every 2 seconds.
  const emotions = ['Happy', 'Sad', 'Surprised', 'Angry', 'Neutral'];
  setInterval(() => {
    if (stream) {
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      emotionLabel.textContent = randomEmotion;
    }
  }, 2000);
}

// Auto-start camera if toggle is ON at page load
if (cameraToggle.checked) {
  startCamera();
}
