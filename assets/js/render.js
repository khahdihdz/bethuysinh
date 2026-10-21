import { state, onEvent } from './state.js';
import { P } from './palette.js';
import { drawText, drawTextRight, textWidth } from './font.js';
import {
  drawFish, drawShrimp, drawPlant, drawRock, drawWood,
  drawFilter, drawHeater, drawLightBar, drawLightCone,
  drawFood, drawBubble, drawAlgae,
} from './sprites.js';
import { FISH_BY_ID, xpNeed, fmtMoney } from './config.js';
import { waterVerdict, statusColor } from './sim.js';

export const W = 256;
export const H = 224;

const GLASS = { x: 16, y: 20, w: 224, h: 140 };
const WATER = { x: 20, y: 30, w: 216, h: 126 };
const SAND_TOP = 136;
const SAND_BOTTOM = 156;
const SWIM = { x0: 30, x1: 228, y0: 42, y1: 130 };

let canvas = null;
let ctx = null;
let raf = 0;
let last = 0;
let time = 0;
let parallax = 0;
let parallaxTarget = 0;

const bubbles = [];
const foods = [];
let bubbleTimer = 0;

function prng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const pebbles = (() => {
  const rnd = prng(1337);
  const out = [];
  for (let i = 0; i < 40; i++) {
    out.push({
      x: WATER.x + Math.floor(rnd() * WATER.w),
      y: SAND_TOP + 2 + Math.floor(rnd() * (SAND_BOTTOM - SAND_TOP - 3)),
      c: rnd() < 0.5 ? P.sand3 : P.sand4,
    });
  }
  return out;
})();

function ditherRect(x, y, w, h, color, phase = 0, step = 2) {
  ctx.fillStyle = color;
  for (let yy = y; yy < y + h; yy++) {
    const start = x + (((yy + phase) % 2) + 2) % 2;
    for (let xx = start; xx < x + w; xx += step) {
      ctx.fillRect(xx, yy, 1, 1);
    }
  }
}

function drawRoom() {
  ctx.fillStyle = P.room1;
  ctx.fillRect(0, 0, W, 176);
  const shift = Math.round(parallax);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? P.room2 : P.room1;
    ctx.fillRect(0, 8 + i * 22, W, 10);
  }
  // Cửa sổ nhỏ (parallax nhẹ)
  ctx.fillStyle = P.night1;
  ctx.fillRect(10 + shift, 14, 34, 46);
  ctx.fillStyle = P.night2;
  ctx.fillRect(12 + shift, 16, 30, 42);
  ctx.fillStyle = P.yellow;
  ctx.fillRect(22 + shift, 24, 2, 2);
  ctx.fillRect(32 + shift, 36, 1, 1);
  ctx.fillStyle = P.water5;
  ctx.fillRect(18 + shift, 44, 2, 2);
  ctx.fillStyle = P.grey1;
  ctx.fillRect(27 + shift, 16, 1, 42);
  ctx.fillRect(12 + shift, 35, 30, 1);

  // Kệ + hũ thức ăn
  ctx.fillStyle = P.wood2;
  ctx.fillRect(196 - shift, 34, 44, 3);
  ctx.fillStyle = P.water4;
  ctx.fillRect(204 - shift, 22, 8, 12);
  ctx.fillStyle = P.sand2;
  ctx.fillRect(205 - shift, 24, 6, 4);
  ctx.fillStyle = P.grey2;
  ctx.fillRect(218 - shift, 26, 6, 8);

  // Sàn
  ctx.fillStyle = P.night1;
  ctx.fillRect(0, 168, W, 8);
  ditherRect(0, 168, W, 8, P.night2, 0, 3);
}

function drawStand() {
  ctx.fillStyle = P.wood2;
  ctx.fillRect(GLASS.x - 4, GLASS.y + GLASS.h, GLASS.w + 8, 12);
  ctx.fillStyle = P.wood1;
  ctx.fillRect(GLASS.x - 4, GLASS.y + GLASS.h, GLASS.w + 8, 2);
  ctx.fillStyle = P.room2;
  ctx.fillRect(GLASS.x + 8, GLASS.y + GLASS.h + 12, 8, 4);
  ctx.fillRect(GLASS.x + GLASS.w - 12, GLASS.y + GLASS.h + 12, 8, 4);
}

function drawWater() {
  // Nền nước
  ctx.fillStyle = P.water3;
  ctx.fillRect(WATER.x, WATER.y, WATER.w, SAND_BOTTOM - WATER.y);

  // Dải sáng tối kiểu HDMA
  const shift = Math.round(Math.sin(time * 0.6) * 1);
  ctx.fillStyle = P.water4;
  for (let y = WATER.y; y < WATER.y + 40; y++) {
    if ((y + shift) % 3 !== 0) ctx.fillRect(WATER.x, y, WATER.w, 1);
  }
  ditherRect(WATER.x, WATER.y + 30, WATER.w, 30, P.water4, 0, 2);
  ditherRect(WATER.x, WATER.y + 60, WATER.w, 70, P.water2, 1, 2);

  // Gợn sáng chuyển động
  ctx.fillStyle = P.water5;
  for (let i = 0; i < 7; i++) {
    const yy = WATER.y + 8 + ((i * 17 + Math.floor(time * 6)) % 90);
    const xx = WATER.x + 12 + ((i * 37) % (WATER.w - 30));
    const len = 6 + (i % 3) * 4;
    ctx.fillRect(xx, yy, len, 1);
  }

  // Mặt nước
  ctx.fillStyle = P.water6;
  for (let x = WATER.x; x < WATER.x + WATER.w; x += 2) {
    const y = WATER.y + (Math.sin((x + time * 12) * 0.18) > 0.4 ? 1 : 0);
    ctx.fillRect(x, y, 2, 1);
  }
  ctx.fillStyle = P.water7;
  for (let x = WATER.x + 4; x < WATER.x + WATER.w; x += 9) {
    ctx.fillRect(x, WATER.y - 1, 3, 1);
  }
}

function drawSand() {
  ctx.fillStyle = P.sand2;
  ctx.fillRect(WATER.x, SAND_TOP, WATER.w, SAND_BOTTOM - SAND_TOP);
  // Mặt cát gợn sóng
  ctx.fillStyle = P.sand1;
  for (let x = WATER.x; x < WATER.x + WATER.w; x++) {
    const y = SAND_TOP + (Math.sin(x * 0.35) > 0.2 ? 1 : 0);
    ctx.fillRect(x, y, 1, 2);
  }
  ditherRect(WATER.x, SAND_TOP + 6, WATER.w, SAND_BOTTOM - SAND_TOP - 6, P.sand3, 0, 3);
  ctx.fillStyle = P.sand4;
  for (const p of pebbles) ctx.fillRect(p.x, p.y, 2, 1);
}

function drawDecorAndEquipment() {
  // Trang trí (vẽ từ trái sang phải)
  for (const d of state.decor) {
    const x = Math.round(WATER.x + d.x * WATER.w);
    if (d.type === 'plant') drawPlant(ctx, x, SAND_TOP + 1, 26 + (d.seed % 18), d.seed, time);
    else if (d.type === 'rock') drawRock(ctx, x, SAND_TOP + 2, 14 + (d.seed % 8), 6 + (d.seed % 5), d.seed);
    else if (d.type === 'wood') drawWood(ctx, x, SAND_TOP + 1, d.seed);
  }

  if (state.equipment.light) {
    drawLightBar(ctx, WATER.x + 8, GLASS.y + 3, WATER.w - 16);
  }

  if (state.equipment.filter) {
    drawFilter(ctx, WATER.x + WATER.w - 20, GLASS.y + 12, filterRunning());
  }
  if (state.equipment.heater) {
    drawHeater(ctx, WATER.x + 4, WATER.y + 42, state.heaterOn);
  }
}

function filterRunning() {
  return state.equipment.filter && !state.paused;
}

function drawLight() {
  if (!state.equipment.light || !state.lightOn) return;
  drawLightCone(ctx, WATER.x + WATER.w / 2, WATER.y + 2, 150, 96, Math.floor(time * 4));
}

function drawCreatures(dt) {
  // Cập nhật vị trí bơi
  for (const f of state.fish) {
    const sp = FISH_BY_ID[f.species];
    if (!sp) continue;
    const speed = (sp.shrimp ? 8 : sp.len > 18 ? 16 : 24);
    f.x += (f.vx || 0.3) * speed * dt;
    const wobble = Math.sin(time * 1.6 + (f.phase || 0)) * 0.25;
    f.y += wobble;
    const minY = sp.bottom ? 112 : SWIM.y0;
    const maxY = sp.bottom ? 130 : SWIM.y1 - sp.h;
    if (f.x < SWIM.x0) { f.x = SWIM.x0; f.vx = Math.abs(f.vx || 0.3); }
    if (f.x > SWIM.x1) { f.x = SWIM.x1; f.vx = -Math.abs(f.vx || 0.3); }
    if (f.y < minY) { f.y = minY; }
    if (f.y > maxY) { f.y = maxY; }
  }

  const sorted = [...state.fish].sort((a, b) => a.y - b.y);
  for (const f of sorted) {
    const sp = FISH_BY_ID[f.species];
    if (!sp) continue;
    if (sp.shrimp) drawShrimp(ctx, f, sp, time);
    else drawFish(ctx, f, sp, time);

    // Chỉ báo stress
    if (f.stress > 55) {
      const bx = Math.round(f.x);
      const by = Math.round(f.y) - (sp.h || 6) - 6;
      ctx.fillStyle = f.sick ? P.red2 : P.orange;
      ctx.fillRect(bx, by, 1, 3);
      ctx.fillRect(bx, by + 4, 1, 1);
    }
  }
}

function drawParticles(dt) {
  // Bong bóng từ lọc
  bubbleTimer += dt;
  if (state.equipment.filter && bubbleTimer > 0.35) {
    bubbleTimer = 0;
    if (bubbles.length < 40) {
      bubbles.push({
        x: WATER.x + WATER.w - 14 + (Math.random() * 4 - 2),
        y: GLASS.y + 16,
        vy: 8 + Math.random() * 6,
        size: Math.random() < 0.3 ? 2 : 1,
      });
    }
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y -= b.vy * dt;
    b.x += Math.sin((time + b.y) * 2) * 0.15;
    if (b.y < WATER.y + 2) {
      bubbles.splice(i, 1);
      continue;
    }
    drawBubble(ctx, b.x, b.y, b.size);
  }

  // Thức ăn
  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i];
    f.y += 7 * dt;
    f.x += Math.sin((time + f.phase) * 1.5) * 0.15;
    if (f.y > SAND_TOP - 2) {
      foods.splice(i, 1);
      continue;
    }
    drawFood(ctx, f.x, f.y, Math.sin(time * 3 + f.phase));
  }
}

function drawGlass() {
  // Viền kính
  ctx.fillStyle = P.grey2;
  ctx.fillRect(GLASS.x, GLASS.y, GLASS.w, 2);
  ctx.fillRect(GLASS.x, GLASS.y + GLASS.h - 2, GLASS.w, 2);
  ctx.fillRect(GLASS.x, GLASS.y, 2, GLASS.h);
  ctx.fillRect(GLASS.x + GLASS.w - 2, GLASS.y, 2, GLASS.h);

  ctx.fillStyle = P.glass;
  ctx.fillRect(GLASS.x + 2, GLASS.y + 2, 2, GLASS.h - 4);
  ctx.fillRect(GLASS.x + 2, GLASS.y + 2, GLASS.w - 4, 1);

  // Vệt phản chiếu chéo
  ctx.fillStyle = P.water7;
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(GLASS.x + 10 + i, GLASS.y + 8 + i * 3, 1, 2);
  }
  ctx.fillStyle = P.foam;
  ctx.fillRect(GLASS.x + 8, GLASS.y + 6, 1, 1);
  ctx.fillRect(GLASS.x + 9, GLASS.y + 6, 1, 2);
}

function drawHud() {
  ctx.fillStyle = P.grey3;
  ctx.fillRect(0, 176, W, H - 176);
  ctx.fillStyle = P.grey1;
  ctx.fillRect(0, 176, W, 1);

  // Dòng 1: tiền + cấp
  drawText(ctx, 'TIEN', 6, 181, P.grey1);
  drawText(ctx, `${fmtMoney(state.money)}D`, 36, 179, P.yellow, 2);
  drawText(ctx, 'CAP', 190, 181, P.grey1);
  drawText(ctx, `${state.level}`, 214, 179, P.white, 2);

  // Dòng 2: ngày giờ, uy tín, tốc độ
  const hh = String(Math.floor(state.hour)).padStart(2, '0');
  drawText(ctx, `NGAY ${state.day}`, 6, 196, P.water6);
  drawText(ctx, `${hh}:00`, 66, 196, P.water5);
  drawText(ctx, `REP ${Math.round(state.rep)}`, 104, 196, P.orange);
  const speedText = state.paused ? 'PAUSE' : `X${state.speed}`;
  drawTextRight(ctx, speedText, 250, 196, state.paused ? P.red2 : P.white);

  // Dòng 3: trạng thái nước
  const v = waterVerdict();
  drawText(ctx, v.text.slice(0, 40), 6, 207, statusColor(v.kind));

  // Thanh XP
  const need = xpNeed(state.level);
  const ratio = Math.max(0, Math.min(1, state.xp / need));
  ctx.fillStyle = P.grey2;
  ctx.fillRect(6, 217, 244, 4);
  ctx.fillStyle = P.water5;
  ctx.fillRect(6, 217, Math.round(244 * ratio), 4);
  ctx.fillStyle = P.water7;
  ctx.fillRect(6, 217, Math.round(244 * ratio), 1);
}

function drawEmptyTankHint() {
  ctx.fillStyle = P.grey2;
  ctx.fillRect(GLASS.x + 2, GLASS.y + 2, GLASS.w - 4, GLASS.h - 4);
  ctx.fillStyle = P.water1;
  ctx.fillRect(WATER.x, WATER.y, WATER.w, SAND_BOTTOM - WATER.y);
  ditherRect(WATER.x, WATER.y, WATER.w, SAND_BOTTOM - WATER.y, P.water2, 0, 3);

  const msg = 'MUA BE DE BAT DAU';
  drawText(ctx, msg, (W - textWidth(msg)) / 2, 92, P.water6);
  const msg2 = 'TAB CUA HANG > THIET BI';
  drawText(ctx, msg2, (W - textWidth(msg2)) / 2, 106, P.grey1);
}

function drawPauseOverlay() {
  ditherRect(WATER.x, WATER.y, WATER.w, SAND_BOTTOM - WATER.y, P.black, 0, 2);
  const msg = 'PAUSE';
  drawText(ctx, msg, (W - textWidth(msg, 2)) / 2, 80, P.yellow, 2);
}

function frame(now) {
  if (!ctx) return;
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  time += dt;

  parallax += (parallaxTarget - parallax) * 0.08;

  ctx.clearRect(0, 0, W, H);
  drawRoom();
  drawStand();

  if (!state.tank.id) {
    drawEmptyTankHint();
    drawGlass();
    drawHud();
    raf = requestAnimationFrame(frame);
    return;
  }

  drawWater();
  drawSand();
  drawDecorAndEquipment();

  drawLight();

  drawCreatures(dt);
  drawParticles(dt);

  drawAlgae(ctx, WATER.x, WATER.y, WATER.w, SAND_BOTTOM - WATER.y, state.algae, 77);
  drawGlass();

  if (state.paused) drawPauseOverlay();
  drawHud();

  raf = requestAnimationFrame(frame);
}

export function fitCanvas() {
  if (!canvas) return;
  const stage = canvas.parentElement;
  if (!stage) return;
  const availW = Math.max(160, stage.clientWidth - 4);
  const availH = Math.max(140, window.innerHeight * 0.58);
  const raw = Math.min(availW / W, availH / H);
  const scale = raw >= 2 ? Math.floor(raw) : Math.max(0.9, raw);
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}

export function initRender(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;
  canvas.width = W;
  canvas.height = H;

  onEvent('feed', () => {
    for (let i = 0; i < 10; i++) {
      foods.push({
        x: 90 + Math.random() * 70,
        y: WATER.y + 2,
        phase: Math.random() * 6.28,
      });
    }
  });
  onEvent('action', ({ act } = {}) => {
    if (act === 'water') {
      bubbles.length = 0;
      for (let i = 0; i < 14; i++) {
        bubbles.push({
          x: WATER.x + 10 + Math.random() * (WATER.w - 20),
          y: WATER.y + 20 + Math.random() * 80,
          vy: 10 + Math.random() * 10,
          size: Math.random() < 0.3 ? 2 : 1,
        });
      }
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    parallaxTarget = Math.max(-3, Math.min(3, -nx * 6));
  });
  canvas.addEventListener('mouseleave', () => {
    parallaxTarget = 0;
  });

  fitCanvas();
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => fitCanvas());
    ro.observe(canvas.parentElement);
  }
  window.addEventListener('resize', fitCanvas);

  last = performance.now();
  raf = requestAnimationFrame(frame);
}

export function stopRender() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}
