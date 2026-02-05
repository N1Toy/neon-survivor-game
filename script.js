const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });

let score = 0;

// Класс для частиц (взрывы)
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x; this.y = y; this.radius = radius; this.color = color; this.velocity = velocity;
        this.alpha = 1; // Прозрачность для затухания
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01; // Частица медленно исчезает
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

class Player {
    constructor(x, y, radius, color) {
        this.x = x; this.y = y; this.radius = radius; this.color = color; this.speed = 5;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color; ctx.fill();
    }
    update() {
        if (keys.w && this.y - this.radius > 0) this.y -= this.speed;
        if (keys.s && this.y + this.radius < canvas.height) this.y += this.speed;
        if (keys.a && this.x - this.radius > 0) this.x -= this.speed;
        if (keys.d && this.x + this.radius < canvas.width) this.x += this.speed;
        this.draw();
    }
}

const player = new Player(canvas.width / 2, canvas.height / 2, 15, '#00ffcc');
const projectiles = [];
const enemies = [];
const particles = [];

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
        const velocity = { x: Math.cos(angle) * 2, y: Math.sin(angle) * 2 };
        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
}

window.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const angle = Math.atan2(event.clientY - rect.top - player.y, event.clientX - rect.left - player.x);
    projectiles.push(new Projectile(player.x, player.y, 5, 'white', { x: Math.cos(angle) * 8, y: Math.sin(angle) * 8 }));
});

function animate() {
    const animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем счет
    ctx.fillStyle = 'white';
    ctx.font = '20px Monospace';
    ctx.fillText(`Score: ${score}`, 20, 40);

    player.update();

    // Обработка частиц
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((p, i) => {
        p.update();
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) projectiles.splice(i, 1);
    });

    enemies.forEach((enemy, index) => {
        enemy.update();
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        
        if (distToPlayer - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            alert(`GAME OVER! Твой счет: ${score}`);
        }

        projectiles.forEach((p, pIndex) => {
            const distToProjectile = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (distToProjectile - enemy.radius - p.radius < 1) {
                
                // СОЗДАЕМ ВЗРЫВ
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(p.x, p.y, Math.random() * 3, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
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
