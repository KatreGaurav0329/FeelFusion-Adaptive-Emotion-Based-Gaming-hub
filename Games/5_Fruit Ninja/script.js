// DOM Elements for both emotion detection and whack-a-mole
const video = document.getElementById('video');
const emotionLabel = document.getElementById('emotionLabel');
const confidenceScore = document.getElementById('confidenceScore');
const colorInfo = document.getElementById('colorInfo');

// Declare new audio objects
const fruitCutSound = new Audio('sounds/splatter.mp3');
const bombBlastSound = new Audio('sounds/boom.mp3');
const gameOverSound = new Audio('sounds/over.mp3');
const startMusic = new Audio('sounds/start.mp3');

// Define emotion-color mappings
const emotionColors = {
  happy: {
    color: '#FFD700', // Gold: Bright, cheerful, and vibrant
  },
  sad: {
    color: '#5D85A6', // Steel Blue: A calm, muted blue for melancholy
  },
  angry: {
    color: '#DC143C', // Crimson: A strong, aggressive red for anger
  },
  surprised: {
    color: '#00BFFF', // Deep Sky Blue: A sudden, electrifying blue for surprise
  },
  fearful: {
    color: '#4B0082', // Indigo: A dark, deep purple for a sense of foreboding
  },
  disgusted: {
    color: '#556B2F', // Dark Olive Green: A muddy, unpleasant green
  },
  neutral: {
    color: '#08111eff', // Dark Gray: A stable, non-intrusive default
  }
};

// UPDATED: Emotion-based speed control instead of manual modes
const emotionSpeeds = {
  neutral: { spawn: 700, max: 7, bombChance: 0.15 }, // Medium - default
  happy: { spawn: 600, max: 8, bombChance: 0.23 }, // Very fast - high energy
  sad: { spawn: 900, max: 5, bombChance: 0.09 }, // Slowest - low energy
  surprised: { spawn: 900, max: 5, bombChance: 0.19 }, // Fast - excitement
  angry: { spawn: 800, max: 6, bombChance: 0.23 }, // Medium-fast - intensity
  fearful: { spawn: 700, max: 6, bombChance: 0.20 }, // Slow - anxiety
  disgusted: { spawn: 600, max: 6, bombChance: 0.29 } // Slower - negative emotion
};

const canvas = document.getElementById('gameCanvas'),
  ctx = canvas.getContext('2d'),
  scoreDisplay = document.getElementById('score'),
  difficultySelect = document.getElementById('difficulty'),
  playBtn = document.getElementById('playBtn'),
  pauseBtn = document.getElementById('pauseBtn'),
  gameOverDiv = document.getElementById('game-over'),
  restartBtn = document.getElementById('restartBtn');

const gravity = 0.15,
  fruitRadius = 30,
  bombRadius = 25;
const fruitEmojis = ['🍎', '🥝', '🍓', '🍇', '🍉', '🍍', '🥭'];

const difficulties = {
  easy: { spawn: 900, max: 5, bombChance: 0.09 },
  medium: { spawn: 700, max: 7, bombChance: 0.15 },
  hard: { spawn: 500, max: 9, bombChance: 0.23 },
  superhard: { spawn: 350, max: 12, bombChance: 0.30 }
};

let fruits = [],
  slicing = false,
  gameRunning = false,
  sliceTrail = [],
  sliceMax = 15,
  score = 0,
  bombBlastActive = false,
  bombBlastRadius = 4;
let spawnIntervalId = null,
  currentDifficulty = 'easy';


//document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24">🗡️</text></svg>'), auto`;

class GameObject {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.radius = r;
    this.vx = (Math.random() * 6) - 3;
    this.vy = -(8 + Math.random() * 3);
    this.sliced = false;
    this.emojiSize = r * 2;
  }
  update() {
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -0.6;
    } else if (this.x > canvas.width - this.radius) {
      this.x = canvas.width - this.radius;
      this.vx *= -0.6;
    }
  }
  offScreen() {
    return this.y - this.radius > canvas.height + 20
  }
}

class Fruit extends GameObject {
  constructor() {
    super(Math.random() * (canvas.width - fruitRadius * 2) + fruitRadius, canvas.height + fruitRadius + Math.random() * 100, fruitRadius);
    this.emoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)];
  }
  draw() {
    ctx.save();
    ctx.font = `${this.emojiSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

class FruitHalf extends GameObject {
  constructor(x, y, r, emoji, sliceAngle, side) {
    super(x, y, r);
    this.emoji = emoji;
    this.sliceAngle = sliceAngle;
    this.side = side;
    this.vx = (Math.random() * 6) - 3 + (this.side === 'left' ? -2 : 2);
    this.vy = -(8 + Math.random() * 3);
    this.rotation = 0;
    this.rotationSpeed = (Math.random() * 0.2) - 0.1;
  }
  update() {
    super.update();
    this.rotation += this.rotationSpeed;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.font = `${this.emojiSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 10;

    // A simple way to simulate a half-cut emoji
    ctx.save();
    ctx.beginPath();
    ctx.rect(-this.radius, -this.radius, this.radius * (this.side === 'left' ? 1 : 1), this.radius * 2);
    ctx.clip();
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();

    ctx.restore();
  }
}


class Bomb extends GameObject {
  constructor() {
    super(Math.random() * (canvas.width - bombRadius * 2) + bombRadius, canvas.height + bombRadius + Math.random() * 100, bombRadius);
    this.emoji = '💣';
  }
  draw() {
    ctx.save();
    ctx.font = `${this.emojiSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,0,0,0.8)';
    ctx.shadowBlur = 15;
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

function distanceToLine(px, py, x1, y1, x2, y2) {
  let A = px - x1,
    B = py - y1,
    C = x2 - x1,
    D = y2 - y1;
  let dot = A * C + B * D,
    len_sq = C * C + D * D,
    param = -1;
  if (len_sq !== 0) param = dot / len_sq;
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  let dx = px - xx,
    dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function addSlicePoint(x, y) {
  sliceTrail.push({ x, y, alpha: 1 });
  if (sliceTrail.length > sliceMax) sliceTrail.shift();
}
function drawCursorBlade() {
  if (sliceTrail.length > 0) {
    const p = sliceTrail[sliceTrail.length - 1]; // last slice point
    ctx.save();
    ctx.font = "28px Arial";  // adjust size if needed
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🗡️", p.x, p.y);
    ctx.restore();
  }
}

function drawSliceTrail() {
  for (let i = 0; i < sliceTrail.length - 1; i++) {
    let p0 = sliceTrail[i],
      p1 = sliceTrail[i + 1];
    ctx.strokeStyle = `rgba(255,255,255,${p0.alpha*0.7})`;
    ctx.lineWidth = 6 * p0.alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    p0.alpha -= 0.06;
    if (p0.alpha < 0) p0.alpha = 0;
  }
}

function checkSlice() {
  if (sliceTrail.length < 2 || !gameRunning) return;
  for (let i = fruits.length - 1; i >= 0; i--) {
    let f = fruits[i];
    
    // Only allow slicing on whole fruits and bombs, not already-sliced halves
    if (f instanceof FruitHalf) continue;

    for (let j = 0; j < sliceTrail.length - 1; j++) {
      let p0 = sliceTrail[j],
        p1 = sliceTrail[j + 1];
      if (distanceToLine(f.x, f.y, p0.x, p0.y, p1.x, p1.y) < f.radius) {
        if (f instanceof Bomb) {
          bombBlast(f.x, f.y);
          return;
        }
        
        // Play the fruit slicing sound
        fruitCutSound.currentTime = 0;
        fruitCutSound.play().catch(e => console.error("Audio playback error:", e));

        f.sliced = true;
        score++;
        scoreDisplay.textContent = "Score: " + score;

        // Create two halves with new velocities
        const half1 = new FruitHalf(f.x, f.y, f.radius, f.emoji, 0, 'left');
        const half2 = new FruitHalf(f.x, f.y, f.radius, f.emoji, 0, 'right');
        fruits.splice(i, 1);
        fruits.push(half1, half2);
        break;
      }
    }
  }
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.onmousedown = e => {
  if (!gameRunning) return;
  slicing = true;
  sliceTrail = [];
  addSlicePoint(...Object.values(getPos(e)));
};
canvas.onmousemove = e => {
  if (!slicing || !gameRunning) return;
  const pos = getPos(e);
  addSlicePoint(pos.x, pos.y);
  checkSlice();
};
canvas.onmouseup = canvas.onmouseleave = e => {
  slicing = false;
  sliceTrail = [];
};
canvas.ontouchstart = e => {
  if (!gameRunning) return;
  e.preventDefault();
  slicing = true;
  sliceTrail = [];
  addSlicePoint(...Object.values(getPos(e)));
};
canvas.ontouchmove = e => {
  if (!slicing || !gameRunning) return;
  e.preventDefault();
  const pos = getPos(e);
  addSlicePoint(pos.x, pos.y);
  checkSlice();
};
canvas.ontouchend = e => {
  e.preventDefault();
  slicing = false;
  sliceTrail = [];
};

function spawnObjects() {
  const d = difficulties[currentDifficulty];
  if (fruits.length >= d.max) return;
  if (Math.random() < d.bombChance) fruits.push(new Bomb());
  else fruits.push(new Fruit());
}

function startSpawning() {
  if (spawnIntervalId) clearInterval(spawnIntervalId);
  spawnIntervalId = setInterval(() => {
    if (gameRunning) spawnObjects();
  }, difficulties[currentDifficulty].spawn);
}

function gameOver() {
  gameRunning = false;

  //play over.mp3 sound
  gameOverSound.currentTime = 0;
  gameOverSound.play().catch(e => console.error("Audio playback error:", e));
  
  gameOverDiv.style.display = 'block';
}

function bombBlast(x, y) {
  gameRunning = false;
  bombBlastActive = true;
  bombBlastCenter = { x, y };
  clearInterval(spawnIntervalId);
  
  // Play the bomb blast sound
  bombBlastSound.currentTime = 0;
  bombBlastSound.play().catch(e => console.error("Audio playback error:", e));
  
  setTimeout(gameOver, 500); // End game after a short animation
}

function resetGame() {
  score = 0;
  scoreDisplay.textContent = "Score: 0";
  fruits = [];
  sliceTrail = [];
  gameRunning = true;
  bombBlastActive = false;
  bombBlastRadius = 0;
  gameOverDiv.style.display = 'none';
  startSpawning();
}

difficultySelect.onchange = e => {
  currentDifficulty = e.target.value;
  if (gameRunning) {
    clearInterval(spawnIntervalId);
    startSpawning();
  }
};

playBtn.onclick = () => {
  if (!gameRunning) {
    resetGame();
  } else {
    gameRunning = true;
    startSpawning();
  }
};

pauseBtn.onclick = () => {
  gameRunning = false;
  clearInterval(spawnIntervalId);
};

restartBtn.onclick = () => {
  resetGame();
};

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = fruits.length - 1; i >= 0; i--) {
    let f = fruits[i];
    f.update();
    f.draw(ctx);
    if (f.offScreen() && !f.sliced) fruits.splice(i, 1);
    else if (f instanceof FruitHalf && f.y > canvas.height + f.radius) {
      fruits.splice(i, 1);
    }
  }

  if (bombBlastActive) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(bombBlastCenter.x, bombBlastCenter.y, bombBlastRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 165, 0, ${1 - bombBlastRadius / 150})`; // Orange color, fading out
    ctx.fill();
    ctx.restore();
    bombBlastRadius += 5;
    if (bombBlastRadius > 150) {
      bombBlastActive = false;
      bombBlastRadius = 0;
    }
  }

  if (sliceTrail.length > 1 && gameRunning) drawSliceTrail();

  requestAnimationFrame(loop);
}

// Init
resetGame();
loop();

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


  } else {
    document.body.style.backgroundColor = emotionColors.neutral.color;

  }
}

function applyEmotionSpeed(emotion) {
  // Fallback to 'neutral' if the emotion doesn't match
  const e = emotionSpeeds[emotion] || emotionSpeeds['neutral'];

  // Update difficulty parameters
  difficulties['emotion'] = { spawn: e.spawn, max: e.max, bombChance: e.bombChance };
  currentDifficulty = 'emotion';

  // Restart spawning fruit with new interval
  if (spawnIntervalId) clearInterval(spawnIntervalId);
  if (gameRunning) startSpawning();
}

function displayDifficulty(emotion) {
  const d = emotionSpeeds[emotion] || emotionSpeeds['neutral'];
  const difficultyDiv = document.getElementById('difficulty-display');
  if (!difficultyDiv) return;
  difficultyDiv.innerHTML = `
    <strong>Live Difficulty:</strong><br>
    Emotion: <span style="color: #ffe082">${emotion.charAt(0).toUpperCase()+emotion.slice(1)}</span><br>
    Spawn Rate: <span style="color: #ffb300">${d.spawn} ms</span><br>
    Max Fruits: <span style="color: #4caf50">${d.max}</span><br>
    Bomb Chance: <span style="color: #e53935">${Math.round(d.bombChance*100)}%</span>
  `;
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
let lastEmotion = null; // Declare lastEmotion outside the interval to persist its value
video.addEventListener('play', () => {
  /*// Remove any existing canvas
  const oldCanvas = document.querySelector('canvas');
  if (oldCanvas) oldCanvas.remove();*/

  // Wait for video to have dimensions
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  const canvas = faceapi.createCanvasFromMedia(video);

  /*canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.borderRadius = '10px';*/

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

      if (lastEmotion !== result.emotion) {
        applyEmotionSpeed(result.emotion);
        displayDifficulty(result.emotion);
        lastEmotion = result.emotion;
      }

    } else {
      emotionLabel.textContent = 'No face detected';
      confidenceScore.textContent = '---';
      // Reset to neutral color and speed when no face is detected
      changeBackgroundColor('neutral');

      if (lastEmotion !== 'neutral') {
        applyEmotionSpeed('neutral');
        displayDifficulty('neutral');
        lastEmotion = 'neutral';
      }
    }
  }, 1000);
});


//********************** *changes for  for navigation ****************************
document.addEventListener('DOMContentLoaded', () => {

  // --- Navigation Menu Logic ---
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }

  // --- Dark Mode Toggle Logic ---
  const darkModeToggle = document.querySelector('#darkModeToggle');
  const body = document.body;

  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      body.classList.toggle('dark-mode');

      // Optional: Update button text/icon based on mode
      if (body.classList.contains('dark-mode')) {
        darkModeToggle.innerHTML = '☀️ Light Mode';
        darkModeToggle.setAttribute('aria-label', 'Toggle Light Mode');
      } else {
        darkModeToggle.innerHTML = '🌙 Dark Mode';
        darkModeToggle.setAttribute('aria-label', 'Toggle Dark Mode');
      }
    });
  }
  


});
//***************************************************************************************************** 
