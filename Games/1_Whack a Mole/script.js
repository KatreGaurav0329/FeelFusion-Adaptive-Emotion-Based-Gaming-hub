// DOM Elements for both emotion detection and whack-a-mole
const video = document.getElementById('video');
const emotionLabel = document.getElementById('emotionLabel');
const confidenceScore = document.getElementById('confidenceScore');

const holes = document.querySelectorAll(".hole");
const scoreBoard = document.querySelector(".score");
const moles = document.querySelectorAll(".mole");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const modeSel = document.getElementById("mode");

// After DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Insert default speed if desired
  const speedEl = document.getElementById('speedValue');
  if (speedEl) speedEl.textContent = '–';
});

// Game state variables
let lastHole;
let timeUp = false;
let score = 0;
let peepTimer = null;
let currentEmotion = 'neutral'; // Track current emotion for speed control

let currentSpeed = { min: 800, max: 1000 }; // Start with neutral speed
let targetSpeed = { min: 800, max: 1000 };
let transitionSpeed = 0.01;

// Define emotion-color mappings
const emotionColors = {
  happy: { 
    color: '#62ff00ff'
  },
  sad: { 
    color: '#46b491ff'
  },
  angry: { 
    color: '#07b430ff'
  },
  surprised: { 
    color: '#9370DB'
  },
  fearful: { 
    color: '#267e40ff'
  },
  disgusted: { 
    color: '#6B8E23'
  },
  neutral: { 
    color: '#8ada11af'
  }
};

// UPDATED: Emotion-based speed control instead of manual modes
const emotionSpeeds = {
  happy: { min: 500, max: 700 },      // Very fast - high energy
  surprised: { min: 600, max: 800 },  // Fast - excitement
  angry: { min: 800, max: 1000 },      // Medium-fast - intensity
  neutral: { min: 900, max: 1200 },   // Medium - default
  fearful: { min: 1000, max: 1400 },  // Slow - anxiety
  disgusted: { min: 1300, max: 1600 }, // Slower - negative emotion
  sad: { min: 1500, max: 1800 }       // Slowest - low energy
};

// Keep original modeSpeeds as fallback (optional)
const modeSpeeds = {
  "super-easy": { min: 1600, max: 1800 },
  easy: { min: 1200, max: 1500 },
  medium: { min: 800, max: 1000 },
  hard: { min: 400, max: 700 },
  "super-hard": { min: 200, max: 400 }
};



// Linear interpolation function
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

// Function to smoothly transition between speeds
function updateGameSpeed() {
  currentSpeed.min = lerp(currentSpeed.min, targetSpeed.min, transitionSpeed);
  currentSpeed.max = lerp(currentSpeed.max, targetSpeed.max, transitionSpeed);
  
  // Update speed display
  const speedEl = document.getElementById('speedValue');
  if (speedEl) {
    speedEl.textContent = `${Math.round(currentSpeed.min)}–${Math.round(currentSpeed.max)}`;
  }
}

// Modified peep function to use current speed
function peep() {
  if (timeUp) return;
  
  // Use the gradually changing current speed
  const { min, max } = currentSpeed;
  const time = randomTime(min, max);
  const hole = randomHole(holes);
  
  hole.classList.add("up");
  peepTimer = setTimeout(() => {
    hole.classList.remove("up");
    if (!timeUp) peep();
  }, time);
}

// Whack-a-mole game functions
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

  // Remove bang after 1 second
  setTimeout(() => {
    if (bang.parentElement) bang.parentElement.removeChild(bang);
  }, 1000);
}

// Load FaceAPI models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('../models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('../models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('../models'),
  faceapi.nets.faceExpressionNet.loadFromUri('../models')
]).then(startVideo);

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

// UPDATED: Function to change background color AND update game speed based on emotion
function changeBackgroundColor(emotion) {
  const colorData = emotionColors[emotion];
  if (colorData) {
    document.body.style.backgroundColor = colorData.color;
        
    // Set target speed instead of immediately changing
    if (emotionSpeeds[emotion]) {
      targetSpeed = emotionSpeeds[emotion];
    }

  } else {
    document.body.style.backgroundColor = emotionColors.neutral.color;
    
    targetSpeed = emotionSpeeds.neutral;
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

// Video event listener for emotion detection
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

    // Extract and display emotions + change background + update game speed
    if (detections.length > 0) {
      const expressions = detections[0].expressions;
      const result = getHighestEmotion(expressions);
      
      // Update emotion display
      emotionLabel.textContent = formatEmotionName(result.emotion);
      confidenceScore.textContent = `Confidence: ${formatConfidence(result.confidence)}`;
      
      // Change background color and update game speed based on detected emotion
      changeBackgroundColor(result.emotion);
    } else {
      emotionLabel.textContent = 'No face detected';
      confidenceScore.textContent = '---';
      // Reset to neutral color and speed when no face is detected
      changeBackgroundColor('neutral');
    }
  }, 500);
});

// Event listeners for whack-a-mole game
moles.forEach(mole => mole.addEventListener("click", bonk));
startBtn.addEventListener("click", startGame);
endBtn.addEventListener("click", endGame);

function gameLoop() {
  updateGameSpeed();
  requestAnimationFrame(gameLoop);
}

// Start the game loop after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  gameLoop();
});
