// Initialize the map
const map = L.map('map').setView([0, 0], 2);

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Create a custom icon for the ISS
const issIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/International_Space_Station.svg/200px-International_Space_Station.svg.png',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
});

// Create a marker for the ISS
const issMarker = L.marker([0, 0], {icon: issIcon}).addTo(map);

// Create a polyline for the trail
const trail = L.polyline([], {color: 'cyan'}).addTo(map);

// Animated stars background
const starsCanvas = document.getElementById('stars-bg');
const starsCtx = starsCanvas.getContext('2d');
let stars = [];
let shootingStars = [];
const STAR_COUNT = 120;
const SHOOTING_STAR_CHANCE = 0.015; // chance per frame
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

const latSpan = document.getElementById('lat');
const lonSpan = document.getElementById('lon');

async function updateISS() {
    try {
        const res = await fetch('/iss_location');
        const data = await res.json();
        if (data.latitude && data.longitude) {
            const lat = data.latitude;
            const lon = data.longitude;

            latSpan.textContent = lat.toFixed(2);
            lonSpan.textContent = lon.toFixed(2);

            // Update the marker position
            issMarker.setLatLng([lat, lon]);

            // Add the new position to the trail
            trail.addLatLng([lat, lon]);

            // Center the map on the ISS
            map.panTo([lat, lon]);
        }
    } catch (e) {
        latSpan.textContent = '--';
        lonSpan.textContent = '--';
    }
}
setInterval(updateISS, 3000);
updateISS();