const canvas = document.getElementById('light-canvas');
const ctx = canvas.getContext('2d');
const angleInput = document.getElementById('angle');
const angleValue = document.getElementById('angle-value');
const laserToggle = document.getElementById('laser-toggle');
const normalInput = document.getElementById('show-normal');
const rayLabelsInput = document.getElementById('show-ray-labels');
const anglesInput = document.getElementById('show-angles');
const rulerInput = document.getElementById('show-ruler');
const protractorInput = document.getElementById('show-protractor');
const mirrorCount = document.getElementById('mirror-count');

let laserOn = true;
let laser = { x: 255, y: 65 };
let mirrors = [{ x1: 210, y1: 330, x2: 790, y2: 330 }];
let ruler = { x: 65, y: 465, w: 360, h: 38, angle: 0 };
let protractor = { x: 690, y: 175, r: 115, angle: 0 };
let drag = null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function line(x1, y1, x2, y2, color, width = 2, dash = []) {
    ctx.beginPath(); ctx.setLineDash(dash);
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    ctx.setLineDash([]);
}
function dot(x, y, r, color) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
}
function arrow(x1, y1, x2, y2, color, width = 3) {
    line(x1, y1, x2, y2, color, width);
    const a = Math.atan2(y2 - y1, x2 - x1), size = 13;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(a - Math.PI / 6), y2 - size * Math.sin(a - Math.PI / 6));
    ctx.lineTo(x2 - size * Math.cos(a + Math.PI / 6), y2 - size * Math.sin(a + Math.PI / 6));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
function localToWorld(obj, x, y) {
    const c = Math.cos(obj.angle), s = Math.sin(obj.angle);
    return { x: obj.x + x * c - y * s, y: obj.y + x * s + y * c };
}
function worldToLocal(obj, p) {
    const dx = p.x - obj.x, dy = p.y - obj.y;
    const c = Math.cos(obj.angle), s = Math.sin(obj.angle);
    return { x: dx * c + dy * s, y: -dx * s + dy * c };
}
function drawRuler() {
    ctx.save(); ctx.translate(ruler.x, ruler.y); ctx.rotate(ruler.angle);
    ctx.fillStyle = 'rgba(250,246,230,.97)'; ctx.fillRect(0, 0, ruler.w, ruler.h);
    for (let i = 0; i <= 12; i++) {
        const x = i * 30, major = i % 2 === 0;
        line(x, 0, x, major ? 22 : 12, '#174f6c', 1);
        if (major) {
            ctx.fillStyle = '#174f6c'; ctx.font = '11px Arial';
            ctx.fillText(i / 2 === 0 ? '0' : (i / 2 === 1 ? '1 cm' : String(i / 2)), x + 2, 34);
        }
    }
    ctx.fillStyle = '#174f6c'; ctx.font = '11px Arial'; ctx.fillText('↻ girar', ruler.w - 43, -7);
    ctx.beginPath(); ctx.arc(ruler.w - 12, -12, 6, 0, Math.PI * 2); ctx.fillStyle = '#e0a52b'; ctx.fill();
    ctx.restore();
}
function drawProtractor() {
    const { x, y, r, angle } = protractor;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
    ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2; ctx.stroke();
    line(-r, 0, r, 0, '#ffe9a8', 1.5);
    for (let d = 0; d <= 180; d += 5) {
        const a = Math.PI + d * Math.PI / 180;
        const major = d % 10 === 0;
        const inner = r - (major ? 14 : 7);
        line(Math.cos(a) * inner, Math.sin(a) * inner, Math.cos(a) * r, Math.sin(a) * r, '#ffe9a8', 1);
        if (d % 30 === 0) {
            ctx.fillStyle = '#ffe9a8'; ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(String(d), Math.cos(a) * (r - 29), Math.sin(a) * (r - 29) + 4);
        }
    }
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffe9a8'; ctx.font = '12px Arial';
    ctx.fillText('SEMICÍRCULO · arrastrar', -r, -r - 9);
    dot(0, -r - 18, 6, '#e0a52b');
    ctx.restore();
}
function hitRay(o, d, m) {
    const sx = m.x2 - m.x1, sy = m.y2 - m.y1;
    const den = d.x * sy - d.y * sx;
    if (Math.abs(den) < 1e-8) return null;
    const qx = m.x1 - o.x, qy = m.y1 - o.y;
    const t = (qx * sy - qy * sx) / den;
    const u = (qx * d.y - qy * d.x) / den;
    return t > 2 && u >= 0 && u <= 1 ? { t, x: o.x + d.x * t, y: o.y + d.y * t } : null;
}
function vectorLabel(x, y, text) {
    ctx.save(); ctx.font = 'bold 13px Arial';
    const width = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(15,43,59,.82)';
    ctx.fillRect(x - 4, y - 14, width + 8, 19);
    ctx.fillStyle = '#fff'; ctx.fillText(text, x, y);
    ctx.restore();
}
function drawRaySegment(o, end, color, label) {
    const dx = end.x - o.x, dy = end.y - o.y;
    const length = Math.hypot(dx, dy);
    if (length < 2) return;

    const ux = dx / length, uy = dy / length;
    const arrowStart = { x: o.x + dx * 0.38, y: o.y + dy * 0.38 };
    const arrowEnd = { x: o.x + dx * 0.55, y: o.y + dy * 0.55 };
    line(o.x, o.y, end.x, end.y, color, 3);
    arrow(arrowStart.x, arrowStart.y, arrowEnd.x, arrowEnd.y, color, 4);

    if (rayLabelsInput && rayLabelsInput.checked) {
        const nx = -uy, ny = ux;
        const middleX = (arrowStart.x + arrowEnd.x) / 2;
        const middleY = (arrowStart.y + arrowEnd.y) / 2;
        vectorLabel(middleX + nx * 22, middleY + ny * 22, `${label}`);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    mirrors.forEach((m) => {
        line(m.x1, m.y1, m.x2, m.y2, '#f5f0df', 8);
        line(m.x1, m.y1, m.x2, m.y2, '#7dd3fc', 2);
        dot(m.x1, m.y1, 6, '#facc15'); dot(m.x2, m.y2, 6, '#facc15');
    });
    if (laserOn) {
        const a = Number(angleInput.value) * Math.PI / 180;
        let o = { x: laser.x + 20, y: laser.y + 8 };
        let d = { x: Math.sin(a), y: Math.cos(a) };
        let previous = -1;
        for (let bounce = 0; bounce < 50; bounce++) {
            let best = null, idx = -1;
            mirrors.forEach((m, i) => {
                if (i === previous) return;
                const h = hitRay(o, d, m);
                if (h && (!best || h.t < best.t)) { best = h; idx = i; }
            });
            const end = best || { x: o.x + d.x * 900, y: o.y + d.y * 900 };
            drawRaySegment(o, end, bounce === 0 ? '#ff4242' : '#ff9b54', bounce === 0 ? 'RI' : 'RR');
            if (!best) break;
            const m = mirrors[idx], vx = m.x2 - m.x1, vy = m.y2 - m.y1;
            const L = Math.hypot(vx, vy); let nx = -vy / L, ny = vx / L;
            if (d.x * nx + d.y * ny > 0) { nx = -nx; ny = -ny; }
            const theta = Math.acos(clamp(Math.abs(d.x * nx + d.y * ny), -1, 1)) * 180 / Math.PI;
            const k = d.x * nx + d.y * ny;
            const rd = { x: d.x - 2 * k * nx, y: d.y - 2 * k * ny };
            if (normalInput.checked) {
                line(best.x - nx * 75, best.y - ny * 75, best.x + nx * 75, best.y + ny * 75, '#fff', 1.5, [6, 5]);
                ctx.fillStyle = '#fff'; ctx.fillText('N', best.x + nx * 78, best.y + ny * 78);
            }
            dot(best.x, best.y, 5, '#fff');
            if (anglesInput && anglesInput.checked) {
                vectorLabel(best.x + 9, best.y - 22, `θi = ${theta.toFixed(1)}°`);
                vectorLabel(best.x + 9, best.y + 20, `θr = ${theta.toFixed(1)}°`);
            }
            o = { x: best.x + rd.x * 1.5, y: best.y + rd.y * 1.5 };
            d = rd; previous = idx;
        }
    }
    ctx.save(); ctx.translate(laser.x, laser.y);
    ctx.fillStyle = '#d8d8d8'; ctx.fillRect(-22, -13, 44, 26);
    ctx.fillStyle = laserOn ? '#e73542' : '#555'; ctx.fillRect(-17, -9, 34, 18);
    dot(0, 0, 5, '#111'); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = '13px Arial'; ctx.fillText('Láser · arrastrar', laser.x - 30, laser.y - 22);
    if (rulerInput.checked) drawRuler();
    if (protractorInput.checked) drawProtractor();
}
function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
}
function distSeg(p, m) {
    const vx = m.x2 - m.x1, vy = m.y2 - m.y1;
    const t = clamp(((p.x - m.x1) * vx + (p.y - m.y1) * vy) / (vx * vx + vy * vy), 0, 1);
    return Math.hypot(p.x - m.x1 - t * vx, p.y - m.y1 - t * vy);
}
canvas.addEventListener('pointerdown', e => {
    const p = pos(e);
    if (rulerInput.checked) {
        const q = worldToLocal(ruler, p);
        if (Math.hypot(q.x - (ruler.w - 12), q.y + 12) < 14) drag = { type: 'rotateRuler', center: { x: ruler.x, y: ruler.y } };
        else if (q.x >= -8 && q.x <= ruler.w + 8 && q.y > -18 && q.y < ruler.h + 8) drag = { type: 'ruler', dx: p.x - ruler.x, dy: p.y - ruler.y };
    }
    if (!drag && protractorInput.checked) {
        const q = worldToLocal(protractor, p);
        if (Math.hypot(q.x, q.y + protractor.r + 18) < 14) drag = { type: 'rotateProtractor' };
        else if (Math.hypot(q.x, q.y) < protractor.r + 18) drag = { type: 'protractor', dx: p.x - protractor.x, dy: p.y - protractor.y };
    }
    if (!drag && Math.hypot(p.x - laser.x, p.y - laser.y) < 34) drag = { type: 'laser', dx: p.x - laser.x, dy: p.y - laser.y };
    if (!drag) for (let i = mirrors.length - 1; i >= 0; i--) {
        const m = mirrors[i];
        if (Math.hypot(p.x - m.x1, p.y - m.y1) < 16) { drag = { type: 'end', i, n: 1 }; break; }
        if (Math.hypot(p.x - m.x2, p.y - m.y2) < 16) { drag = { type: 'end', i, n: 2 }; break; }
        if (distSeg(p, m) < 14) { drag = { type: 'mirror', i, last: p }; break; }
    }
    if (drag) canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = pos(e);
    if (drag.type === 'laser') { laser.x = clamp(p.x - drag.dx, 25, 975); laser.y = clamp(p.y - drag.dy, 25, 535); }
    if (drag.type === 'ruler') { ruler.x = clamp(p.x - drag.dx, 0, 900); ruler.y = clamp(p.y - drag.dy, 20, 526); }
    if (drag.type === 'protractor') { protractor.x = clamp(p.x - drag.dx, protractor.r, 1000 - protractor.r); protractor.y = clamp(p.y - drag.dy, protractor.r + 20, 540); }
    if (drag.type === 'rotateRuler') ruler.angle = Math.atan2(p.y - ruler.y, p.x - ruler.x);
    if (drag.type === 'rotateProtractor') protractor.angle = Math.atan2(p.y - protractor.y, p.x - protractor.x) + Math.PI / 2;
    if (drag.type === 'end') {
        const m = mirrors[drag.i];
        if (drag.n === 1) { m.x1 = clamp(p.x, 10, 990); m.y1 = clamp(p.y, 10, 550); }
        else { m.x2 = clamp(p.x, 10, 990); m.y2 = clamp(p.y, 10, 550); }
    }
    if (drag.type === 'mirror') {
        const m = mirrors[drag.i], dx = p.x - drag.last.x, dy = p.y - drag.last.y;
        m.x1 += dx; m.x2 += dx; m.y1 += dy; m.y2 += dy; drag.last = p;
    }
    draw();
});
canvas.addEventListener('pointerup', () => drag = null);
canvas.addEventListener('pointercancel', () => drag = null);
angleInput.addEventListener('input', () => { angleValue.textContent = angleInput.value; draw(); });
[normalInput, rayLabelsInput, anglesInput, rulerInput, protractorInput].forEach(el => {
    if (el) el.addEventListener('change', draw);
});
laserToggle.addEventListener('click', () => { laserOn = !laserOn; laserToggle.textContent = laserOn ? 'Apagar láser' : 'Prender láser'; draw(); });
document.getElementById('add-mirror').addEventListener('click', () => {
    const n = mirrors.length, y = 390 + ((n - 1) % 3) * 42;
    mirrors.push({ x1: 280, y1: y, x2: 720, y2: y });
    mirrorCount.textContent = `Espejos: ${mirrors.length}`; draw();
});
document.getElementById('remove-mirror').addEventListener('click', () => {
    if (mirrors.length > 1) mirrors.pop();
    mirrorCount.textContent = `Espejos: ${mirrors.length}`; draw();
});
draw();