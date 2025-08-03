// DOM Elements for both emotion detection and whack-a-mole
const video = document.getElementById('video');
const emotionLabel = document.getElementById('emotionLabel');
const confidenceScore = document.getElementById('confidenceScore');

const emotionColors = {
  happy: { 
    color: '#ee7752'
  },
  sad: { 
    color: '#46b491ff'
  },
  angry: { 
    color: '#23d5ab'
  },
  surprised: { 
    color: '#9370DB'
  },
  fearful: { 
    color: '#23a6d5'
  },
  disgusted: { 
    color: '#6B8E23'
  },
  neutral: { 
    color: '#e73c7e'
  }
};

const emotionSpeeds = {
    neutral: { speed: 150, scorePerFruit: 10 },   // Medium - default
  happy: { speed: 100, scorePerFruit: 5 },      // Very fast - high energy
  surprised: { speed: 210, scorePerFruit: 20 },  // Fast - excitement
  angry: { speed: 220, scorePerFruit: 20 },      // Medium-fast - intensity
  fearful: { speed: 170, scorePerFruit: 20 },  // Slow - anxiety
  disgusted: { speed: 180, scorePerFruit: 20 }, // Slower - negative emotion
  sad: { speed: 250, scorePerFruit: 50 }       // Slowest - low energy
};
let currentSpeed = emotionSpeeds.neutral.speed;
let targetSpeed = emotionSpeeds.neutral.speed;
let currentScorePerFruit = emotionSpeeds.neutral.scorePerFruit;
let targetScorePerFruit = emotionSpeeds.neutral.scorePerFruit;

let lastEmotion = 'neutral';


document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const CANVAS_SIZE = 400;
    const GRID_SIZE = 20;

    // Difficulty Modes
    const MODES = {
        super_easy: { speed: 250, scorePerFruit: 50 },
        easy: { speed: 200, scorePerFruit: 20 },
        medium: { speed: 150, scorePerFruit: 10 },
        hard: { speed: 100, scorePerFruit: 5 },
        super_hard: { speed: 70, scorePerFruit: 1 }
    };

    const FRUIT_EMOJIS = ['🍎', '🍓', '🍇', '🍉', '🍒', '🍍', '🥭'];

    // DOM Elements
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('high-score');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const startScreen = document.getElementById('startScreen');
    const mainGameUI = document.getElementById('mainGameUI');
    const modeButtons = document.querySelectorAll('.mode-selection button');

    // Game state
    let snake, food, score, highScore, direction, dx, dy, speed, scorePerFruit, inputBuffer, gameLoopTimeout;

    // Initialize high score from local storage
    highScore = localStorage.getItem('snakeHighScore') || 0;
    highScoreEl.textContent = highScore;

    function startGame(mode) {
        const settings = MODES[mode];
        startScreen.classList.add('hidden');
        mainGameUI.classList.remove('hidden');
        init(settings);
    }

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            startGame(mode);
        });
    });

    function init(settings) {
        // Set game parameters from selected mode
        speed = currentSpeed;
        scorePerFruit = currentScorePerFruit;


        // Reset game state
        snake = [{ x: 10, y: 10 }];
        score = 0;
        direction = 'RIGHT';
        dx = 1;
        dy = 0;
        inputBuffer = [];

        scoreEl.textContent = score;
        gameOverScreen.classList.add('hidden');

        generateFood();

        if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
        main();
    }

    // Main game loop
    function main() {
        
        // Interpolate smoothly
        const lerpFactor = 0.05;
        currentSpeed += (targetSpeed - currentSpeed) * lerpFactor;
        currentScorePerFruit += (targetScorePerFruit - currentScorePerFruit) * lerpFactor;

        displaySnakeDifficulty(lastEmotion || 'neutral');

        // Use interpolated values
        speed = Math.round(currentSpeed);
        scorePerFruit = Math.round(currentScorePerFruit);
        gameLoopTimeout = setTimeout(() => {
            if (isGameOver()) {
                showGameOver();
                return;
            }

            processInput();
            clearCanvas();
            drawFood();
            advanceSnake();
            drawSnake();

            main();
        }, speed);
    }

    // Move the snake and handle food collision
    function advanceSnake() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += scorePerFruit; // Use mode-specific score
            scoreEl.textContent = score;
            // Note: Speed no longer increases automatically to keep difficulty consistent
            generateFood();
        } else {
            snake.pop();
        }
    }

    // Game over logic
    function showGameOver() {
        if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        gameOverScreen.classList.remove('hidden');
        document.addEventListener('keydown', returnToMenu);
    }

    // Return to start screen
    function returnToMenu(event) {
        if (event.key === 'Enter') {
            document.removeEventListener('keydown', returnToMenu);
            mainGameUI.classList.add('hidden');
            startScreen.classList.remove('hidden');
        }
    }

    // --- All other functions (drawing, controls, etc.) remain the same ---

    function processInput() {
        if (inputBuffer.length === 0) return;
        const nextDirection = inputBuffer.shift();
        const goingUp = dy === -1, goingDown = dy === 1, goingRight = dx === 1, goingLeft = dx === -1;
        if (nextDirection === 'LEFT' && !goingRight) { dx = -1; dy = 0; direction = 'LEFT'; }
        else if (nextDirection === 'UP' && !goingDown) { dx = 0; dy = -1; direction = 'UP'; }
        else if (nextDirection === 'RIGHT' && !goingLeft) { dx = 1; dy = 0; direction = 'RIGHT'; }
        else if (nextDirection === 'DOWN' && !goingUp) { dx = 0; dy = 1; direction = 'DOWN'; }
    }

    function changeDirection(event) {
        const keyPressed = event.key;
        let newDirection;
        if (keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') newDirection = 'LEFT';
        if (keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') newDirection = 'UP';
        if (keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') newDirection = 'RIGHT';
        if (keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') newDirection = 'DOWN';
        if (!newDirection) return;
        const lastDirection = inputBuffer.length > 0 ? inputBuffer[inputBuffer.length - 1] : direction;
        if ((newDirection === 'LEFT' && lastDirection === 'RIGHT') || (newDirection === 'RIGHT' && lastDirection === 'LEFT') || (newDirection === 'UP' && lastDirection === 'DOWN') || (newDirection === 'DOWN' && lastDirection === 'UP')) return;
        inputBuffer.push(newDirection);
    }
    document.addEventListener('keydown', changeDirection);

    function isGameOver() {
        const head = snake[0];
        if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE || head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) return true;
        for (let i = 1; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) return true;
        }
        return false;
    }

    function clearCanvas() {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    function drawSnake() {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = GRID_SIZE * 0.9;
        ctx.strokeStyle = '#30fa08ff';
        if (snake.length > 1) {
            ctx.beginPath();
            const last_but_one = snake[snake.length - 2], tail = snake[snake.length - 1];
            const tail_mid_x = (last_but_one.x + tail.x) * GRID_SIZE / 2 + GRID_SIZE / 2;
            const tail_mid_y = (last_but_one.y + tail.y) * GRID_SIZE / 2 + GRID_SIZE / 2;
            ctx.moveTo(tail_mid_x, tail_mid_y);
            for (let i = snake.length - 2; i > 0; i--) {
                const mid_x = (snake[i].x + snake[i - 1].x) * GRID_SIZE / 2 + GRID_SIZE / 2;
                const mid_y = (snake[i].y + snake[i - 1].y) * GRID_SIZE / 2 + GRID_SIZE / 2;
                ctx.quadraticCurveTo(snake[i].x * GRID_SIZE + GRID_SIZE / 2, snake[i].y * GRID_SIZE + GRID_SIZE / 2, mid_x, mid_y);
            }
            ctx.stroke();
        }
        const head = snake[0];
        ctx.fillStyle = '#03940aff';
        ctx.beginPath();
        ctx.arc(head.x * GRID_SIZE + GRID_SIZE / 2, head.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2, 0, 2 * Math.PI);
        ctx.fill();
        drawEyes(head);
    }

    function drawEyes(head) {
        ctx.fillStyle = 'white';
        const eyeRadius = GRID_SIZE / 6;
        const headCenterX = head.x * GRID_SIZE + GRID_SIZE / 2;
        const headCenterY = head.y * GRID_SIZE + GRID_SIZE / 2;
        const eyeOffset = GRID_SIZE / 4;
        let eye1X, eye1Y, eye2X, eye2Y;
        switch (direction) {
            case 'UP': eye1X = headCenterX - eyeOffset; eye1Y = headCenterY - eyeOffset; eye2X = headCenterX + eyeOffset; eye2Y = headCenterY - eyeOffset; break;
            case 'DOWN': eye1X = headCenterX - eyeOffset; eye1Y = headCenterY + eyeOffset; eye2X = headCenterX + eyeOffset; eye2Y = headCenterY + eyeOffset; break;
            case 'LEFT': eye1X = headCenterX - eyeOffset; eye1Y = headCenterY - eyeOffset; eye2X = headCenterX - eyeOffset; eye2Y = headCenterY + eyeOffset; break;
            case 'RIGHT': eye1X = headCenterX + eyeOffset; eye1Y = headCenterY - eyeOffset; eye2X = headCenterX + eyeOffset; eye2Y = headCenterY + eyeOffset; break;
        }
        ctx.beginPath(); ctx.arc(eye1X, eye1Y, eyeRadius, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(eye2X, eye2Y, eyeRadius, 0, 2 * Math.PI); ctx.fill();
    }

    function drawFood() {
         ctx.fillStyle = '#FF4136'; ctx.strokeStyle = '#FF851B'; ctx.lineWidth = 2;
         const foodX = food.x * GRID_SIZE, foodY = food.y * GRID_SIZE;
         ctx.beginPath(); ctx.arc(foodX + GRID_SIZE / 2, foodY + GRID_SIZE / 2, GRID_SIZE / 2.2, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
     }
 
     function generateFood() {
         let newFoodPosition;
         do {
             newFoodPosition = { x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)), y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) };
         } while (snake.some(part => part.x === newFoodPosition.x && part.y === newFoodPosition.y));
         food = newFoodPosition;
     }

    function drawFood() {
        // Set the font size and alignment for the emoji
        ctx.font = `${GRID_SIZE * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const foodX = food.x * GRID_SIZE + GRID_SIZE / 2;
        const foodY = food.y * GRID_SIZE + GRID_SIZE / 2;

        // Draw the emoji from the food object
        ctx.fillText(food.emoji, foodX, foodY);
    }

    function generateFood() {
        let newFoodPosition;
        do {
            newFoodPosition = {
                x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
                y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
                // Add this line to pick a random emoji
                emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)]
            };
        } while (snake.some(part => part.x === newFoodPosition.x && part.y === newFoodPosition.y));
        food = newFoodPosition;
    }
});

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

function displaySnakeDifficulty(emotion) {
    const settings = emotionSpeeds[emotion] || emotionSpeeds.neutral;
  targetSpeed = settings.speed;
  targetScorePerFruit = settings.scorePerFruit
  const diffDiv = document.getElementById('diff-display');
  if (!diffDiv) return;

  const speedText = Math.round(currentSpeed);
  const scoreText = Math.round(currentScorePerFruit);

  diffDiv.innerHTML = `
    <strong>Emotion:</strong> ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}<br/>
    <strong>Speed:</strong> ${speedText} ms/frame<br/>
    <strong>Fruit Score:</strong> ${scoreText}
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
video.addEventListener('play', () => {
    // Wait for video to have dimensions
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  //const canvas = faceapi.createCanvasFromMedia(video);  
  
  //document.querySelector('.video-container').appendChild(canvas);
  //faceapi.matchDimensions(canvas, displaySize);

  const detectionInterval = setInterval(async () => {
    const detections = await faceapi.detectAllFaces(
      video, 
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    //canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    // Extract and display emotions + change background + update game speed
    if (detections.length > 0) {
      const expressions = detections[0].expressions;
      const result = getHighestEmotion(expressions);
      
      emotionLabel.textContent = formatEmotionName(result.emotion);
      confidenceScore.textContent = `Confidence: ${formatConfidence(result.confidence)}`;

      // Change background color and update game speed based on detected emotion
      changeBackgroundColor(result.emotion);

      if (result.emotion !== lastEmotion) {
        displaySnakeDifficulty(lastEmotion);
        lastEmotion = result.emotion;
      }
    } else {
      emotionLabel.textContent = 'No face detected';
      confidenceScore.textContent = '---';
      // Reset to neutral color and speed when no face is detected
      changeBackgroundColor('neutral');
      if (lastEmotion !== 'neutral') {
        displaySnakeDifficulty(lastEmotion);
        lastEmotion = 'neutral';
      }
    }
  }, 500);
});