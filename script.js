<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Neon Survivor iPad Edition</title>
    <style>
        body { margin: 0; background: #000; overflow: hidden; font-family: sans-serif; }
        canvas { display: block; }
        #ui { position: absolute; top: 20px; left: 20px; color: white; font-size: 24px; pointer-events: none; }
    </style>
</head>
<body>
    <div id="ui">Score: 0</div>
    <canvas id="gameCanvas"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const ui = document.getElementById('ui');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let score = 0;
        let gameActive = false;
        let animationId;
        let spawnIntervalId;

        const projectiles = [];
        const enemies = [];
        const particles = [];

        const keys = {
            KeyW: false, KeyA: false, KeyS: false, KeyD: false,
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
        };

        // Рисуем стартовый экран сразу
        function drawStartScreen() {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('NEON SURVIVOR', canvas.width/2, canvas.height/2 - 40);
            ctx.font = '20px sans-serif';
            ctx.fillText('WASD - Ходить, Стрелки - Стрелять', canvas.width/2, canvas.height/2 + 10);
            ctx.fillStyle = 'white';
            ctx.fillText('НАЖМИ ЛЮБУЮ КНОПКУ ДЛЯ СТАРТА', canvas.width/2, canvas.height/2 + 60);
        }

        window.addEventListener('keydown', (e) => {
            if (!gameActive) {
                startGame();
            }
            if (e.code in keys) {
                keys[e.code] = true;
                if(e.code.includes('Arrow')) e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code in keys) keys[e.code] = false;
        });

        class Player {
            constructor(x, y, radius, color) {
                this.x = x; this.y = y; this.radius = radius; this.color = color;
                this.speed = 6;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            update() {
                if (keys.KeyW && this.y > this.radius) this.y -= this.speed;
                if (keys.KeyS && this.y < canvas.height - this.radius) this.y += this.speed;
                if (keys.KeyA && this.x > this.radius) this.x -= this.speed;
                if (keys.KeyD && this.x < canvas.width - this.radius) this.x += this.speed;
                this.draw();
                this.shoot();
            }
            shoot() {
                if (Date.now() % 10 !== 0) return; // Ограничение скорострельности
                let vx = 0, vy = 0;
                if (keys.ArrowUp) vy = -12;
                if (keys.ArrowDown) vy = 12;
                if (keys.ArrowLeft) vx = -12;
                if (keys.ArrowRight) vx = 12;

                if (vx !== 0 || vy !== 0) {
                    projectiles.push(new Projectile(this.x, this.y, 5, '#ffff00', {x: vx, y: vy}));
                }
            }
        }

        class Projectile {
            constructor(x, y, radius, color, velocity) {
                this.x = x; this.y = y; this.radius = radius; this.color = color; this.velocity = velocity;
            }
            draw() {
                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color; ctx.fill();
            }
            update() { this.draw(); this.x += this.velocity.x; this.y += this.velocity.y; }
        }

        class Enemy {
            constructor(x, y, radius, color, velocity) {
                this.x = x; this.y = y; this.radius = radius; this.color = color; this.velocity = velocity;
            }
            draw() {
                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color; ctx.fill();
            }
            update() { this.draw(); this.x += this.velocity.x; this.y += this.velocity.y; }
        }

        const player = new Player(canvas.width/2, canvas.height/2, 15, '#00ffcc');

        function spawnEnemies() {
            spawnIntervalId = setInterval(() => {
                const radius = Math.random() * 20 + 15;
                let x, y;
                if (Math.random() < 0.5) {
                    x = Math.random() < 0.5 ? -radius : canvas.width + radius;
                    y = Math.random() * canvas.height;
                } else {
                    x = Math.random() * canvas.width;
                    y = Math.random() < 0.5 ? -radius : canvas.height + radius;
                }
                const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
                const angle = Math.atan2(player.y - y, player.x - x);
                enemies.push(new Enemy(x, y, radius, color, {x: Math.cos(angle)*2, y: Math.sin(angle)*2}));
            }, 1000);
        }

        function startGame() {
            gameActive = true;
            score = 0;
            enemies.length = 0;
            projectiles.length = 0;
            spawnEnemies();
            animate();
        }

        function animate() {
            if (!gameActive) return;
            animationId = requestAnimationFrame(animate);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            player.update();
            ui.innerHTML = `Score: ${score}`;

            projectiles.forEach((p, i) => {
                p.update();
                if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) projectiles.splice(i, 1);
            });

            enemies.forEach((enemy, index) => {
                enemy.update();
                const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
                if (dist - enemy.radius - player.radius < 1) {
                    gameActive = false;
                    clearInterval(spawnIntervalId);
                    cancelAnimationFrame(animationId);
                    alert("GAME OVER! Score: " + score);
                    location.reload();
                }

                projectiles.forEach((p, pIndex) => {
                    const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
                    if (d - enemy.radius - p.radius < 1) {
                        score += 100;
                        enemies.splice(index, 1);
                        projectiles.splice(pIndex, 1);
                    }
                });
            });
        }

        drawStartScreen();
    </script>
</body>
</html>
