// Toàn bộ đồ hoạ được vẽ bằng fillRect trên lưới pixel nguyên.
// Không dùng ảnh raster, không anti-alias, không gradient mịn.
import { P } from './palette.js';

function prng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// Độ rộng từng hàng của thân cá (hình ellipse, làm tròn pixel).
function bodyWidths(h, len) {
  const out = [];
  const half = (h - 1) / 2 || 1;
  for (let i = 0; i < h; i++) {
    const d = Math.abs(i - half) / half;
    const w = Math.sqrt(Math.max(0, 1 - d * d)) * len;
    out.push(Math.max(1, Math.round(w)));
  }
  return out;
}

export function drawFish(ctx, fish, sp, t) {
  const dir = fish.vx < 0 ? -1 : 1;
  const bob = Math.round(Math.sin(t * 2.2 + (fish.phase || 0)) * 1);
  const cx = Math.round(fish.x);
  const cy = Math.round(fish.y) + bob;
  const len = sp.len || 12;
  const h = sp.h || 6;
  const c = sp.colors || {};
  const top = c.top || P.water4;
  const body = c.body || P.orange;
  const belly = c.belly || P.white;
  const fin = c.fin || P.water6;
  const tail = c.tail || fin;

  ctx.save();
  ctx.translate(cx, cy);
  if (dir < 0) ctx.scale(-1, 1);

  const bodyL = Math.max(4, Math.round(len * 0.78));
  const nose = Math.round(bodyL / 2);
  const sway = Math.round(Math.sin(t * 7 + (fish.phase || 0) * 2) * 2);

  // Đuôi: quạt pixel, vẫy theo thời gian
  ctx.fillStyle = tail;
  for (let i = 0; i < h; i++) {
    const d = Math.abs(i - (h - 1) / 2) / ((h - 1) / 2 || 1);
    const w = Math.max(1, Math.round((1 - d) * len * 0.24) + 1);
    const off = Math.round((i - (h - 1) / 2) * 0.22 * sway);
    ctx.fillRect(-nose - w + 2 + off, i - Math.floor(h / 2), w, 1);
  }

  // Thân
  const widths = bodyWidths(h, bodyL);
  for (let i = 0; i < h; i++) {
    const w = widths[i];
    let color = body;
    if (i <= Math.floor(h * 0.2)) color = top;
    else if (i >= h - 2) color = belly;
    ctx.fillStyle = color;
    ctx.fillRect(-Math.floor(w / 2), i - Math.floor(h / 2), w, 1);
  }

  // Sọc dọc (neon tetra)
  if (sp.stripe) {
    ctx.fillStyle = sp.stripe;
    const y = Math.floor(h / 2) - Math.floor(h / 2);
    ctx.fillRect(-nose + 1, y, bodyL - 2, 1);
  }

  // Vây lưng
  ctx.fillStyle = fin;
  const dorsalH = Math.max(1, Math.round(h * 0.28));
  for (let i = 0; i < dorsalH; i++) {
    ctx.fillRect(-2 + i, -Math.floor(h / 2) - dorsalH + i, Math.max(1, 3 - i), 1);
  }

  // Vây ngực
  ctx.fillRect(nose - 4, 1 + Math.round(sway * 0.5), 3, 1);
  ctx.fillRect(nose - 4, 2 + Math.round(sway * 0.5), 2, 1);

  // Mắt
  ctx.fillStyle = P.ink;
  ctx.fillRect(nose - 3, -1, 2, 2);
  ctx.fillStyle = P.pure;
  ctx.fillRect(nose - 3, -1, 1, 1);

  // Miệng
  ctx.fillStyle = top;
  ctx.fillRect(nose, 0, 1, 1);

  ctx.restore();
}

// Tép: thân cong nhiều đốt + râu
export function drawShrimp(ctx, fish, sp, t) {
  const dir = fish.vx < 0 ? -1 : 1;
  const cx = Math.round(fish.x);
  const cy = Math.round(fish.y) + Math.round(Math.sin(t * 3 + (fish.phase || 0)));
  const c = sp.colors || {};
  const body = c.body || P.red2;
  const light = c.belly || P.sand1;

  ctx.save();
  ctx.translate(cx, cy);
  if (dir < 0) ctx.scale(-1, 1);
  ctx.fillStyle = body;
  // 6 đốt thân cong dần
  for (let i = 0; i < 6; i++) {
    const x = -5 + i;
    const y = Math.round(Math.sin(i * 0.5) * 1.2) - 1;
    ctx.fillRect(x, y, 1, 3);
    if (i % 2 === 0) {
      ctx.fillStyle = light;
      ctx.fillRect(x, y + 2, 1, 1);
      ctx.fillStyle = body;
    }
  }
  // đuôi
  ctx.fillRect(-7, -1, 2, 3);
  // râu
  ctx.fillRect(2, -2, 2, 1);
  ctx.fillRect(2, 1, 2, 1);
  // mắt
  ctx.fillStyle = P.ink;
  ctx.fillRect(1, -1, 1, 1);
  ctx.restore();
}

export function drawPlant(ctx, x, baseY, height, seed, t) {
  const rnd = prng(seed);
  const stems = 2 + Math.floor(rnd() * 3);
  const sway = Math.sin(t * 0.9 + seed) * 1.6;
  for (let s = 0; s < stems; s++) {
    const sx = Math.round(x + (s - (stems - 1) / 2) * 3);
    const hh = Math.round(height * (0.55 + rnd() * 0.6));
    for (let i = 0; i < hh; i++) {
      const px = sx + Math.round(sway * (i / hh) * (s % 2 ? 1 : -1));
      const py = baseY - i;
      ctx.fillStyle = i % 6 < 2 ? P.leaf2 : P.leaf3;
      ctx.fillRect(px, py, 1, 1);
      if (i % 4 === 0 && i > 3) {
        ctx.fillStyle = P.leaf4;
        ctx.fillRect(px - 1, py, 2, 1);
        if (i % 8 === 0) {
          ctx.fillStyle = P.leaf5;
          ctx.fillRect(px + (s % 2 ? 1 : -2), py - 1, 1, 1);
        }
      }
    }
  }
}

export function drawRock(ctx, x, baseY, w, h, seed) {
  const rnd = prng(seed);
  ctx.fillStyle = P.rock2;
  for (let i = 0; i < h; i++) {
    const d = i / h;
    const rw = Math.max(1, Math.round(w * (0.55 + 0.45 * Math.sin((d + 0.15) * Math.PI))));
    const off = Math.round((rnd() - 0.5) * 1);
    ctx.fillRect(Math.round(x - rw / 2 + off), baseY - h + i, rw, 1);
  }
  ctx.fillStyle = P.rock1;
  for (let i = 0; i < Math.floor(h / 2); i++) {
    ctx.fillRect(Math.round(x - w * 0.25), baseY - h + i + 1, 2, 1);
  }
  ctx.fillStyle = P.rock3;
  ctx.fillRect(Math.round(x - w * 0.35), baseY - 1, Math.round(w * 0.7), 1);
}

export function drawWood(ctx, x, baseY, seed) {
  const rnd = prng(seed);
  ctx.fillStyle = P.wood2;
  for (let i = 0; i < 6; i++) {
    const px = Math.round(x - 6 + i * 2 + (rnd() - 0.5) * 2);
    ctx.fillRect(px, baseY - 10 - Math.floor(rnd() * 4), 2, 12);
  }
  ctx.fillStyle = P.wood1;
  ctx.fillRect(Math.round(x - 8), baseY - 3, 16, 2);
  ctx.fillRect(Math.round(x - 2), baseY - 14, 3, 12);
}

export function drawFilter(ctx, x, y, running) {
  // hộp lọc
  ctx.fillStyle = P.grey2;
  ctx.fillRect(x, y, 14, 18);
  ctx.fillStyle = P.grey1;
  ctx.fillRect(x + 1, y + 1, 12, 3);
  ctx.fillStyle = P.water5;
  ctx.fillRect(x + 2, y + 5, 10, 8);
  ctx.fillStyle = P.water6;
  ctx.fillRect(x + 3, y + 6, 3, 6);
  // ống hút
  ctx.fillStyle = P.grey1;
  ctx.fillRect(x + 9, y + 16, 2, 26);
  ctx.fillStyle = P.grey2;
  ctx.fillRect(x + 8, y + 40, 4, 3);
  if (running) {
    ctx.fillStyle = P.foam;
    ctx.fillRect(x + 11, y + 2, 1, 1);
  }
}

export function drawHeater(ctx, x, y, on) {
  ctx.fillStyle = P.grey1;
  ctx.fillRect(x, y, 4, 26);
  ctx.fillStyle = on ? P.red2 : P.grey2;
  ctx.fillRect(x + 1, y + 2, 2, 22);
  if (on) {
    ctx.fillStyle = P.orange;
    ctx.fillRect(x + 1, y + 6, 1, 14);
  }
  ctx.fillStyle = P.grey3;
  ctx.fillRect(x, y + 24, 4, 3);
}

export function drawLightBar(ctx, x, y, w) {
  ctx.fillStyle = P.grey2;
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = P.grey1;
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
  ctx.fillStyle = P.yellow;
  for (let i = 3; i < w - 3; i += 5) ctx.fillRect(x + i, y + 3, 2, 1);
}

// Nón sáng kiểu dither (không dùng gradient mờ)
export function drawLightCone(ctx, x, y, w, h, frame) {
  for (let row = 0; row < h; row++) {
    const t = row / h;
    const half = Math.round((w / 2) * (0.35 + t * 0.65));
    const step = row % 2 === 0 ? 2 : 3;
    const off = frame % 3;
    ctx.fillStyle = row % 3 === 0 ? P.yellow : P.orange;
    for (let px = -half + off; px < half; px += step) {
      const xx = Math.round(x + px);
      if ((xx + row) % 2 === 0) ctx.fillRect(xx, y + row, 1, 1);
    }
  }
}

export function drawFood(ctx, x, y, bob) {
  const px = Math.round(x);
  const py = Math.round(y + bob);
  ctx.fillStyle = P.sand1;
  ctx.fillRect(px, py, 1, 1);
  ctx.fillStyle = P.sand3;
  ctx.fillRect(px + 1, py, 1, 1);
}

export function drawBubble(ctx, x, y, size) {
  ctx.fillStyle = P.water6;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
  ctx.fillStyle = P.foam;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

export function drawAlgae(ctx, x, y, w, h, amount, seed) {
  const rnd = prng(seed);
  const count = Math.floor(w * h * clamp01(amount) * 0.25);
  ctx.fillStyle = P.leaf2;
  for (let i = 0; i < count; i++) {
    const px = x + Math.floor(rnd() * w);
    const py = y + Math.floor(rnd() * h);
    ctx.fillRect(px, py, 1, 1);
  }
  ctx.fillStyle = P.leaf1;
  for (let i = 0; i < count / 3; i++) {
    const px = x + Math.floor(rnd() * w);
    const py = y + Math.floor(rnd() * h);
    ctx.fillRect(px, py, 2, 1);
  }
}
