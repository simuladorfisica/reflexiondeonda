const canvas = document.getElementById('water-canvas');
const ctx = canvas.getContext('2d');
const sourceType = document.getElementById('source-type');
const wallToggle = document.getElementById('wall-toggle');
const wallStatus = document.getElementById('wall-status');
const frequency = document.getElementById('wave-speed');
const rulerToggle = document.getElementById('water-ruler');
const W = canvas.width, H = canvas.height;
const waveSpeed = 105;
let source = { x: 245, y: 285 };
let wall = null; // Segmento definido por centro, longitud y ángulo.
let running = false, elapsed = 0, lastFrame = 0, drag = null;
let ruler = { x: 90, y: 500, w: 360, h: 38, angle: 0 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function wallEnds() {
    if (!wall) return null;
    const dx = Math.cos(wall.angle) * wall.length / 2;
    const dy = Math.sin(wall.angle) * wall.length / 2;
    return [{ x: wall.x - dx, y: wall.y - dy }, { x: wall.x + dx, y: wall.y + dy }];
}
function getSources() {
    return sourceType.value === 'double'
        ? [source, { x: Math.min(W - 65, source.x + 115), y: source.y }]
        : [source];
}
function drawFronts(sources, time, clipPolygon = null, reflected = false) {
    const period = 1.5 / Number(frequency.value), maxR = Math.hypot(W, H) + 100;
    ctx.save();
    if (clipPolygon) {
        ctx.beginPath(); ctx.moveTo(clipPolygon[0].x, clipPolygon[0].y);
        for (let i = 1; i < clipPolygon.length; i++) ctx.lineTo(clipPolygon[i].x, clipPolygon[i].y);
        ctx.closePath(); ctx.clip();
    }
    sources.forEach(s => {
        for (let birth = 0; birth <= time; birth += period) {
            const radius = waveSpeed * (time - birth);
            if (radius > maxR) continue;
            ctx.beginPath(); ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = reflected ? 'rgba(255,220,150,.78)' : 'rgba(245,250,255,.9)';
            ctx.lineWidth = 2; ctx.stroke();
        }
    });
    ctx.restore();
}
function waterSidePolygon() {
    const ends = wallEnds();
    if (!ends) return null;
    // Polígono del lado de la fuente respecto de la pared inclinada.
    const a = ends[0], b = ends[1];
    const nx = -Math.sin(wall.angle), ny = Math.cos(wall.angle);
    const sign = (source.x - wall.x) * nx + (source.y - wall.y) * ny >= 0 ? 1 : -1;
    const p1 = { x: a.x + nx * sign * 2200, y: a.y + ny * sign * 2200 };
    const p2 = { x: b.x + nx * sign * 2200, y: b.y + ny * sign * 2200 };
    return [a, b, p2, p1];
}
function reflectPoint(p) {
    const nx = -Math.sin(wall.angle), ny = Math.cos(wall.angle);
    const signed = (p.x - wall.x) * nx + (p.y - wall.y) * ny;
    return { x: p.x - 2 * signed * nx, y: p.y - 2 * signed * ny };
}
function drawRuler() {
    ctx.save(); ctx.translate(ruler.x, ruler.y); ctx.rotate(ruler.angle);
    ctx.fillStyle = 'rgba(250,246,230,.97)'; ctx.fillRect(0, 0, ruler.w, ruler.h);
    for (let i = 0; i <= 12; i++) {
        const x = i * 30, major = i % 2 === 0;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, major ? 22 : 12);
        ctx.strokeStyle = '#174f6c'; ctx.lineWidth = 1; ctx.stroke();
        if (major) {
            ctx.fillStyle = '#174f6c'; ctx.font = '11px Arial';
            ctx.fillText(i / 2 === 0 ? '0' : (i / 2 === 1 ? '1 cm' : String(i / 2)), x + 2, 34);
        }
    }
    ctx.fillStyle = '#174f6c'; ctx.font = '11px Arial'; ctx.fillText('↻ girar', ruler.w - 43, -7);
    ctx.beginPath(); ctx.arc(ruler.w - 12, -12, 6, 0, Math.PI * 2); ctx.fillStyle = '#e0a52b'; ctx.fill();
    ctx.restore();
}
function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#14516f'); g.addColorStop(1, '#2588a7');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const active = getSources();
    if (running || elapsed > 0) {
        drawFronts(active, elapsed);
        if (wall) {
            const virtual = active.map(reflectPoint);
            drawFronts(virtual, elapsed, waterSidePolygon(), true);
        }
    }
    if (wall) {
        const [a, b] = wallEnds();
        ctx.lineCap = 'round'; ctx.strokeStyle = '#e9e4d5'; ctx.lineWidth = 13;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '14px Arial'; ctx.fillText('Pared · extremos para cambiar tamaño', clamp(wall.x + 12, 8, W - 270), clamp(wall.y - 18, 20, H - 12));
        // Manijas para redimensionar.
        [a, b].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.strokeStyle = '#173d54'; ctx.lineWidth = 2; ctx.stroke(); });
        ctx.beginPath(); ctx.arc(wall.x, wall.y, 6, 0, Math.PI * 2); ctx.fillStyle = '#ff9b54'; ctx.fill();
        const hx = wall.x + Math.cos(wall.angle) * 38 - Math.sin(wall.angle) * 18;
        const hy = wall.y + Math.sin(wall.angle) * 38 + Math.cos(wall.angle) * 18;
        ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fillStyle = '#7dd3fc'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText('↻', hx - 5, hy + 5);
    }
    active.forEach((s, i) => {
        ctx.beginPath(); ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ff7474'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '14px Arial'; ctx.fillText(i === 0 ? 'Fuente' : 'Fuente 2', s.x + 14, s.y - 12);
    });
    ctx.strokeStyle = 'rgba(245,240,223,.75)'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, W - 4, H - 4);
    if (rulerToggle && rulerToggle.checked) drawRuler();
    if (!running) {
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, H - 42, W, 42);
        ctx.fillStyle = '#fff'; ctx.font = '16px Arial';
        ctx.fillText(elapsed === 0 ? 'Presioná Iniciar para generar ondas' : 'Simulación pausada', 18, H - 15);
    }
}
function animate(ts) {
    if (!lastFrame) lastFrame = ts;
    const dt = Math.min((ts - lastFrame) / 1000, 0.05); lastFrame = ts;
    if (running) elapsed += dt;
    draw(); requestAnimationFrame(animate);
}
function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
function localRuler(p) {
    const dx = p.x - ruler.x, dy = p.y - ruler.y, c = Math.cos(ruler.angle), s = Math.sin(ruler.angle);
    return { x: dx * c + dy * s, y: -dx * s + dy * c };
}
canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    const p = pos(e);

    if (wall) {
        const [a, b] = wallEnds();
        const hx = wall.x + Math.cos(wall.angle) * 38 - Math.sin(wall.angle) * 18;
        const hy = wall.y + Math.sin(wall.angle) * 38 + Math.cos(wall.angle) * 18;

        if (Math.hypot(p.x - a.x, p.y - a.y) < 18) {
            drag = { type: 'wallEnd', fixed: { ...b } };
        } else if (Math.hypot(p.x - b.x, p.y - b.y) < 18) {
            drag = { type: 'wallEnd', fixed: { ...a } };
        } else if (Math.hypot(p.x - hx, p.y - hy) < 18) {
            drag = {
                type: 'wallRotate',
                startPointerAngle: Math.atan2(p.y - wall.y, p.x - wall.x),
                startWallAngle: wall.angle,
                lastAngleDelta: 0
            };
        } else if (Math.hypot(p.x - wall.x, p.y - wall.y) < 20 || distanceToSegment(p, a, b) < 13) {
            drag = { type: 'wallMove', dx: p.x - wall.x, dy: p.y - wall.y };
        }
    }

    if (!drag && getSources().some(s => Math.hypot(p.x - s.x, p.y - s.y) < 25)) {
        drag = { type: 'source' };
    }

    if (!drag && rulerToggle && rulerToggle.checked) {
        const q = localRuler(p);
        if (Math.hypot(q.x - (ruler.w - 12), q.y + 12) < 14) {
            drag = { type: 'rulerRotate' };
        } else if (Math.abs(q.x) < ruler.w / 2 + 8 && q.y > -12 && q.y < ruler.h + 8) {
            drag = { type: 'rulerMove', dx: p.x - ruler.x, dy: p.y - ruler.y };
        }
    }

    if (drag && canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    }
});
function distanceToSegment(p, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y;
    const length2 = vx * vx + vy * vy || 1;
    const t = clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / length2, 0, 1);
    return Math.hypot(p.x - a.x - t * vx, p.y - a.y - t * vy);
}
canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    e.preventDefault();
    const p = pos(e);

    if (drag.type === 'source') {
        const maxX = wall ? wall.x - (sourceType.value === 'double' ? 145 : 45) : W - 45;
        source.x = clamp(p.x, 45, Math.max(45, maxX));
        source.y = clamp(p.y, 45, H - 45);
    } else if (drag.type === 'wallMove') {
        wall.x = clamp(p.x - drag.dx, 45, W - 45);
        wall.y = clamp(p.y - drag.dy, 45, H - 45);
    } else if (drag.type === 'wallEnd') {
        const dx = p.x - drag.fixed.x;
        const dy = p.y - drag.fixed.y;
        const rawLength = Math.hypot(dx, dy);
        if (rawLength < 8) return;
        const length = clamp(rawLength, 70, 760);
        const angle = Math.atan2(dy, dx);
        const ux = Math.cos(angle), uy = Math.sin(angle);
        const moving = {
            x: drag.fixed.x + ux * length,
            y: drag.fixed.y + uy * length
        };
        wall.length = length;
        wall.angle = angle;
        wall.x = (drag.fixed.x + moving.x) / 2;
        wall.y = (drag.fixed.y + moving.y) / 2;
    } else if (drag.type === 'wallRotate') {
        const pointerAngle = Math.atan2(p.y - wall.y, p.x - wall.x);
        let delta = pointerAngle - drag.startPointerAngle;
        while (delta - drag.lastAngleDelta > Math.PI) delta -= Math.PI * 2;
        while (delta - drag.lastAngleDelta < -Math.PI) delta += Math.PI * 2;
        drag.lastAngleDelta = delta;
        wall.angle = drag.startWallAngle + delta;
    } else if (drag.type === 'rulerMove') {
        ruler.x = clamp(p.x - drag.dx, 0, W - 30);
        ruler.y = clamp(p.y - drag.dy, 25, H - 45);
    } else if (drag.type === 'rulerRotate') {
        ruler.angle = Math.atan2(p.y - ruler.y, p.x - ruler.x);
    }

    if (wall) {
        wallStatus.textContent = `Pared: ${Math.round(wall.length)} px · ${Math.round(((wall.angle * 180 / Math.PI) % 360 + 360) % 360)}°`;
    }
    draw();
});
function stopDragging(e) {
    if (drag && e && canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId)) {
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    drag = null;
}
canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);
canvas.addEventListener('lostpointercapture', () => { drag = null; });
wallToggle.addEventListener('click', () => {
    if (wall) {
        wall = null; wallToggle.textContent = 'Agregar pared'; wallStatus.textContent = 'No hay paredes.';
    } else {
        wall = { x: clamp(source.x + 300, 180, W - 80), y: H / 2, length: 390, angle: Math.PI / 2 };
        wallToggle.textContent = 'Quitar pared'; wallStatus.textContent = 'Pared: 390 px · 90°';
    }
    draw();
});
sourceType.addEventListener('change', () => draw());
frequency.addEventListener('input', draw);
if (rulerToggle) rulerToggle.addEventListener('change', draw);
document.getElementById('water-start').addEventListener('click', () => running = true);
document.getElementById('water-pause').addEventListener('click', () => running = false);
document.getElementById('water-reset').addEventListener('click', () => {
    running = false; elapsed = 0; lastFrame = 0; source = { x: 245, y: 285 }; wall = null;
    wallToggle.textContent = 'Agregar pared'; wallStatus.textContent = 'No hay paredes.';
    sourceType.value = 'point'; frequency.value = '5'; draw();
});
requestAnimationFrame(animate);