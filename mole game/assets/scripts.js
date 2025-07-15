const holes = document.querySelectorAll(".hole");
const scoreBoard = document.querySelector(".score");
const moles = document.querySelectorAll(".mole");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const modeSel = document.getElementById("mode");

const video = document.getElementById('video');
const emotionLabel = document.getElementById('emotionLabel');
const confidenceScore = document.getElementById('confidenceScore');
const colorInfo = document.getElementById('colorInfo');

// Define emotion-color mappings based on research
const emotionColors = {
  happy: { 
    color: '#FFD700', // Gold/Yellow
    name: 'Golden Yellow (Joy)'
  },
  sad: { 
    color: '#4682B4', // Steel Blue
    name: 'Steel Blue (Sadness)'
  },
  angry: { 
    color: '#DC143C', // Crimson Red
    name: 'Crimson Red (Anger)'
  },
  surprised: { 
    color: '#9370DB', // Medium Purple
    name: 'Medium Purple (Surprise)'
  },
  fearful: { 
    color: '#483D8B', // Dark Slate Blue
    name: 'Dark Purple (Fear)'
  },
  disgusted: { 
    color: '#6B8E23', // Olive Green
    name: 'Olive Green (Disgust)'
  },
  neutral: { 
    color: '#D3D3D3', // Light Gray
    name: 'Light Gray (Neutral)'
  }
};

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(() => {
  console.log('Models loaded successfully');
  startVideo();
}).catch(error => {
  console.error('Error loading models:', error);
});


function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.error(err));
}

// Function to get the emotion with highest confidence
function getHighestEmotion(expressions) {
  const emotionKeys = Object.keys(expressions);
  const highestEmotionKey = emotionKeys.reduce((a, b) => 
    expressions[a] > expressions[b] ? a : b
  );
  return {
    emotion: highestEmotionKey,
    confidence: expressions[highestEmotionKey]
  };
}

// Function to change background color based on emotion
function changeBackgroundColor(emotion) {
  const colorData = emotionColors[emotion];
  if (colorData) {
    // Smoothly transition background color
    document.body.style.backgroundColor = colorData.color;
    
    // Update color info display
    colorInfo.textContent = `Background: ${colorData.name}`;
    
    // Optional: Log color change for debugging
    console.log(`Background changed to ${colorData.name} for emotion: ${emotion}`);
  } else {
    // Default to neutral if emotion not found
    document.body.style.backgroundColor = emotionColors.neutral.color;
    colorInfo.textContent = `Background: ${emotionColors.neutral.name}`;
  }
}

// Function to format emotion name for display
function formatEmotionName(emotion) {
  return emotion.charAt(0).toUpperCase() + emotion.slice(1);
}

// Function to format confidence as percentage
function formatConfidence(confidence) {
  return `${(confidence * 100).toFixed(1)}%`;
}

video.addEventListener('play', () => {
  // Remove any existing canvas
  const oldCanvas = document.querySelector('canvas');
  if (oldCanvas) oldCanvas.remove();

  // Wait for video to have dimensions
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  const canvas = faceapi.createCanvasFromMedia(video);
  
  // Position canvas to overlay the video
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.borderRadius = '10px';
  
  document.querySelector('.video-container').appendChild(canvas);
  faceapi.matchDimensions(canvas, displaySize);

  const detectionInterval = setInterval(async () => {
    const detections = await faceapi.detectAllFaces(
      video, 
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw face detection overlays
   /* faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);*/

    // Extract and display emotions + change background
    if (detections.length > 0) {
      const expressions = detections[0].expressions;
      const result = getHighestEmotion(expressions);
      
      // Update emotion display
      emotionLabel.textContent = formatEmotionName(result.emotion);
      confidenceScore.textContent = `Confidence: ${formatConfidence(result.confidence)}`;
      
      // Change background color based on detected emotion
      changeBackgroundColor(result.emotion);
    } else {
      emotionLabel.textContent = 'No face detected';
      confidenceScore.textContent = '---';
      // Reset to neutral color when no face is detected
      changeBackgroundColor('neutral');
    }
  }, 100);
});


let lastHole;
let timeUp = false;
let score = 0;
let peepTimer = null;

const modeSpeeds = {
  "super-easy": { min: 1600, max: 1800 },
  easy: { min: 1200, max: 1500 },
  medium: { min: 800, max: 1000 },
  hard: { min: 400, max: 700 },
  "super-hard": { min: 200, max: 400 }
};

function randomTime(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
  const index = Math.floor(Math.random() * holes.length);
  const hole = holes[index];
  if (hole === lastHole) return randomHole(holes);
  lastHole = hole;
  return hole;
}

function peep() {
  if (timeUp) return;
  const mode = modeSel.value;
  const { min, max } = modeSpeeds[mode];
  const time = randomTime(min, max);
  const hole = randomHole(holes);
  hole.classList.add("up");
  peepTimer = setTimeout(() => {
    hole.classList.remove("up");
    if (!timeUp) peep();
  }, time);
}

function startGame() {
  scoreBoard.textContent = 0;
  timeUp = false;
  score = 0;
  startBtn.disabled = true;
  endBtn.disabled = false;
  peep();
}

function endGame() {
  timeUp = true;
  startBtn.disabled = false;
  endBtn.disabled = true;
  clearTimeout(peepTimer);
  holes.forEach(hole => hole.classList.remove("up"));
}

/*function bonk(e) {
  if (!e.isTrusted) return;
  score++;
  this.classList.remove("up");
  scoreBoard.textContent = score;
}*/

function bonk(e) {
  if (!e.isTrusted) return;
  score++;
  scoreBoard.textContent = score;
  const mole = this;
  mole.classList.remove("up");

  // Create the bang image
  const bang = document.createElement('img');
  bang.src = './assets/bang.png';
  bang.className = 'bang-effect';
  bang.style.position = 'absolute';
  bang.style.top = '10%';
  bang.style.left = '50%';
  bang.style.transform = 'translateX(-50%)';
  bang.style.width = '60%';
  bang.style.pointerEvents = 'none';
  bang.style.zIndex = '10';

  // Add bang image to the mole's parent (the .hole)
  mole.parentElement.appendChild(bang);

  // Remove bang after 0.9 seconds
  setTimeout(() => {
    if (bang.parentElement) bang.parentElement.removeChild(bang);
  }, 1000);
}


moles.forEach(mole => mole.addEventListener("click", bonk));
startBtn.addEventListener("click", startGame);
endBtn.addEventListener("click", endGame);
