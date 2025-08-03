const video = document.getElementById('video');
const emotionLabel = document.getElementById('emotionLabel');
const confidenceScore = document.getElementById('confidenceScore');
const colorInfo = document.getElementById('colorInfo');

// ======= GAME CONSTANTS & STATE =======
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const chancesEl = document.getElementById('chances');
const modeEl = document.getElementById('mode');
const cameraEl = document.getElementById('cameraAngle');
const pauseBtn = document.getElementById('pauseBtn');
const mainMenu = document.getElementById('mainMenu');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const restartBtn2 = document.getElementById('restartBtn2');
const finalScore = document.getElementById('finalScore');

const emotionColors = {
  happy: { 
    color: '#62ff00ff', // Gold/Yellow
    name: 'Golden Yellow (Joy)'
  },
  sad: { 
    color: '#46b491ff', // Steel Blue
    name: 'Steel Blue (Sadness)'
  },
  angry: { 
    color: '#07b430ff', // Crimson Red
    name: 'Crimson Red (Anger)'
  },
  surprised: { 
    color: '#9370DB', // Medium Purple
    name: 'Medium Purple (Surprise)'
  },
  fearful: { 
    color: '#267e40ff', // Dark Slate Blue
    name: 'Dark Purple (Fear)'
  },
  disgusted: { 
    color: '#6B8E23', // Olive Green
    name: 'Olive Green (Disgust)'
  },
  neutral: { 
    color: '#8ada11af', // Light Gray
    name: 'Light Gray (Neutral)'
  }
};

let targetObstacleSpeed = 5;
let currentObstacleSpeed = 5;

let score = 0;
let chances = 3;
let obstacles = [];
let gameRunning = false;
let paused = false;
let animationFrameId;
let tick = 0;

// Car, road, camera
let carX, carY, carSpeed, carVelocity, carLean, carLeanTarget, carBounce, carBounceTick;
let carWidth, carHeight, carLane;
let roadX, roadY, roadWidth, roadHeight, laneCount;
let cameraMode = 'classic';

const emotionSpeeds = {
  neutral: { obstacleSpeed: 4, spawnRate: 1300, maxObstacles: 3, lanes: 4 },   // Medium - default
  happy: { obstacleSpeed: 5, spawnRate: 1000, maxObstacles: 4, lanes: 5 },      // Very fast - high energy
  sad: { obstacleSpeed: 3, spawnRate: 1700, maxObstacles: 2, lanes: 3 } ,      // Slowest - low energy
  angry: { obstacleSpeed: 5, spawnRate: 1500, maxObstacles: 3, lanes: 4 },      // Medium-fast - intensity
  fearful: { obstacleSpeed: 6, spawnRate: 1400, maxObstacles: 3, lanes: 4 },  // Slow - anxiety
  surprised: { obstacleSpeed: 7, spawnRate: 1300, maxObstacles: 4, lanes: 5 },  // Fast - excitement
  disgusted: { obstacleSpeed: 7, spawnRate: 1200, maxObstacles: 5, lanes: 4 }, // Slower - negative emotion
};

// Modes
const modes = {
  extraeasy: { obstacleSpeed: 3, spawnRate: 1700, maxObstacles: 2, lanes: 3 },
  easy:      { obstacleSpeed: 4, spawnRate: 1300, maxObstacles: 3, lanes: 3 },
  medium:    { obstacleSpeed: 5, spawnRate: 900,  maxObstacles: 4, lanes: 4 },
  hard:      { obstacleSpeed: 7, spawnRate: 650,  maxObstacles: 5, lanes: 5 },
  extrahard: { obstacleSpeed: 10, spawnRate: 400, maxObstacles: 6, lanes: 6 }
};
let currentMode = 'medium';
let modeConfig = modes[currentMode];

// Controls
let keys = { left: false, right: false };
let lastObstacleTime = 0;

// ======= INITIALIZATION =======
function resizeCanvas() {
  let w = Math.min(window.innerWidth * 0.98, 480);
  let h = Math.min(window.innerHeight * 0.92, 720);
  canvas.width = w;
  canvas.height = h;
  roadWidth = w * 0.7;
  roadHeight = h;
  roadX = (w - roadWidth) / 2;
  roadY = 0;
  laneCount = modeConfig.lanes;
  carWidth = roadWidth / (laneCount + 1.5);
  carHeight = carWidth * 1.6;
  carY = h - carHeight - 32;
}
resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  resetCar();
});

// ======= GAME STATE FUNCTIONS =======
function resetCar() {
  carLane = Math.floor(laneCount / 2);
  carX = roadX + ((carLane + 0.5) * roadWidth / laneCount) - carWidth / 2;
  carSpeed = 8;
  carVelocity = 0;
  carLean = 0;
  carLeanTarget = 0;
  carBounce = 0;
  carBounceTick = 0;
}

function updateHUD() {
  scoreEl.textContent = score;
  chancesEl.textContent = chances;
}

// ======= UI HANDLERS =======
function showMenu(menu) {
  [mainMenu, pauseMenu, gameOverMenu].forEach(m => m.classList.remove('active'));
  if (menu) menu.classList.add('active');
}
function hideMenus() {
  [mainMenu, pauseMenu, gameOverMenu].forEach(m => m.classList.remove('active'));
}

// ======= GAME LOOP =======
function gameLoop(ts) {
  if (!gameRunning || paused) return;
  
  // Smooth obstacle speed transition
  currentObstacleSpeed += (targetObstacleSpeed - currentObstacleSpeed) * 0.05;
  modeConfig.obstacleSpeed = currentObstacleSpeed;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRoad(tick);
  handleCarControls();
  drawCar(carX, carY, carLean, carBounce);
  handleObstacles(ts);
  tick++;
  animationFrameId = requestAnimationFrame(gameLoop);
}

function handleCarControls() {
  let move = 0;
  if (keys.left) move -= 1;
  if (keys.right) move += 1;

  if (move !== 0) {
    carVelocity += move * 1.1;
    carLeanTarget = move * 1.1;
  } else {
    carVelocity *= 0.89; // friction
    carLeanTarget = 0;
  }
  carVelocity = Math.max(-carSpeed, Math.min(carVelocity, carSpeed));
  carX += carVelocity;

  // Clamp to road and lanes
  let minX = roadX + 6;
  let maxX = roadX + roadWidth - carWidth - 6;
  carX = Math.max(minX, Math.min(carX, maxX));

  // Snap to lanes on release (optional)
  if (!keys.left && !keys.right) {
    // Find closest lane
    let laneCenters = [];
    for (let i = 0; i < laneCount; i++) {
      laneCenters.push(roadX + ((i + 0.5) * roadWidth / laneCount));
    }
    let closest = laneCenters.reduce((a, b) => Math.abs(b - (carX + carWidth/2)) < Math.abs(a - (carX + carWidth/2)) ? b : a);
    carX += (closest - (carX + carWidth/2)) * 0.12;
  }

  // Smooth lean
  carLean += (carLeanTarget - carLean) * 0.15;
  // Car bounce animation
  carBounceTick += Math.abs(carVelocity) * 0.11 + 0.1;
  carBounce = Math.sin(carBounceTick) * Math.min(3, Math.abs(carVelocity) * 0.22);
}

// ======= DRAWING FUNCTIONS =======
function drawRoad(tick) {
  ctx.save();
  // Camera angle
  let camY = 0, camScale = 1;
  if (cameraMode === 'low') {
    camY = 70; camScale = 1.08;
  }
  if (cameraMode === 'high') {
    camY = -50; camScale = 0.93;
  }
  ctx.translate(canvas.width/2, camY);
  ctx.scale(camScale, camScale);
  ctx.translate(-canvas.width/2, 0);

  // Road base
  ctx.fillStyle = "#fff";
  ctx.roundRect(roadX, roadY, roadWidth, roadHeight, 32);
  ctx.fill();

  // Lane lines
  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 4;
  ctx.setLineDash([28, 22]);
  for (let i = 1; i < laneCount; i++) {
    ctx.beginPath();
    let x = roadX + (i * roadWidth / laneCount);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Animated center line
  ctx.strokeStyle = "#bdbdbd";
  ctx.lineWidth = 6;
  ctx.setLineDash([40, 40]);
  let offset = (tick * modeConfig.obstacleSpeed * 1.2) % 80;
  ctx.beginPath();
  ctx.moveTo(roadX + roadWidth/2, -80 + offset);
  ctx.lineTo(roadX + roadWidth/2, canvas.height + 80);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function drawCar(x, y, lean, bounce) {
  ctx.save();
  // Camera angle
  let camY = 0, camScale = 1;
  if (cameraMode === 'low') { camY = 70; camScale = 1.08; }
  if (cameraMode === 'high') { camY = -50; camScale = 0.93; }
  ctx.translate(canvas.width/2, camY);
  ctx.scale(camScale, camScale);
  ctx.translate(-canvas.width/2, 0);

  // Shadow
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.ellipse(x + carWidth / 2, y + carHeight - 8, carWidth * 0.38, 10 + Math.abs(lean) * 0.6, 0, 0, 2 * Math.PI);
  ctx.fillStyle = "#222";
  ctx.fill();
  ctx.globalAlpha = 1;

  // Car body with lean and bounce
  ctx.translate(x + carWidth / 2, y + carHeight / 2 + bounce);
  ctx.rotate(lean * 0.09);

  // Main body
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.07)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#1976d2";
  ctx.beginPath();
  ctx.roundRect(-carWidth/2, -carHeight/2, carWidth, carHeight, 18);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Subtle highlight
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(-carWidth/2 + 8, -carHeight/2 + 8, carWidth - 16, 18, 10);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Windshield
  ctx.fillStyle = "#e3e9f2";
  ctx.beginPath();
  ctx.roundRect(-carWidth/2 + 7, -carHeight/2 + 12, carWidth - 14, 16, 5);
  ctx.fill();

  // Wheels (animated rotation)
  let wheelAngle = (Date.now() / 80) % (2 * Math.PI);
  for (let i = -1; i <= 1; i += 2) {
    ctx.save();
    ctx.translate(i * (carWidth/2 - 11), carHeight/2 - 18);
    ctx.rotate(wheelAngle);
    ctx.fillStyle = "#444";
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 7, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(i * (carWidth/2 - 11), -carHeight/2 + 18);
    ctx.rotate(wheelAngle);
    ctx.fillStyle = "#444";
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 7, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawObstacle(x, y, color) {
  ctx.save();
  // Camera angle
  let camY = 0, camScale = 1;
  if (cameraMode === 'low') { camY = 70; camScale = 1.08; }
  if (cameraMode === 'high') { camY = -50; camScale = 0.93; }
  ctx.translate(canvas.width/2, camY);
  ctx.scale(camScale, camScale);
  ctx.translate(-canvas.width/2, 0);

  ctx.shadowColor = "rgba(0,0,0,0.06)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, carWidth, carHeight, 16);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Windshield
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 12, carWidth - 20, 14, 6);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function handleObstacles(ts) {
  // Spawn
  if (!lastObstacleTime || ts - lastObstacleTime > modeConfig.spawnRate) {
    if (obstacles.length < modeConfig.maxObstacles) {
      spawnObstacle();
      lastObstacleTime = ts;
    }
  }

  // Move and draw
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].y += modeConfig.obstacleSpeed;
    drawObstacle(obstacles[i].x, obstacles[i].y, obstacles[i].color);

    // Collision detection
    if (
      obstacles[i].x < carX + carWidth - 10 &&
      obstacles[i].x + carWidth - 10 > carX &&
      obstacles[i].y < carY + carHeight - 10 &&
      obstacles[i].y + carHeight - 10 > carY
    ) {
      obstacles.splice(i, 1);
      chances--;
      updateHUD();
      if (chances <= 0) {
        endGame();
        return;
      }
    }

    // Remove off-screen obstacles and increment score
    if (obstacles[i] && obstacles[i].y > canvas.height) {
      obstacles.splice(i, 1);
      score++;
      updateHUD();
    }
  }
}

function spawnObstacle() {
  // Place in random lane
  let lane = Math.floor(Math.random() * laneCount);
  let x = roadX + ((lane + 0.5) * roadWidth / laneCount) - carWidth / 2;
  const colors = ["#e53935", "#8e24aa", "#43a047", "#ffb300", "#039be5"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  obstacles.push({ x: x, y: -carHeight, color });
}

// ======= GAME STATE HANDLERS =======
function startGame() {
  score = 0;
  chances = 3;
  obstacles = [];
  gameRunning = true;
  paused = false;
  tick = 0;
  currentMode = modeEl.value;
  modeConfig = modes[currentMode];
  laneCount = modeConfig.lanes;
  cameraMode = cameraEl.value;
  resizeCanvas();
  resetCar();
  updateHUD();
  hideMenus();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function pauseGame() {
  if (!gameRunning || paused) return;
  paused = true;
  showMenu(pauseMenu);
  cancelAnimationFrame(animationFrameId);
}

function resumeGame() {
  if (!gameRunning || !paused) return;
  paused = false;
  hideMenus();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  paused = false;
  cancelAnimationFrame(animationFrameId);
  finalScore.textContent = score;
  showMenu(gameOverMenu);
}

// ======= EVENT LISTENERS =======
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
restartBtn2.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);

modeEl.addEventListener('change', e => {
  currentMode = e.target.value;
  modeConfig = modes[currentMode];
  laneCount = modeConfig.lanes;
  resizeCanvas();
  resetCar();
});
cameraEl.addEventListener('change', e => {
  cameraMode = e.target.value;
});

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if (e.key === ' ' || e.key === 'Escape' || e.key === 'p') {
    if (gameRunning && !paused) pauseGame();
    else if (gameRunning && paused) resumeGame();
  }
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// Touch controls for mobile
let touchStartX = null;
canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
});
canvas.addEventListener('touchmove', e => {
  if (touchStartX === null) return;
  const deltaX = e.touches[0].clientX - touchStartX;
  if (Math.abs(deltaX) > 24) {
    if (deltaX > 0) {
      keys.right = true;
      keys.left = false;
    } else {
      keys.left = true;
      keys.right = false;
    }
  }
});
canvas.addEventListener('touchend', () => {
  keys.left = false;
  keys.right = false;
  touchStartX = null;
});

// Polyfill for roundRect if needed
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const min = Math.min(w, h);
    if (r > min / 2) r = min / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

// ======= INITIAL MENU =======
showMenu(mainMenu);

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
  const colorData = emotionColors[emotion];
  if (colorData) {
    document.body.style.backgroundColor = colorData.color;
    
    if (colorInfo) {
      colorInfo.textContent = `Background: ${colorData.name}`;
    }
    
    console.log(`Background changed to ${colorData.name} for emotion: ${emotion}`);
  } else {
    document.body.style.backgroundColor = emotionColors.neutral.color;
    if (colorInfo) {
      colorInfo.textContent = `Background: ${emotionColors.neutral.name}`;
    }
  }
}
function updateGameDifficulty(emotion) {
  if (!gameRunning || paused) return;
  
  const emotionConfig = emotionSpeeds[emotion] || emotionSpeeds.neutral;
  
  // Set target values for smooth transition
  targetObstacleSpeed = emotionConfig.obstacleSpeed;
  modeConfig.spawnRate = emotionConfig.spawnRate; // This can change instantly
  modeConfig.maxObstacles = emotionConfig.maxObstacles;
  
  // Handle lane changes (still instant for better UX)
  if (modeConfig.lanes !== emotionConfig.lanes) {
    modeConfig.lanes = emotionConfig.lanes;
    laneCount = modeConfig.lanes;
    resizeCanvas();
    
    if (carLane >= laneCount) {
      carLane = Math.floor(laneCount / 2);
      carX = roadX + ((carLane + 0.5) * roadWidth / laneCount) - carWidth / 2;
    }
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

      // Update game difficulty based on emotion
      updateGameDifficulty(result.emotion);
    } else {
      emotionLabel.textContent = 'No face detected';
      confidenceScore.textContent = '---';
      // Reset to neutral color and speed when no face is detected
      changeBackgroundColor('neutral');
      updateGameDifficulty('neutral');
    }
  }, 1000);
});
