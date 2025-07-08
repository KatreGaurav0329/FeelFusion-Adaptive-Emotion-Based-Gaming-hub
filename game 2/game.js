// --- Duck Hunt: Ultra Edition ---
// Ultra smooth, animated, responsive shooting game with improved controls and visible bullets

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let width = window.innerWidth, height = window.innerHeight;
canvas.width = width; canvas.height = height;

const scoreEl = document.getElementById('score');
const healthInner = document.getElementById('health-inner');
const healthText = document.getElementById('health-text');
const difficultySel = document.getElementById('difficulty');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const highScoresEl = document.getElementById('high-scores');
const shootSound = document.getElementById('shoot-sound');
const hitSound = document.getElementById('hit-sound');
const missSound = document.getElementById('miss-sound');

let gun = { x: width/2, y: height - 80, r: 48, recoil: 0 };
let birds = [];
let bullets = [];
let score = 0, health = 5, maxHealth = 5, gameOver = false;
let mouse = {x: width/2, y: height/2};
let lastBirdSpawn = 0, birdSpawnInterval = 1200;
let lastFrame = 0;
let difficulty = 2; // 0-4
let birdColors = ['#ffbe0b', '#3a86ff', '#ff006e'];
let highScores = JSON.parse(localStorage.getItem('duckhunt_highscores') || '[]');

// Keyboard control state
let keyState = {left: false, right: false, up: false, down: false};

// Difficulty settings
const DIFFICULTY_SETTINGS = [
  {name: 'Extra Easy', birdSpeed: [1.2, 1.8], spawn: 1800, birds: [1,1], health: 7},
  {name: 'Easy', birdSpeed: [1.8, 2.5], spawn: 1400, birds: [1,2], health: 6},
  {name: 'Medium', birdSpeed: [2.2, 3.2], spawn: 1000, birds: [1,2], health: 5},
  {name: 'Hard', birdSpeed: [2.8, 4.2], spawn: 700, birds: [2,3], health: 4},
  {name: 'Extra Hard', birdSpeed: [4, 6], spawn: 420, birds: [3,4], health: 3},
];

function setDifficulty(lvl) {
  difficulty = lvl;
  let d = DIFFICULTY_SETTINGS[lvl];
  birdSpawnInterval = d.spawn;
  maxHealth = d.health;
  if (health > maxHealth) health = maxHealth;
  healthText.textContent = `Chances: ${health}`;
  updateHealthBar();
}
setDifficulty(difficulty);

// --- Bird class ---
class Bird {
  constructor() {
    // Randomize spawn side and position
    this.size = 44 + Math.random()*18;
    this.y = 80 + Math.random()*(height-220);
    this.dir = Math.random() > 0.5 ? 1 : -1;
    this.x = this.dir === 1 ? -this.size : width+this.size;
    let s = DIFFICULTY_SETTINGS[difficulty].birdSpeed;
    this.speed = (s[0] + Math.random()*(s[1]-s[0])) * (0.8 + Math.random()*0.4);
    this.vx = this.dir * this.speed;
    this.vy = (Math.random()-0.5) * this.speed * 0.6;
    this.color = birdColors[Math.floor(Math.random()*birdColors.length)];
    this.alive = true;
    this.flap = 0;
    this.flapSpeed = 0.16 + Math.random()*0.08;
    this.hitAnim = 0;
  }
  update(dt) {
    if (!this.alive) {
      this.vy += 0.12*dt;
      this.x += this.vx*0.4*dt;
      this.y += this.vy*dt;
      this.hitAnim += dt*0.03;
      return;
    }
    this.x += this.vx*dt;
    this.y += this.vy*dt;
    this.flap += this.flapSpeed*dt;
    // Randomly change vy for more erratic flight
    if (Math.random() < 0.012 + 0.01*difficulty) {
      this.vy += (Math.random()-0.5) * 2.2;
      this.vy = Math.max(Math.min(this.vy, 2.2*this.speed), -2.2*this.speed);
    }
  }
  isOffScreen() {
    return (this.dir === 1 && this.x > width+this.size) ||
           (this.dir === -1 && this.x < -this.size) ||
           this.y > height+this.size || this.y < -this.size;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.dir, 1);
    // Hit animation
    if (this.hitAnim > 0) {
      ctx.globalAlpha = Math.max(0, 1-this.hitAnim/2);
      ctx.rotate(this.hitAnim*0.3);
    }
    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size*0.7, this.size*0.4, 0, 0, 2*Math.PI);
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Head
    ctx.beginPath();
    ctx.arc(this.size*0.5, -this.size*0.18, this.size*0.22, 0, 2*Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.size*0.5, -this.size*0.18, this.size*0.16, 0, 2*Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
    // Beak
    ctx.save();
    ctx.translate(this.size*0.67, -this.size*0.18);
    ctx.rotate(0.15);
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(this.size*0.18, -this.size*0.04);
    ctx.lineTo(this.size*0.18,  this.size*0.04);
    ctx.closePath();
    ctx.fillStyle = '#f7b801';
    ctx.fill();
    ctx.restore();
    // Eye
    ctx.beginPath();
    ctx.arc(this.size*0.61, -this.size*0.21, this.size*0.04, 0, 2*Math.PI);
    ctx.fillStyle = '#222';
    ctx.fill();
    // Wings (animated)
    ctx.save();
    let wingY = Math.sin(this.flap)*this.size*0.32;
    ctx.beginPath();
    ctx.ellipse(-this.size*0.1, wingY, this.size*0.22, this.size*0.11, Math.PI/5, 0, 2*Math.PI);
    ctx.fillStyle = '#fff8';
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  hitTest(x, y) {
    // Ellipse hit test
    let dx = (x-this.x)/ (this.size*0.7);
    let dy = (y-this.y)/ (this.size*0.4);
    return dx*dx + dy*dy < 1;
  }
}

// --- Bullet class ---
class Bullet {
  constructor(fromX, fromY, toX, toY) {
    this.x = fromX;
    this.y = fromY;
    this.tx = toX;
    this.ty = toY;
    // Calculate direction
    let dx = toX - fromX;
    let dy = toY - fromY;
    let dist = Math.sqrt(dx*dx + dy*dy);
    this.vx = dx / dist;
    this.vy = dy / dist;
    this.speed = 22; // px per frame
    this.dist = dist;
    this.traveled = 0;
    this.radius = 7;
    this.done = false;
    this.hit = false;
  }
  update(dt) {
    let move = this.speed * dt;
    this.x += this.vx * move;
    this.y += this.vy * move;
    this.traveled += move;
    if (this.traveled >= this.dist) {
      this.done = true;
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#ffbe0b';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Draw bullet trail
    ctx.save();
    ctx.strokeStyle = '#ffbe0b88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gun.x, gun.y);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.restore();
  }
}

// --- Gun drawing ---
function drawGun(ctx) {
  ctx.save();
  ctx.translate(gun.x, gun.y+gun.recoil*8);
  // Gun barrel
  ctx.save();
  let angle = Math.atan2(mouse.y-gun.y, mouse.x-gun.x);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(58, -8);
  ctx.lineTo(58, 8);
  ctx.lineTo(0, 8);
  ctx.closePath();
  ctx.fillStyle = '#bfc0c0';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Barrel tip
  ctx.beginPath();
  ctx.arc(58, 0, 7, 0, 2*Math.PI);
  ctx.fillStyle = '#222';
  ctx.fill();
  ctx.restore();
  // Gun body
  ctx.beginPath();
  ctx.ellipse(0, 0, 32, 22, 0, 0, 2*Math.PI);
  ctx.fillStyle = '#22223b';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Handle
  ctx.save();
  ctx.rotate(0.6);
  ctx.beginPath();
  ctx.ellipse(-12, 32, 10, 18, 0, 0, 2*Math.PI);
  ctx.fillStyle = '#fb5607';
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// --- Score popup ---
function showScorePopup(text, x, y, color='#ffbe0b') {
  let popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.style.left = (x-32)+'px';
  popup.style.top = (y-32)+'px';
  popup.style.color = color;
  popup.textContent = text;
  document.body.appendChild(popup);
  setTimeout(()=>popup.remove(), 900);
}

// --- Health bar update ---
function updateHealthBar() {
  let percent = Math.max(0, health/maxHealth);
  healthInner.style.width = (percent*100)+'%';
  healthInner.style.background = percent < 0.5 ? 'linear-gradient(90deg, var(--danger), var(--secondary))' : 'linear-gradient(90deg, var(--success), var(--primary))';
  healthText.textContent = `Chances: ${health}`;
}

// --- Game loop ---
function gameLoop(ts) {
  if (!lastFrame) lastFrame = ts;
  let dt = Math.min(2, (ts-lastFrame)/16.7);
  lastFrame = ts;

  // --- Keyboard movement ---
  let moveSpeed = 8 + 4*difficulty;
  if (keyState.left) gun.x -= moveSpeed*dt;
  if (keyState.right) gun.x += moveSpeed*dt;
  if (keyState.up) gun.y -= moveSpeed*dt;
  if (keyState.down) gun.y += moveSpeed*dt;
  // Clamp gun position
  gun.x = Math.max(40, Math.min(width-40, gun.x));
  gun.y = Math.max(height*0.5, Math.min(height-40, gun.y));
  // Mouse aim overrides gun.x/y
  // (if mouse moved recently, gun follows mouse)
  if (!keyboardActive) {
    gun.x = mouse.x;
    gun.y = mouse.y;
  }

  // Update mouse for gun angle
  // (mouse.x, mouse.y) is always the aim point

  ctx.clearRect(0, 0, width, height);

  // Draw birds
  for (let i=0; i<birds.length; ++i) {
    birds[i].update(dt);
    birds[i].draw(ctx);
  }
  // Remove offscreen or dead birds
  let prevLen = birds.length;
  birds = birds.filter(b=>!b.isOffScreen() && (b.alive || b.hitAnim<1.5));
  if (!gameOver && prevLen !== birds.length) {
    // If a live bird escaped, lose health
    for (let b of birds) if (!b.alive && b.hitAnim<1.5) return;
    let lost = prevLen-birds.length;
    if (lost > 0) {
      health -= lost;
      updateHealthBar();
      missSound.currentTime = 0; missSound.play();
      showScorePopup('Miss!', width/2, 80, '#e63946');
      if (health <= 0) endGame();
    }
  }

  // Draw and update bullets
  for (let i=0; i<bullets.length; ++i) {
    bullets[i].update(dt);
    bullets[i].draw(ctx);
    // Only check for hit if not already hit
    if (!bullets[i].hit && !gameOver) {
      for (let b of birds) {
        if (b.alive && b.hitTest(bullets[i].x, bullets[i].y)) {
          b.alive = false;
          b.hitAnim = 0.01;
          score += 1;
          scoreEl.textContent = 'Score: '+score;
          hitSound.currentTime = 0; hitSound.play();
          showScorePopup('+1', b.x, b.y, b.color);
          bullets[i].hit = true;
          break;
        }
      }
    }
    // If bullet reached target and did not hit, count as miss
    if (!bullets[i].hit && bullets[i].done && !gameOver) {
      health -= 1;
      updateHealthBar();
      missSound.currentTime = 0; missSound.play();
      showScorePopup('Miss!', bullets[i].tx, bullets[i].ty, '#e63946');
      if (health <= 0) endGame();
      bullets[i].hit = true; // avoid double counting
    }
  }
  // Remove bullets that are done
  bullets = bullets.filter(b=>!b.done || !b.hit);

  // Draw gun
  drawGun(ctx);
  // Gun recoil
  gun.recoil *= 0.85;

  // Next bird spawn
  if (!gameOver && ts-lastBirdSpawn > birdSpawnInterval) {
    let n = Math.floor(DIFFICULTY_SETTINGS[difficulty].birds[0] + Math.random()*(DIFFICULTY_SETTINGS[difficulty].birds[1]-DIFFICULTY_SETTINGS[difficulty].birds[0]+1));
    for (let i=0; i<n; ++i) birds.push(new Bird());
    lastBirdSpawn = ts;
  }
  if (!gameOver) requestAnimationFrame(gameLoop);
}

// --- Input ---
let keyboardActive = false;
function aim(e) {
  if (e.touches) {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  } else {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }
  keyboardActive = false;
}
function shootAt(x, y) {
  if (gameOver) return;
  gun.recoil = 1;
  shootSound.currentTime = 0; shootSound.play();
  bullets.push(new Bullet(gun.x, gun.y, x, y));
}
function shoot(e) {
  if (gameOver) return;
  shootAt(mouse.x, mouse.y);
}

// --- Keyboard controls ---
window.addEventListener('keydown', function(e) {
  keyboardActive = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyState.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyState.right = true;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keyState.up = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keyState.down = true;
  // Shoot with spacebar
  if (e.key === ' ' || e.key === 'Spacebar') {
    // Aim at mouse position if mouse moved, otherwise aim straight up
    let aimX = mouse.x, aimY = mouse.y;
    if (keyboardActive) {
      // Aim straight up
      aimX = gun.x;
      aimY = gun.y - 300;
    }
    shootAt(aimX, aimY);
  }
});
window.addEventListener('keyup', function(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyState.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyState.right = false;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keyState.up = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keyState.down = false;
});

// --- Game over ---
function endGame() {
  gameOver = true;
  finalScoreEl.textContent = `Final Score: ${score}`;
  gameOverEl.classList.remove('hidden');
  // Update leaderboard
  highScores.push(score);
  highScores = highScores.sort((a,b)=>b-a).slice(0,5);
  localStorage.setItem('duckhunt_highscores', JSON.stringify(highScores));
  renderLeaderboard();
}
function renderLeaderboard() {
  highScoresEl.innerHTML = '';
  for (let i=0; i<highScores.length; ++i) {
    let li = document.createElement('li');
    li.textContent = `${i+1}. ${highScores[i]}`;
    highScoresEl.appendChild(li);
  }
}
function restartGame() {
  birds = [];
  bullets = [];
  score = 0;
  health = maxHealth = DIFFICULTY_SETTINGS[difficulty].health;
  scoreEl.textContent = 'Score: 0';
  updateHealthBar();
  gameOver = false;
  gameOverEl.classList.add('hidden');
  lastBirdSpawn = 0;
  lastFrame = 0;
  requestAnimationFrame(gameLoop);
}

// --- Difficulty selector ---
difficultySel.onchange = function() {
  setDifficulty(+difficultySel.value);
};
window.addEventListener('resize', ()=>{
  width = window.innerWidth; height = window.innerHeight;
  canvas.width = width; canvas.height = height;
  gun.x = width/2; gun.y = height-80;
});

// --- Event listeners ---
canvas.addEventListener('mousemove', aim);
canvas.addEventListener('touchmove', aim, {passive:false});
canvas.addEventListener('mousedown', shoot);
canvas.addEventListener('touchstart', function(e){e.preventDefault(); shoot(e);}, {passive:false});
restartBtn.onclick = restartGame;

// --- Start game ---
function init() {
  gun.x = width/2; gun.y = height-80;
  score = 0; birds = []; bullets = [];
  setDifficulty(difficulty);
  scoreEl.textContent = 'Score: 0';
  updateHealthBar();
  gameOver = false;
  gameOverEl.classList.add('hidden');
  renderLeaderboard();
  lastBirdSpawn = 0;
  lastFrame = 0;
  requestAnimationFrame(gameLoop);
}
init();
