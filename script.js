const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Подстраиваем размер под экран iPad
canvas.width = window.innerWidth < 800 ? window.innerWidth - 20 : 800;
canvas.height = window.innerHeight < 600 ? window.innerHeight - 100 : 600;

let score = 0;
const projectiles = [];
const enemies = [];
const particles = [];

// УПРАВЛЕНИЕ (WASD для ходьбы + Стрелки для стрельбы)
const keys = {
    w: false, a: false, s: false, d: false,
    arrowup: false, arrowdown: false, arrowleft: false, arrowright: false
};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

class Player {
    constructor(x, y, radius, color) {
        this.x = x; this.y = y; this.radius = radius; this.color = color;
        this.speed = 5;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update() {
        if (keys.w && this.y - this.radius > 0) this.y -= this.speed;
        if (keys.s && this.y + this.radius < canvas.height) this.y += this.speed;
        if (keys.a && this.x - this.radius > 0) this.x -= this.speed;
        if (keys.d && this.x + this.radius < canvas.width) this.x += this.speed;
        this.draw();

        // СТРЕЛЬБА НА СТРЕЛКИ
        this.shoot();
    }
    shoot() {
        let vx = 0; let vy = 0;
        if (keys.arrowup) vy = -8;
        if (keys.arrowdown) vy = 8;
        if (keys.arrowleft) vx = -8;
        if (keys.arrowright) vx = 8;

        // Если нажата хоть одна стрелка, стреляем (с небольшой задержкой)
        if ((vx !== 0 || vy !== 0) && Date.now() % 10 === 0) { 
            projectiles.push(new Projectile(this.x, this.y, 5, 'white', {x: vx, y: vy}));
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
    update() { this.draw(); this.x += this.velocity.x; this.y += this.velocity.y; this.alpha -= 0.02; }
}

const player = new Player(canvas.width / 2, canvas.height / 2, 15, '#00ffcc');

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * 20 + 10;
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        const angle = Math.atan2(player.y - y, player.x - x);
        enemies.push(new Enemy(x, y, radius, color, {x: Math.cos(angle) * 2, y: Math.sin(angle) * 2}));
    }, 1000);
}

function animate() {
    const animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 20, 40);

    player.update();

    particles.forEach((p, i) => { if (p.alpha <= 0) particles.splice(i, 1); else p.update(); });
    projectiles.forEach((p, i) => { 
        p.update(); 
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) projectiles.splice(i, 1);
    });

    enemies.forEach((enemy, index) => {
        enemy.update();
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            alert('GAME OVER! Score: ' + score);
            location.reload();
        }
        projectiles.forEach((p, pIndex) => {
            const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (d - enemy.radius - p.radius < 1) {
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(enemy.x, enemy.y, Math.random() * 3, enemy.color, {
                        x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6
                    }));
                }
                score += 100;
                enemies.splice(index, 1);
                projectiles.splice(pIndex, 1);
            }
        });
    });
}

spawnEnemies();
animate();
