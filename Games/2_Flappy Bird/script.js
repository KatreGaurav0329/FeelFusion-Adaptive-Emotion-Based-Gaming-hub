// DOM Elements for both emotion detection and whack-a-mole
const video = document.getElementById('video');
const emotionLabel = document.getElementById('emotionLabel');
const confidenceScore = document.getElementById('confidenceScore');

const emotionGameSettings = {
  neutral: {
    pipeGap: 35,          
    pipeSpeed: 3,         
    pipeFrequency: 115    
  },
  happy: {
    pipeGap: 30,
    pipeSpeed: 4,
    pipeFrequency: 100
  },
  sad: {
    pipeGap: 45,
    pipeSpeed: 2.5,
    pipeFrequency: 130
  },
  angry: {
    pipeGap: 40,
    pipeSpeed: 3.5,
    pipeFrequency: 110
  },
  surprised: {
    pipeGap: 32,
    pipeSpeed: 4.2,
    pipeFrequency: 95
  },
  fearful: {
    pipeGap: 38,
    pipeSpeed: 3,
    pipeFrequency: 120
  },
  disgusted: {
    pipeGap: 42,
    pipeSpeed: 2.8,
    pipeFrequency: 125
  }
};
// Start with neutral config
let lastEmotion = 'neutral';
let currentPipeGap = emotionGameSettings.neutral.pipeGap;
let currentPipeSpeed = emotionGameSettings.neutral.pipeSpeed;
let currentPipeFrequency = emotionGameSettings.neutral.pipeFrequency;

// For smooth transition 
let targetPipeGap = currentPipeGap;
let targetPipeSpeed = currentPipeSpeed;
let targetPipeFrequency = currentPipeFrequency;


let move_speed = currentPipeSpeed, grativy = 0.5;
let bird = document.querySelector('.bird');
let img = document.getElementById('bird-1');
let sound_point = new Audio('sounds effect/point.mp3');
let sound_die = new Audio('sounds effect/die.mp3');

// getting bird element properties
let bird_props = bird.getBoundingClientRect();

// This method returns DOMReact -> top, right, bottom, left, x, y, width and height
let background = document.querySelector('.background').getBoundingClientRect();

let score_val = document.querySelector('.score_val');
let message = document.querySelector('.message');
let score_title = document.querySelector('.score_title');

let game_state = 'Start';
img.style.display = 'none';
message.classList.add('messageStyle');

document.addEventListener('keydown', (e) => {
    
    if(e.key == 'Enter' && game_state != 'Play'){
        document.querySelectorAll('.pipe_sprite').forEach((e) => {
            e.remove();
        });
        img.style.display = 'block';
        bird.style.top = '40vh';
        game_state = 'Play';
        message.innerHTML = '';
        score_title.innerHTML = 'Score : ';
        score_val.innerHTML = '0';
        message.classList.remove('messageStyle');
        play();
    }
});

function play(){
    function move(){
        if(game_state != 'Play') return;

        updateDynamicSettings();
        displayFlappyDifficulty(lastEmotion || 'neutral');

        let pipe_sprite = document.querySelectorAll('.pipe_sprite');
        pipe_sprite.forEach((element) => {
            let pipe_sprite_props = element.getBoundingClientRect();
            bird_props = bird.getBoundingClientRect();

            if(pipe_sprite_props.right <= 0){
                element.remove();
            }else{
                if(bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width && bird_props.left + bird_props.width > pipe_sprite_props.left && bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height && bird_props.top + bird_props.height > pipe_sprite_props.top){
                    game_state = 'End';
                    message.innerHTML = 'Game Over'.fontcolor('red') + '<br>Press Enter To Restart';
                    message.classList.add('messageStyle');
                    img.style.display = 'none';
                    sound_die.play();
                    return;
                }else{
                    if(pipe_sprite_props.right < bird_props.left && pipe_sprite_props.right + move_speed >= bird_props.left && element.increase_score == '1'){
                        score_val.innerHTML = +score_val.innerHTML + 1;
                        sound_point.play();
                    }
                    element.style.left = pipe_sprite_props.left - currentPipeSpeed + 'px';
                }
            }
        });
        requestAnimationFrame(move);
    }
    requestAnimationFrame(move);

    let bird_dy = 0;
    function apply_gravity(){
        if(game_state != 'Play') return;
        bird_dy = bird_dy + grativy;
        document.addEventListener('keydown', (e) => {
            if(e.key == 'ArrowUp' || e.key == ' '){
                img.src = 'images/Bird-2.png';
                bird_dy = -7.6;
            }
        });

        document.addEventListener('keyup', (e) => {
            if(e.key == 'ArrowUp' || e.key == ' '){
                img.src = 'images/Bird.png';
            }
        });

        if(bird_props.top <= 0 || bird_props.bottom >= background.bottom){
            game_state = 'End';
            message.style.left = '28vw';
            window.location.reload();
            message.classList.remove('messageStyle');
            return;
        }
        bird.style.top = bird_props.top + bird_dy + 'px';
        bird_props = bird.getBoundingClientRect();
        requestAnimationFrame(apply_gravity);
    }
    requestAnimationFrame(apply_gravity);

    let pipe_seperation = 0;

    let pipe_gap = 35;

    function create_pipe(){
        if(game_state != 'Play') return;

        if(pipe_seperation > currentPipeFrequency){
            pipe_seperation = 0;

            let pipe_posi = Math.floor(Math.random() * 43) + 8;
            let pipe_sprite_inv = document.createElement('div');
            pipe_sprite_inv.className = 'pipe_sprite';
            pipe_sprite_inv.style.top = pipe_posi - 70 + 'vh';
            pipe_sprite_inv.style.left = '100vw';

            document.body.appendChild(pipe_sprite_inv);
            let pipe_sprite = document.createElement('div');
            pipe_sprite.className = 'pipe_sprite';
            pipe_sprite.style.top = pipe_posi + currentPipeGap + 'vh';
            pipe_sprite.style.left = '100vw';
            pipe_sprite.increase_score = '1';

            document.body.appendChild(pipe_sprite);
        }
        pipe_seperation++;
        requestAnimationFrame(create_pipe);
    }
    requestAnimationFrame(create_pipe);
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


function updateDynamicSettings() {
  const lerpFactor = 0.05; // adjust between 0 and 1 for smoothing speed

  currentPipeGap += (targetPipeGap - currentPipeGap) * lerpFactor;
  currentPipeSpeed += (targetPipeSpeed - currentPipeSpeed) * lerpFactor;
  currentPipeFrequency += (targetPipeFrequency - currentPipeFrequency) * lerpFactor;
}

function displayFlappyDifficulty(emotion) {
  const diffDiv = document.getElementById('flappy-diff-display');
  if (!diffDiv) return;

  // Use current (interpolated) values for smoothness
  diffDiv.innerHTML = `
    <b>Emotion:</b> ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}<br/>
    <b>Pipe Gap:</b> ${currentPipeGap.toFixed(1)}<br/>
    <b>Speed:</b> ${currentPipeSpeed.toFixed(2)}<br/>
    <b>Pipe Frequency:</b> ${currentPipeFrequency.toFixed(0)}
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
      

      // On emotion change, update target pipe parameters smoothly
      if (result.emotion !== lastEmotion) {
        let settings = emotionGameSettings[result.emotion] || emotionGameSettings.neutral;
        targetPipeGap = settings.pipeGap;
        targetPipeSpeed = settings.pipeSpeed;
        targetPipeFrequency = settings.pipeFrequency;
        lastEmotion = result.emotion;
      }
    } else {
        emotionLabel.textContent = 'No face detected';
        confidenceScore.textContent = '---';

        if (lastEmotion !== 'neutral') {
          let settings = emotionGameSettings.neutral;
          targetPipeGap = settings.pipeGap;
          targetPipeSpeed = settings.pipeSpeed;
          targetPipeFrequency = settings.pipeFrequency;
          lastEmotion = 'neutral';
        }
      }
  }, 500);
});
