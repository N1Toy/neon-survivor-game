const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- НАСТРОЙКА ЭКРАНА ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- ПЕРЕМЕННЫЕ ---
let score = 0;
let animationId;
let spawnIntervalId; // Чтобы правильно останавливать спавн врагов
let gameActive = true;

// Массивы объектов
const projectiles = [];
const enemies = [];
const particles = [];

// Таймеры
let lastShotTime = 0;
const SHOOT_DELAY = 150;
let powerUpActive = false;
let powerUpEndTime = 0;

// --- УПРАВЛЕНИЕ ---
const keys = {
    KeyW: false, KeyA: false, KeyS: false, KeyD: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    // Если игра закончена, нажатие любой кнопки перезапустит её
    if (!gameActive) {
        restartGame();
        return;
    }

    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    if (e.code in keys) keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys) keys[e.code] = false;
});

// --- КЛАССЫ ---
class Player {
    constructor(x, y, radius, color) {
        this.x = x; this.y = y; this.radius = radius; this.color = color;
        this.speed = 6;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        if (powerUpActive) {
             ctx.strokeStyle = '#FFD700';
             ctx.lineWidth = 4;
             ctx.stroke();
        }
    }
    update() {
        if (keys.KeyW && this.y - this.radius > 0) this.y -= this.speed;
        if (keys.KeyS && this.y + this.radius < canvas.height) this.y += this.speed;
        if (keys.KeyA && this.x - this.radius > 0) this.x -= this.speed;
        if (keys.KeyD && this.x + this.radius < canvas.width) this.x += this.speed;

        this.draw();
        this.shoot();

        if (powerUpActive && Date.now() > powerUpEndTime) {
            powerUpActive = false;
            player.color = '#00ffcc';
        }
    }
    shoot() {
        const now = Date.now();
        if (now - lastShotTime < SHOOT_DELAY) return;

        let vx = 0; let vy = 0;
        if (keys.ArrowUp) vy = -12;
        if (keys.ArrowDown) vy = 12;
        if (keys.ArrowLeft) vx = -12;
        if (keys.ArrowRight) vx = 12;

        if (vx !== 0 || vy !== 0) {
            const bulletColor = powerUpActive ? '#FFD700' : '#ffff00';
            projectiles.push(new Projectile(this.x, this.y, 6, bulletColor, {x: vx, y: vy}));

            if (powerUpActive) {
                const angle = Math.atan2(vy, vx);
                const angle1 = angle - 0.35;
                const angle2 = angle + 0.35;
                projectiles.push(new Projectile(this.x, this.y, 5, bulletColor, {x: Math.cos(angle1)*12, y: Math.sin(angle1)*12}));
                projectiles.push(new Projectile(this.x, this.y, 5, bulletColor, {x: Math.cos(angle2)*12, y: Math.sin(angle2)*12}));
            }
            lastShotTime = now;
        }
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x; this.y = y; this.radius = radius; this.color = color; this.velocity = velocity;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color; ctx.fill();
    }
    update() { this.draw(); this.x += this.velocity.x; this.y += this.velocity.y; }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x; this.y = y; this.radius = radius; this.color = color; this.velocity = velocity;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color; ctx.fill();
    }
    update() { this.draw(); this.x += this.velocity.x; this.y += this.velocity.y; }
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x; this.y = y; this.radius = radius; this.color = color; this.velocity = velocity;
        this.alpha = 1;
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color; ctx.fill(); ctx.restore();
    }
    update() { this.draw(); this.x += this.velocity.x * 0.95; this.y += this.velocity.y * 0.95; this.alpha -= 0.02; }
}

// --- ФУНКЦИИ ИГРЫ ---
const player = new Player(canvas.width / 2, canvas.height / 2, 20, '#00ffcc');

function spawnEnemies() {
    // Очищаем старый интервал, если он был
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    
    spawnIntervalId = setInterval(() => {
        if (!gameActive) return;
        
        const radius = Math.random() * 25 + 15;
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        const angle = Math.atan2(player.y - y, player.x - x);
        const speed = Math.random() * 2 + 1.5;
        enemies.push(new Enemy(x, y, radius, color, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}));
    }, 900);
}

// ФУНКЦИЯ ПЕРЕЗАПУСКА (БЕЗ RELOAD)
function restartGame() {
    // 1. Сбрасываем все массивы
    projectiles.length = 0;
    enemies.length = 0;
    particles.length = 0;
    
    // 2. Сбрасываем игрока и счет
    score = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.color = '#00ffcc';
    powerUpActive = false;
    
    // 3. Запускаем игру
    gameActive = true;
    spawnEnemies();
    animate();
}

function animate() {
    // Если игра не активна (Game Over), не рисуем кадры
    if (!gameActive) return;

    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px sans
