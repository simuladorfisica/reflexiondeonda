const canvas = document.getElementById('string-canvas');
const ctx = canvas.getContext('2d');
const tension = document.getElementById('tension');
const tensionValue = document.getElementById('tension-value');
const endType = document.getElementById('end-type');
const slow = document.getElementById('slow');
const timeLabel = document.getElementById('sim-time');
const rulerToggle = document.getElementById('string-ruler');
const stopwatchLabel = document.getElementById('stopwatch');
const left = 90, right = 910, centerY = 190;
let running = false, elapsed = 0, lastFrame = 0;
let travelled = 0; // Distancia acumulada: no se reinicia al cambiar la tensión.
let stopwatchRunning = false, stopwatchTime = 0, lastStopwatch = 0;
let ruler = { x: 230, y: 295, w: 540, h: 38, angle: 0 };
let drag = null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function localToWorld(obj, x, y) {
    const c = Math.cos(obj.angle), s = Math.sin(obj.angle);
    return { x: obj.x + x * c - y * s, y: obj.y + x * s + y * c };
}
function worldToLocal(obj, p) {
    const dx = p.x - obj.x, dy = p.y - obj.y, c = Math.cos(obj.angle), s = Math.sin(obj.angle);
    return { x: dx * c + dy * s, y: -dx * s + dy * c };
}
function pulseShape(x, center, sign) {
    const z = (x - center) / 30;
    return sign * 58 * Math.exp(-z * z) * Math.cos(z * 1.7);
}
function drawRuler() {
    ctx.save(); ctx.translate(ruler.x, ruler.y); ctx.rotate(ruler.angle);
    ctx.fillStyle = 'rgba(250,246,230,.97)'; ctx.fillRect(0, 0, ruler.w, ruler.h);
    // 1 cm cada 30 px; marcas intermedias de 0,5 cm.
    for (let i = 0; i <= 36; i++) {
        const x = i * 15, major = i % 2 === 0;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, major ? 23 : 12);
        ctx.strokeStyle = '#174f6c'; ctx.lineWidth = 1; ctx.stroke();
        if (major) {
            ctx.fillStyle = '#174f6c'; ctx.font = '11px Arial';
            ctx.fillText(i / 2 === 0 ? '0' : (i / 2 === 1 ? '1 cm' : String(i / 2)), x + 2, 35);
        }
    }
    ctx.fillStyle = '#174f6c'; ctx.font = '11px Arial'; ctx.fillText('↻ girar', ruler.w - 43, -7);
    ctx.beginPath(); ctx.arc(ruler.w - 12, -12, 6, 0, Math.PI * 2); ctx.fillStyle = '#e0a52b'; ctx.fill();
    ctx.restore();
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#f5f0df'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(left, centerY); ctx.lineTo(right, centerY); ctx.stroke();
    if (endType.value === 'fixed') {
        ctx.beginPath(); ctx.moveTo(right, 135); ctx.lineTo(right, 245); ctx.stroke();
        for (let y = 140; y < 245; y += 12) {
            ctx.beginPath(); ctx.moveTo(right, y); ctx.lineTo(right + 14, y - 8); ctx.stroke();
        }
    } else {
        ctx.beginPath(); ctx.arc(right + 12, centerY, 12, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(left, 135); ctx.lineTo(left, 245); ctx.stroke();
    const L = right - left;
    const q = ((travelled % (2 * L)) + 2 * L) % (2 * L);
    const center = q <= L ? left + q : right - (q - L);
    const bounces = Math.floor(travelled / L);
    const sign = endType.value === 'fixed' && bounces % 2 === 1 ? -1 : 1;
    ctx.beginPath();
    for (let x = left; x <= right; x += 2) {
        const y = centerY - pulseShape(x, center, sign);
        if (x === left) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#ff7777'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#f5f0df'; ctx.font = '16px Arial';
    ctx.fillText(endType.value === 'fixed' ? 'Extremo fijo' : 'Extremo libre', right - 125, 95);
    ctx.fillText(q <= L ? 'Propagación →' : 'Propagación ←', left + 10, 95);
    if (rulerToggle.checked) drawRuler();
}
function animate(ts) {
    if (!lastFrame) lastFrame = ts;
    const dt = Math.min((ts - lastFrame) / 1000, 0.05);
    lastFrame = ts;
    if (running) {
        const speed = 45 + Number(tension.value) * 2.5;
        travelled += speed * dt * (slow.checked ? 0.25 : 1);
        elapsed += dt * (slow.checked ? 0.25 : 1);
        timeLabel.textContent = elapsed.toFixed(1);
    }
    if (stopwatchRunning) {
        stopwatchTime += (ts - lastStopwatch) / 1000;
        stopwatchLabel.textContent = stopwatchTime.toFixed(2);
    }
    lastStopwatch = ts;
    draw(); requestAnimationFrame(animate);
}
function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
}
canvas.addEventListener('pointerdown', e => {
    if (!rulerToggle.checked) return;
    const p = pos(e), q = worldToLocal(ruler, p);
    if (Math.hypot(q.x - (ruler.w - 12), q.y + 12) < 14) drag = { type: 'rotate' };
    else if (q.x >= -8 && q.x <= ruler.w + 8 && q.y > -18 && q.y < ruler.h + 8) drag = { type: 'move', dx: p.x - ruler.x, dy: p.y - ruler.y };
    if (drag) canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = pos(e);
    if (drag.type === 'move') { ruler.x = clamp(p.x - drag.dx, 0, canvas.width - 40); ruler.y = clamp(p.y - drag.dy, 25, canvas.height - 45); }
    else ruler.angle = Math.atan2(p.y - ruler.y, p.x - ruler.x);
    draw();
});
canvas.addEventListener('pointerup', () => drag = null);
canvas.addEventListener('pointercancel', () => drag = null);
tension.addEventListener('input', () => { tensionValue.textContent = tension.value; draw(); });
[endType, slow, rulerToggle].forEach(el => el.addEventListener('change', draw));
document.getElementById('play').addEventListener('click', () => running = true);
document.getElementById('pause').addEventListener('click', () => running = false);
document.getElementById('restart').addEventListener('click', () => {
    running = false; elapsed = 0; travelled = 0; timeLabel.textContent = '0.0'; lastFrame = 0; draw();
});
document.getElementById('stopwatch-toggle').addEventListener('click', e => {
    stopwatchRunning = !stopwatchRunning;
    e.currentTarget.textContent = stopwatchRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro';
});
requestAnimationFrame(animate);