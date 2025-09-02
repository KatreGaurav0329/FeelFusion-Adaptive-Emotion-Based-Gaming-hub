function launchGame(gameId) {
    const urls = {
        whack: "Games/1_Whack a Mole/index.html",
        FlappyBird: "Games/2_Flappy Bird/index.html",
        SpaceShooter: "Games/3_Space Shooter/index.html",
        carTrafficDodge: "Games/4_Car Traffic Dodge/index.html",
        FruitNinja: "Games/5_Fruit Ninja/chop.html",
        memorymatch: "Games/6_Emoji Memory Match/index.html",
        pingpong: "Games/7_Ping Pong/index.html",
        Snake: "Games/8_Snake Game/index.html",
        Maze: "Games/9_Maze Game/index.html"
    };
    if (urls[gameId]) {
        window.open(urls[gameId], '_self', 'noopener');
    } else {
        console.error("Game not found:", gameId);
        alert("Sorry, that game is not available yet!");
    }
}


document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const darkModeToggle = document.getElementById('darkModeToggle');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    const lightParticlesConfig = { particles: { number: { value: 80, density: { enable: true, value_area: 800 } }, color: { value: "#263f7c" }, shape: { type: "circle" }, opacity: { value: 0.5, random: false }, size: { value: 3, random: true }, line_linked: { enable: true, distance: 150, color: "#263f7c", opacity: 0.4, width: 1 }, move: { enable: true, speed: 4, direction: "none", random: false, straight: false, out_mode: "out", bounce: false } }, interactivity: { detect_on: "canvas", events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true }, modes: { grab: { distance: 140, line_opacity: 1 }, push: { particles_nb: 4 } } }, retina_detect: true };
    const darkParticlesConfig = { particles: { number: { value: 100, density: { enable: true, value_area: 800 } }, color: { value: "#58a6ff" }, shape: { type: "circle" }, opacity: { value: 0.6, random: true }, size: { value: 2.5, random: true }, line_linked: { enable: true, distance: 120, color: "#58a6ff", opacity: 0.2, width: 1 }, move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out", bounce: false } }, interactivity: { detect_on: "canvas", events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "repulse" }, resize: true }, modes: { grab: { distance: 100, line_opacity: 0.5 }, repulse: { distance: 150, duration: 0.4 } } }, retina_detect: true };

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '☀️ Light Mode';
            if (window.particlesJS) {
                particlesJS('particles-js', darkParticlesConfig);
            }
        } else {
            body.classList.remove('dark-mode');
            darkModeToggle.innerHTML = '🌙 Dark Mode';
            if (window.particlesJS) {
                particlesJS('particles-js', lightParticlesConfig);
            }
        }
    };

    const toggleTheme = () => {
        const currentTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme);
    };

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
    });

    // Mobile Navigation 
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (!link.id.includes('darkModeToggle')) {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    const setActiveNavLink = () => {
        const navLinks = navMenu.querySelectorAll('a');
        const currentPage = window.location.pathname.split('/').pop();

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop();
            link.parentElement.classList.remove('active');
            
            if ((currentPage === '' || currentPage === 'index.html') && (linkPage === '' || linkPage === 'index.html')) {
                link.parentElement.classList.add('active');
            } 
            else if (currentPage === linkPage && currentPage !== '') {
                link.parentElement.classList.add('active');
            }
        });
    };
    
    setActiveNavLink();
});

