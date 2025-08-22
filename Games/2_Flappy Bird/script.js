// DOM Elements for both emotion detection and whack-a-mole
const video = document.getElementById('video');
const emotionLabel = document.getElementById('emotionLabel');
const confidenceScore = document.getElementById('confidenceScore');

const emotionGameSettings = {
  neutral: {
    pipeGap: 35,
    pipeSpeed: 3,
    pipeFrequency: 115,
    brightness: 1,      // NEW: Normal brightness
    pipeScale: 1,       // NEW: Normal pipe length
  },
  happy: {
    pipeGap: 30,
    pipeSpeed: 4,
    pipeFrequency: 100,
    brightness: 1.2,    // NEW: Brighter background
    pipeScale: 1.1,     // NEW: Longer pipes
  },
  sad: {
    pipeGap: 45,
    pipeSpeed: 2.5,
    pipeFrequency: 130,
    brightness: 0.65,   // NEW: Dimmer background
    pipeScale: 0.85,    // NEW: Shorter pipes
  },
  angry: {
    pipeGap: 40,
    pipeSpeed: 3.5,
    pipeFrequency: 110,
    brightness: 0.85,   // NEW: Slightly darker, intense feel
    pipeScale: 1.15,    // NEW: Longer, more imposing pipes
  },
  surprised: {
    pipeGap: 32,
    pipeSpeed: 4.2,
    pipeFrequency: 95,
    brightness: 1.15,   // NEW: Bright flash of surprise
    pipeScale: 1.05,    // NEW: Slightly longer pipes
  },
  fearful: {
    pipeGap: 38,
    pipeSpeed: 3,
    pipeFrequency: 120,
    brightness: 0.7,    // NEW: Darker, more ominous
    pipeScale: 0.9,     // NEW: Shorter, less threatening pipes
  },
  disgusted: {
    pipeGap: 42,
    pipeSpeed: 2.8,
    pipeFrequency: 125,
    brightness: 0.8,    // NEW: Muted, dull colors
    pipeScale: 0.95,    // NEW: Slightly shorter pipes
  }
};

// Start with neutral config
let lastEmotion = 'neutral';
let currentPipeGap = emotionGameSettings.neutral.pipeGap;
let currentPipeSpeed = emotionGameSettings.neutral.pipeSpeed;
let currentPipeFrequency = emotionGameSettings.neutral.pipeFrequency;
let currentBrightness = emotionGameSettings.neutral.brightness; // NEW:
let currentPipeScale = emotionGameSettings.neutral.pipeScale;   // NEW:

// For smooth transition 
let targetPipeGap = currentPipeGap;
let targetPipeSpeed = currentPipeSpeed;
let targetPipeFrequency = currentPipeFrequency;
let targetBrightness = currentBrightness; // NEW:
let targetPipeScale = currentPipeScale;   // NEW:

let grativy = 0.5;
let bird = document.querySelector('.bird');
let img = document.getElementById('bird-1');
let sound_point = new Audio('sounds effect/point.mp3');
let sound_die = new Audio('sounds effect/die.mp3');

let bird_props = bird.getBoundingClientRect();
let background = document.querySelector('.background'); // MODIFIED: Get the element, not its props yet.
let background_props = background.getBoundingClientRect();

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

        // MODIFIED: Apply visual styles every frame
        background.style.filter = `brightness(${currentBrightness})`;

        let pipe_sprite = document.querySelectorAll('.pipe_sprite');
        pipe_sprite.forEach((element) => {
            // MODIFIED: Apply scale transform to pipes
            element.style.transform = `scaleY(${currentPipeScale})`;

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
                    if(pipe_sprite_props.right < bird_props.left && pipe_sprite_props.right + currentPipeSpeed >= bird_props.left && element.increase_score == '1'){
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

        if(bird_props.top <= 0 || bird_props.bottom >= background_props.bottom){
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

// MODIFIED: This function now smooths the new visual properties as well.
function updateDynamicSettings() {
    const lerpFactor = 0.05;

    currentPipeGap += (targetPipeGap - currentPipeGap) * lerpFactor;
    currentPipeSpeed += (targetPipeSpeed - currentPipeSpeed) * lerpFactor;
    currentPipeFrequency += (targetPipeFrequency - currentPipeFrequency) * lerpFactor;
    currentBrightness += (targetBrightness - currentBrightness) * lerpFactor; // NEW:
    currentPipeScale += (targetPipeScale - currentPipeScale) * lerpFactor;   // NEW:
}

// MODIFIED: Now displays the new visual parameters.
function displayFlappyDifficulty(emotion) {
    const diffDiv = document.getElementById('flappy-diff-display');
    if (!diffDiv) return;

    diffDiv.innerHTML = `
        <b>Emotion:</b> ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}<br/>
        <b>Pipe Gap:</b> ${currentPipeGap.toFixed(1)} | 
        <b>Speed:</b> ${currentPipeSpeed.toFixed(2)} | 
        <b>Frequency:</b> ${currentPipeFrequency.toFixed(0)} <br/>
        <b>Brightness:</b> ${currentBrightness.toFixed(2)} | 
        <b>Pipe Scale:</b> ${currentPipeScale.toFixed(2)}
    `;
}

function formatEmotionName(emotion) {
    return emotion.charAt(0).toUpperCase() + emotion.slice(1);
}

function formatConfidence(confidence) {
    return `${(confidence * 100).toFixed(1)}%`;
}

video.addEventListener('play', () => {
    const oldCanvas = document.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();
    
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    const canvas = faceapi.createCanvasFromMedia(video);
    
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

        if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const result = getHighestEmotion(expressions);
            
            emotionLabel.textContent = formatEmotionName(result.emotion);
            confidenceScore.textContent = `Confidence: ${formatConfidence(result.confidence)}`;
            
            // MODIFIED: Now sets the targets for the new visual properties.
            if (result.emotion !== lastEmotion) {
                let settings = emotionGameSettings[result.emotion] || emotionGameSettings.neutral;
                targetPipeGap = settings.pipeGap;
                targetPipeSpeed = settings.pipeSpeed;
                targetPipeFrequency = settings.pipeFrequency;
                targetBrightness = settings.brightness; // NEW:
                targetPipeScale = settings.pipeScale;   // NEW:
                lastEmotion = result.emotion;
            }
        } else {
            emotionLabel.textContent = 'No face detected';
            confidenceScore.textContent = '---';

            // MODIFIED: Reset to neutral, including the new visual properties.
            if (lastEmotion !== 'neutral') {
                let settings = emotionGameSettings.neutral;
                targetPipeGap = settings.pipeGap;
                targetPipeSpeed = settings.pipeSpeed;
                targetPipeFrequency = settings.pipeFrequency;
                targetBrightness = settings.brightness; // NEW:
                targetPipeScale = settings.pipeScale;   // NEW:
                lastEmotion = 'neutral';
            }
        }
    }, 500);
});