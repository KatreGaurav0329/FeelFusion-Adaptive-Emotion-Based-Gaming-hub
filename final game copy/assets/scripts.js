const holes = document.querySelectorAll(".hole");
const scoreBoard = document.querySelector(".score");
const moles = document.querySelectorAll(".mole");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const modeSel = document.getElementById("mode");

let lastHole;
let timeUp = false;
let score = 0;
let gameTimer = null;
let peepTimer = null;

const modeSpeeds = {
  easy: { min: 800, max: 1500 },
  medium: { min: 400, max: 1000 },
  hard: { min: 200, max: 700 }
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
  gameTimer = setTimeout(() => endGame(), 15000); // 15 seconds game
}

function endGame() {
  timeUp = true;
  startBtn.disabled = false;
  endBtn.disabled = true;
  clearTimeout(gameTimer);
  clearTimeout(peepTimer);
  holes.forEach(hole => hole.classList.remove("up"));
}

function bonk(e) {
  if (!e.isTrusted) return;
  score++;
  this.classList.remove("up");
  scoreBoard.textContent = score;
}

moles.forEach(mole => mole.addEventListener("click", bonk));
startBtn.addEventListener("click", startGame);
endBtn.addEventListener("click", endGame);
