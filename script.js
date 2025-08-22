document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('darkModeToggle');
    toggleBtn.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      this.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
});

/* Navigation click handler to open games in new tabs */
function launchGame(gameId) {
  const urls = {
    whack:     "Games/1_Whack a Mole/index.html",
    FlappyBird: "Games/2_Flappy Bird/index.html",
    SpaceShooter: "Games/3_Space Shooter/index.html",
    carTrafficDodge: "Games/4_Car Traffic Dodge/index.html",
    FruitNinja: "Games/5_Fruit Ninja/chop.html",
    memorymatch: "Games/6_Emoji Memory Match/index.html",
    pingpong: "Games/7_Ping Pong/index.html",
    Snake: "Games/8_Snake Game/index.html",
    Maze: "Games/9_Maze Game/index.html"
  };
  if(urls[gameId]){
    window.open(urls[gameId], '_self', 'noopener');
  } else {
    alert("Sorry, that game is not available yet!");
  }
}