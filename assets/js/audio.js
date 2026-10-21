// Âm thanh chip tổng hợp bằng WebAudio, mặc định TẮT.
let ctx = null;
let enabled = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setAudio(on) {
  enabled = !!on;
  if (enabled) ensureCtx();
  try {
    localStorage.setItem('bexanh16_audio', enabled ? '1' : '0');
  } catch {
    /* bỏ qua */
  }
}

export function initAudio() {
  try {
    enabled = localStorage.getItem('bexanh16_audio') === '1';
  } catch {
    enabled = false;
  }
  return enabled;
}

export function isAudioOn() {
  return enabled;
}

export function beep(freq = 440, dur = 0.06, type = 'square', vol = 0.03) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur);
}

export function sfxClick() {
  beep(520, 0.04, 'square', 0.025);
}

export function sfxBuy() {
  beep(660, 0.05, 'square', 0.03);
  setTimeout(() => beep(880, 0.07, 'square', 0.025), 60);
}

export function sfxBad() {
  beep(140, 0.14, 'sawtooth', 0.03);
}

export function sfxGood() {
  beep(740, 0.06, 'triangle', 0.03);
  setTimeout(() => beep(990, 0.09, 'triangle', 0.025), 70);
}
