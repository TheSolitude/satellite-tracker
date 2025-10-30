// Animated stars background
const starsCanvas = document.getElementById('stars-bg');
const starsCtx = starsCanvas.getContext('2d');
let stars = [];
let shootingStars = [];
const STAR_COUNT = 180;
const SHOOTING_STAR_CHANCE = 0.032; // chance per frame
const SHOOTING_STAR_MIN_SPEED = 8;
const SHOOTING_STAR_MAX_SPEED = 16;
const SHOOTING_STAR_LENGTH = 380;
function resizeStarsCanvas() {
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;
}
function randomStar() {
    return {
        x: Math.random() * starsCanvas.width,
        y: Math.random() * starsCanvas.height,
        r: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.04,
        dy: (Math.random() - 0.5) * 0.04,
        twinkle: Math.random() * 0.05 + 0.01
    };
}
function drawStars() {
    starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    // Draw normal stars
    for (let s of stars) {
        starsCtx.save();
        starsCtx.globalAlpha = s.alpha;
        starsCtx.beginPath();
        starsCtx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
        starsCtx.fillStyle = '#fff7ff';
        starsCtx.shadowColor = '#fff7ff';
        starsCtx.shadowBlur = 8;
        starsCtx.fill();
        starsCtx.restore();
    }
    // Draw shooting stars
    for (let s of shootingStars) {
        starsCtx.save();
        let grad = starsCtx.createLinearGradient(s.x, s.y, s.x - s.dx * s.length, s.y - s.dy * s.length);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        starsCtx.strokeStyle = grad;
        starsCtx.lineWidth = 2.5;
        starsCtx.beginPath();
        starsCtx.moveTo(s.x, s.y);
        starsCtx.lineTo(s.x - s.dx * s.length, s.y - s.dy * s.length);
        starsCtx.shadowColor = '#fff';
        starsCtx.shadowBlur = 16;
        starsCtx.stroke();
        starsCtx.restore();
    }
}
function animateStars() {
    // Animate normal stars
    for (let s of stars) {
        s.x += s.dx;
        s.y += s.dy;
        s.alpha += (Math.random() - 0.5) * s.twinkle;
        if (s.alpha < 0.3) s.alpha = 0.3;
        if (s.alpha > 1) s.alpha = 1;
        if (s.x < 0) s.x = starsCanvas.width;
        if (s.x > starsCanvas.width) s.x = 0;
        if (s.y < 0) s.y = starsCanvas.height;
        if (s.y > starsCanvas.height) s.y = 0;
    }
    // Animate shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        let s = shootingStars[i];
        s.x += s.dx * s.speed;
        s.y += s.dy * s.speed;
        s.life--;
        if (
            s.x < -s.length || s.x > starsCanvas.width + s.length ||
            s.y < -s.length || s.y > starsCanvas.height + s.length ||
            s.life <= 0
        ) {
            shootingStars.splice(i, 1);
        }
    }
    // Randomly spawn new shooting stars
    if (Math.random() < SHOOTING_STAR_CHANCE) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * (SHOOTING_STAR_MAX_SPEED - SHOOTING_STAR_MIN_SPEED) + SHOOTING_STAR_MIN_SPEED;
        let length = SHOOTING_STAR_LENGTH * (0.7 + Math.random() * 0.6);
        // Start from a random edge
        let edge = Math.floor(Math.random() * 4);
        let x, y;
        if (edge === 0) { // top
            x = Math.random() * starsCanvas.width;
            y = -length;
        } else if (edge === 1) { // right
            x = starsCanvas.width + length;
            y = Math.random() * starsCanvas.height;
        } else if (edge === 2) { // bottom
            x = Math.random() * starsCanvas.width;
            y = starsCanvas.height + length;
        } else { // left
            x = -length;
            y = Math.random() * starsCanvas.height;
        }
        let dx = Math.cos(angle);
        let dy = Math.sin(angle);
        shootingStars.push({
            x, y, dx, dy, speed, length, life: 60 + Math.random() * 30
        });
    }
    drawStars();
    requestAnimationFrame(animateStars);
}
function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) stars.push(randomStar());
    drawStars();
}
function handleResize() {
    resizeStarsCanvas();
    initStars();
}
window.addEventListener('resize', handleResize);
resizeStarsCanvas();
initStars();
animateStars();
const MIN_LON = -180, MAX_LON = 180, MIN_LAT = -90, MAX_LAT = 90;
const MAP_WIDTH = 1000, MAP_HEIGHT = 500;
const issDot = document.getElementById('iss-dot');
const latSpan = document.getElementById('lat');
const lonSpan = document.getElementById('lon');
const trailCanvas = document.getElementById('trail');
const ctx = trailCanvas.getContext('2d');
let trail = [];

function lonLatToPixels(lon, lat) {
    const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * MAP_WIDTH;
    const y = MAP_HEIGHT - (((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * MAP_HEIGHT);
    return [x, y];
}

function drawTrail() {
    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0][0], trail[0][1]);
        for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i][0], trail[i][1]);
        }
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

async function updateISS() {
    try {
        const res = await fetch('/iss_location');
        const data = await res.json();
        if (data.latitude && data.longitude) {
            latSpan.textContent = data.latitude.toFixed(2);
            lonSpan.textContent = data.longitude.toFixed(2);
            const [x, y] = lonLatToPixels(data.longitude, data.latitude);
            issDot.style.left = (x - 9) + 'px';
            issDot.style.top = (y - 9) + 'px';
            trail.push([x, y]);
            if (trail.length > 50) trail.shift();
            drawTrail();
        }
    } catch (e) {
        latSpan.textContent = '--';
        lonSpan.textContent = '--';
    }
}
setInterval(updateISS, 3000);
updateISS();