const video = document.getElementById('video');
const emotionLabel = document.getElementById('emotionLabel');
const confidenceScore = document.getElementById('confidenceScore');
const colorInfo = document.getElementById('colorInfo');
const emotionColors = {
  happy: { 
    color: '#1a9cddff' 
  },
  sad: { 
    color: '#00c9d7ff'
  },
  angry: { 
    color: '#1088f189'
  },
  surprised: { 
    color: '#6e32e7ff' 
  },
  fearful: { 
    color: '#350b6fff'
  },
  disgusted: { 
    color: '#1f8559ff'
  },
  neutral: { 
    color: '#208dd5af'
  }
};

const expressionQuotes = {
  neutral: [
    "Let's see how sharp your memory really is.",
    "Every flip is a step closer to mastering the mind.",
    "Precision matters. No rush, just focus.",
    "Can you feel the patterns forming?",
    "Steady hands, steady mind."
  ],
  happy: [
    "You're on fire! Keep it going!",
    "Memory like a steel trap, impressive!",
    "Cards love your vibes today!",
    "Feeling good? Your brain's dancing too!",
    "You + These cards = Perfect match."
  ],
  sad: [
    "Hey, you're doing better than you think.",
    "Mistakes are just memories waiting to be formed.",
    "It's okay. Take a deep breath. You've got this.",
    "Even on tough days, your mind is stronger than you realize.",
    "Slow and steady wins the memory race."
  ],
  angry: [
    "Don't let the cards win. Show them who's boss.",
    "Control the rage, control the game.",
    "Fuel that fire, turn it into focus.",
    "Every mismatch is just data for domination.",
    "Take a breath. Now strike with precision."
  ],
  disgusted: [
    "Okay, the cards may be ugly, but your skills? Beautiful.",
    "Yeah, some flips stink. Let's clean that up.",
    "Not every match is pretty. But victory is.",
    "Even chaos has a pattern. Find it.",
    "Let's turn this mess into a masterpiece."
  ],
  surprised: [
    "Whoa! Didn't see that one coming, did you?",
    "Plot twist! Now that's interesting.",
    "Memory can surprise even the sharpest minds.",
    "The game's full of tricks. Stay alert.",
    "Expect the unexpected... and flip wisely."
  ]
};

// 1) Track last shown emotion and last update time
let lastEmotion = null;
let lastQuoteTime = 0;
const MIN_POPUP_INTERVAL = 10000; // 10 seconds

function updateExpressionPopup(emotion) {
  const now = Date.now();
  // Only update if emotion has changed, or minimum interval has passed
  if (emotion === lastEmotion && now - lastQuoteTime < MIN_POPUP_INTERVAL) {
    return;
  }
  lastEmotion = emotion;
  lastQuoteTime = now;

  const popup = document.getElementById('expression-popup');
  const quotes = expressionQuotes[emotion] || expressionQuotes.neutral;
  let newQuote;
  do {
    newQuote = quotes[Math.floor(Math.random() * quotes.length)];
  } while (popup.textContent === newQuote && quotes.length > 1);

  popup.textContent = newQuote;
  popup.style.opacity = '1';
  clearTimeout(popup.fadeTimeout);
  popup.fadeTimeout = setTimeout(() => {
    popup.style.opacity = '0.8';
  }, MIN_POPUP_INTERVAL);
}


// Game Variables
const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const movesElement = document.getElementById('moves');



let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let score = 0;
let lockBoard = false;

/* ===== Difficulty Settings ===== */
const difficultySettings = {
    easy:   { pairs: 4, symbols: ['🎮','🎯','🎪','🎨'] },
    medium: { pairs: 6, symbols: ['🎮','🎯','🎪','🎨','🎭','🎸'] },
    hard:   { pairs: 8, symbols: ['🎮','🎯','🎪','🎨','🎭','🎸','🚀','⭐'] }
};
let currentDifficulty = 'medium';   // default

/* ===== Timer ===== */
let timerId;
let timeElapsed = 0;                // seconds
let gamePaused = false;

// Card symbols/emojis (6 pairs = 12 cards total)
const cardSymbols = ['🎮', '🎯', '🎪', '🎨', '🎭', '🎸'];

// Initialize Game
function initGame() {
    const { pairs, symbols } = difficultySettings[currentDifficulty];

    // Build a deck = symbols duplicated once
    const deck = [...symbols.slice(0, pairs), ...symbols.slice(0, pairs)];
    shuffleArray(deck);

    gameBoard.className = 'memory-game ' + currentDifficulty; // adjust grid size
    gameBoard.innerHTML = '';          // clear board

    deck.forEach((sym, i) => gameBoard.appendChild(createCard(sym, i)));

    resetGameState();                  // moves, score, etc.
    startTimer();                      // begin counting
}


// Create individual card element
function createCard(symbol, index) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.symbol = symbol;
    card.dataset.index = index;
    
    card.innerHTML = `
        <div class="card-face card-front">${symbol}</div>
        <div class="card-face card-back">?</div>
    `;
    
    card.addEventListener('click', flipCard);
    return card;
}

// Fisher-Yates Shuffle Algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
function startTimer() {
    clearInterval(timerId);       // safety
    timerId = setInterval(() => {
        if (!gamePaused) {
            timeElapsed++;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = String(Math.floor(timeElapsed / 60)).padStart(2,'0');
    const secs = String(timeElapsed % 60).padStart(2,'0');
    document.getElementById('timer').textContent = `${mins}:${secs}`;
}

function togglePause() {
    gamePaused = !gamePaused;
    document.getElementById('pause-btn').textContent = gamePaused ? 'Resume' : 'Pause';
}

// Card Flip Logic
function flipCard() {
    // Prevent flipping if board is locked or card is already flipped
    if (lockBoard || this.classList.contains('flipped') || this.classList.contains('matched')) {
        return;
    }
    
    // Flip the card
    this.classList.add('flipped');
    flippedCards.push(this);
    
    // Check if two cards are flipped
    if (flippedCards.length === 2) {
        lockBoard = true;
        moves++;
        movesElement.textContent = moves;
        
        // Check for match after a short delay
        setTimeout(checkForMatch, 600);
    }
}

// Check if flipped cards match
function checkForMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.symbol === card2.dataset.symbol;
    
    if (isMatch) {
        handleMatch();
    } else {
        handleMismatch();
    }
    
    // Reset flipped cards array and unlock board
    flippedCards = [];
    lockBoard = false;
}

// Handle matched cards
function handleMatch() {
    const [card1, card2] = flippedCards;
    
    card1.classList.add('matched');
    card2.classList.add('matched');
    card1.removeEventListener('click', flipCard);
    card2.removeEventListener('click', flipCard);
    
    matchedPairs++;
    score += 10;
    scoreElement.textContent = score;
    
    // Check if game is won
    if (matchedPairs === cardSymbols.length) {
        setTimeout(() => {
            alert(`Congratulations! You won in ${moves} moves with a score of ${score}!`);
        }, 500);
    }

    if (matchedPairs === difficultySettings[currentDifficulty].pairs) {
    clearInterval(timerId);
    setTimeout(() => {
        alert(`You won ${currentDifficulty.toUpperCase()} mode in ${moves} moves, ${timeElapsed}s!`);
    }, 500);
}

}

// Handle mismatched cards
function handleMismatch() {
    const [card1, card2] = flippedCards;
    
    setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
    }, 1000);
}

// Reset game state
function resetGameState() {
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    score = 0;
    lockBoard = false;
    
    scoreElement.textContent = score;
    movesElement.textContent = moves;

    timeElapsed = 0;
    updateTimerDisplay();
    clearInterval(timerId);
}

// Restart game function
function restartGame() {
    initGame();
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

// Function to change background color based on emotion
function changeBackgroundColor(emotion) {
  const colorData = emotionColors[emotion];
  if (colorData) {
    // Smoothly transition background color
    document.body.style.backgroundColor = colorData.color;
    
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
      updateExpressionPopup(result.emotion);
    } else {
      emotionLabel.textContent = 'No face detected';
      confidenceScore.textContent = '---';
      // Reset to neutral color when no face is detected
      changeBackgroundColor('neutral');
      updateExpressionPopup('neutral');

    }
  }, 100);
});

// Start the game when page loads
document.addEventListener('DOMContentLoaded', initGame);
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        // UI state
        document.querySelector('.difficulty-btn.active').classList.remove('active');
        e.target.classList.add('active');

        // Change difficulty & restart
        currentDifficulty = e.target.dataset.difficulty;
        restartGame();
    });
});