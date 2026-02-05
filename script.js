const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- НАСТРОЙКА ЭКРАНА (ДЛЯ IPAD) ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Вызываем сразу при запуске

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let score = 0;
let animationId;
const projectiles = [];
const enemies = [];
const particles = [];

// Таймеры стрельбы
let lastShotTime = 0;
const SHOOT_DELAY = 150; // Задержка между выстрелами (мс)

// Таймеры супер-силы (Тройной выстрел)
let powerUpActive = false;
let powerUpEndTime = 0;

// --- УПРАВЛЕНИЕ (НАДЕЖНОЕ ДЛЯ IPAD + КЛАВИАТУРА) ---
const keys = {
    KeyW: false, KeyA: false, KeyS: false, KeyD: false, // Ходьба
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false // Стрельба
};

window.addEventListener('keydown', (e) => {
    // Блокируем прокрутку страницы стрелками на iPad
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    // Используем e.code — физический код клавиши, не зависит от языка
    if (e.code in keys) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
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
        // Если активен супер-выстрел, добавляем золотую обводку
        if (powerUpActive) {
             ctx.strokeStyle = '#FFD700';
             ctx.lineWidth = 4;
             ctx.stroke();
        }
    }
    update() {
        // Движение WASD
        if (keys.KeyW && this.y - this.radius > 0) this.y -= this.speed;
        if (keys.KeyS && this.y + this.radius < canvas.height) this.y += this.speed;
        if (keys.KeyA && this.x - this.radius > 0) this.x -= this.speed;
        if (keys.KeyD && this.x + this.radius < canvas.width) this.x += this.speed;

        this.draw();
        this.shoot();

        // Проверка окончания супер-силы
        if (powerUpActive && Date.now() > powerUpEndTime) {
            powerUpActive = false;
            player.color = '#00ffcc'; // Возвращаем обычный цвет
        }
    }
    shoot() {
        const now = Date.now();
        if (now - lastShotTime < SHOOT_DELAY) return; // Задержка стрельбы

        let vx = 0; let vy = 0;
        if (keys.ArrowUp) vy = -12;
        if (keys.ArrowDown) vy = 12;
        if (keys.ArrowLeft) vx = -12;
        if (keys.ArrowRight) vx = 12;

        // Если нажата хоть одна стрелка
        if (vx !== 0 || vy !== 0) {
            const bulletColor = powerUpActive ? '#FFD700' : '#ffff00'; // Золотые пули при супер-силе

            // Основная пуля
            projectiles.push(new Projectile(this.x, this.y, 6, bulletColor, {x: vx, y: vy}));

            // --- КРУТАЯ ФИШКА: ТРОЙНОЙ ВЫСТРЕЛ ---
            if (powerUpActive) {
                //
