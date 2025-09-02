// DOM Elements for both emotion detection and whack-a-mole
const video = document.getElementById('video');
const emotionLabel = document.getElementById('emotionLabel');
const confidenceScore = document.getElementById('confidenceScore');
const colorInfo = document.getElementById('colorInfo');

const holes = document.querySelectorAll(".hole");
const scoreBoard = document.querySelector(".score");
const moles = document.querySelectorAll(".mole");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const modeSel = document.getElementById("mode");

document.addEventListener('DOMContentLoaded', () => {
  const speedEl = document.getElementById('speedValue');
  if (speedEl) speedEl.textContent = '–';
});

// Game state variables
let lastHole;
let timeUp = false;
let score = 0;
let peepTimer = null;
let currentEmotion = 'neutral'; 

let currentSpeed = { min: 800, max: 1000 }; 
let targetSpeed = { min: 800, max: 1000 };
let transitionSpeed = 0.05;

const emotionColors = {
  happy: { 
    color: '#04e7f7ff'
  },
  sad: { 
    color: '#557c7eff'
  },
  angry: { 
    color: '#0c76daff'
  },
  surprised: { 
    color: '#05ffdeff'
  },
  fearful: { 
    color: '#2977ddff'
  },
  disgusted: { 
    color: '#1a29f7ec'
  },
  neutral: { 
    color: '#11c6fde8'
  }
};

const emotionSpeeds = {
  happy: { min: 500, max: 700 },      // Very fast - high energy
  surprised: { min: 600, max: 800 },  // Fast - excitement
  angry: { min: 800, max: 1000 },      // Medium-fast - intensity
  neutral: { min: 900, max: 1200 },   // Medium - default
  fearful: { min: 1000, max: 1400 },  // Slow - anxiety
  disgusted: { min: 1300, max: 1600 }, // Slower - negative emotion
  sad: { min: 1500, max: 1800 }       // Slowest - low energy
};

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

function updateGameSpeed() {
  currentSpeed.min = lerp(currentSpeed.min, targetSpeed.min, transitionSpeed);
  currentSpeed.max = lerp(currentSpeed.max, targetSpeed.max, transitionSpeed);
  
  // Update speed display
  const speedEl = document.getElementById('speedValue');
  if (speedEl) {
    speedEl.textContent = `${Math.round(currentSpeed.min)}–${Math.round(currentSpeed.max)}`;
  }
}

function peep() {
  if (timeUp) return;
  
  const { min, max } = currentSpeed;
  const time = randomTime(min, max);
  const hole = randomHole(holes);
  
  hole.classList.add("up");
  peepTimer = setTimeout(() => {
    hole.classList.remove("up");
    if (!timeUp) peep();
  }, time);
}

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

  mole.parentElement.appendChild(bang);

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

function changeBackgroundColor(emotion) {
  const emotionKey = (emotion && emotionColors[emotion]) ? emotion : 'neutral';
  const colorData = emotionColors[emotionKey];
  const speedData = emotionSpeeds[emotionKey];

  if (colorData && colorData.color) {
    document.documentElement.style.setProperty('--sky-color', colorData.color);
  }

  if (speedData) {
    targetSpeed = speedData;
  }

  console.log(`Target speed set to: ${targetSpeed.min}-${targetSpeed.max}ms for emotion: ${emotionKey}`);
}

function formatEmotionName(emotion) {
  return emotion.charAt(0).toUpperCase() + emotion.slice(1);
}

function formatConfidence(confidence) {
  return `${(confidence * 100).toFixed(1)}%`;
}

video.addEventListener('play', () => {
  const detectionInterval = setInterval(async () => {
    const detections = await faceapi.detectAllFaces(
      video, 
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions();

    // Extract and display emotions + change background + update game speed
    if (detections.length > 0) {
      const expressions = detections[0].expressions;
      const result = getHighestEmotion(expressions);
      
      emotionLabel.textContent = formatEmotionName(result.emotion);
      confidenceScore.textContent = `Confidence: ${formatConfidence(result.confidence)}`;
      
      changeBackgroundColor(result.emotion);
    } else {
      emotionLabel.textContent = 'No face detected';
      confidenceScore.textContent = '---';
      changeBackgroundColor('neutral');
    }
  }, 500);
});

moles.forEach(mole => mole.addEventListener("click", bonk));
startBtn.addEventListener("click", startGame);
endBtn.addEventListener("click", endGame);

function gameLoop() {
  updateGameSpeed();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', function() {
  gameLoop();
});
