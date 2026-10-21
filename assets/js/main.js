import { state } from './state.js';
import { initRender } from './render.js';
import {
  initUI, renderUI, refreshUI, showIntro, showOfflineReport, markDirty,
} from './ui.js';
import { load, save } from './save.js';
import { simulate } from './sim.js';
import { checkQuests, checkAchievements } from './quests.js';
import { initAudio } from './audio.js';

const canvas = document.getElementById('game');
const report = load();
const firstRun = report === null;

initAudio();
initRender(canvas);
initUI();
refreshUI();

// Vòng lặp mô phỏng: 1 giây thực = 1 giờ game ở tốc độ x1
let last = performance.now();
let saveTimer = 0;

setInterval(() => {
  const now = performance.now();
  const dt = Math.min(1, (now - last) / 1000);
  last = now;

  if (!state.paused) {
    simulate(dt * state.speed);
    checkQuests();
    checkAchievements();
    markDirty();
  }

  saveTimer += dt;
  if (saveTimer >= 5) {
    saveTimer = 0;
    save();
  }
}, 250);

// Cập nhật panel mỗi 600ms nếu có thay đổi
setInterval(() => {
  renderUI();
}, 600);

setInterval(() => {
  save();
}, 15000);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
});
window.addEventListener('pagehide', () => save());

if (firstRun) {
  setTimeout(() => showIntro(), 350);
} else if (report && report.hours > 1) {
  setTimeout(() => showOfflineReport(report), 400);
}

// Ghi chú debug nhẹ (không lộ dữ liệu)
window.addEventListener('error', (e) => {
  console.error('Game error:', e.message);
});
