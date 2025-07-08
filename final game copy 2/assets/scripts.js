const holes = document.querySelectorAll(".hole");
const scoreBoard = document.querySelector(".score");
const moles = document.querySelectorAll(".mole");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const modeSel = document.getElementById("mode");

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
