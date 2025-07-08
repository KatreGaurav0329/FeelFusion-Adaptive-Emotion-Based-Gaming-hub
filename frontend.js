// Camera and Emotion Detection Script

const video = document.getElementById('player');
const cameraToggle = document.getElementById('cameraToggle');
const emotionLabel = document.getElementById('emotionLabel');

let stream = null;

// Start camera
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    video.play();
    // Optionally, start emotion detection here
    detectEmotion();
  } catch (err) {
    alert('Unable to access camera: ' + err.message);
  }
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
