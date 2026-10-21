import { state, onEvent, resetState } from './state.js';
import {
  TANKS, FILTERS, HEATERS, SUPPLIES, DECOR, FISH, FISH_BY_ID, QUESTS,
  ACHIEVEMENTS, EVENTS, TANK_BY_ID, FILTER_BY_ID, HEATER_BY_ID, fmtMoney, xpNeed,
} from './config.js';
import * as sim from './sim.js';
import {
  checkQuests, checkAchievements, currentQuest, questProgress, achievementCount,
  resetQuestsCursor,
} from './quests.js';
import { save, clearSave } from './save.js';
import { openDialog, initDialog } from './dialog.js';
import {
  initAudio, isAudioOn, setAudio, sfxClick, sfxBuy, sfxGood, sfxBad,
} from './audio.js';

let panel;
let tabsEl;
let toastsEl;
let soundBtn;
let dirty = true;
let resetArmed = false;
let lastPanelHtml = '';

const TABS = [
  ['tank', 'Bể'],
  ['shop', 'Cửa hàng'],
  ['fish', 'Cá'],
  ['quests', 'Nhiệm vụ'],
  ['ach', 'Thành tựu'],
  ['settings', 'Cài đặt'],
];

function money(n) {
  return `${fmtMoney(n)}đ`;
}

function pct(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function bar(value, color = 'var(--accent)') {
  return `<span class="bar"><i style="width:${pct(value)}%;background:${color}"></i></span>`;
}

function waterColor(kind) {
  if (kind === 'bad') return 'var(--bad)';
  if (kind === 'warn') return 'var(--warn)';
  return 'var(--good)';
}

export function markDirty() {
  dirty = true;
}

export function initUI() {
  panel = document.getElementById('panel');
  tabsEl = document.getElementById('tabs');
  toastsEl = document.getElementById('toasts');
  soundBtn = document.getElementById('sound-btn');
  initDialog();
  const audio = initAudio();
  updateSoundBtn(audio);

  tabsEl.innerHTML = TABS.map(([id, label]) => (
    `<button type="button" class="tab" role="tab" data-act="tab" data-id="${id}" aria-selected="${state.ui.tab === id}">${label}</button>`
  )).join('');

  document.getElementById('app').addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    handleAct(el.dataset.act, el.dataset.id, el);
  });

  onEvent('toast', ({ text, kind }) => toast(text, kind));
  onEvent('quest', () => { dirty = true; });
  onEvent('event', (id) => openEvent(id));
  onEvent('income', () => { dirty = true; });

  document.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (document.getElementById('dialog-layer')?.hidden === false) return;
    if (e.key === '1') setSpeed(1);
    else if (e.key === '2') setSpeed(4);
    else if (e.key === '3') setSpeed(16);
    else if (e.key === ' ') {
      e.preventDefault();
      togglePause();
    }
  });

  renderTabs();
  renderPanel(true);
}

function setSpeed(n) {
  state.speed = n;
  state.paused = false;
  toast(`Tốc độ x${n}`, 'info');
  dirty = true;
}

function togglePause() {
  state.paused = !state.paused;
  toast(state.paused ? 'Đã tạm dừng' : 'Tiếp tục', 'info');
  dirty = true;
}

function updateSoundBtn(on) {
  if (!soundBtn) return;
  soundBtn.textContent = on ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT';
  soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function renderTabs() {
  for (const btn of tabsEl.querySelectorAll('[data-act="tab"]')) {
    const active = btn.dataset.id === state.ui.tab;
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
    btn.classList.toggle('is-active', active);
  }
}

export function renderUI(force = false) {
  if (!panel) return;
  if (!force && !dirty) return;
  dirty = false;
  renderTabs();
  const scroll = panel.scrollTop;
  const html = panelHtml();
  if (html !== lastPanelHtml) {
    panel.innerHTML = html;
    lastPanelHtml = html;
    panel.scrollTop = scroll;
  }
}

function statusRow(label, value, color, extra = '') {
  return `<div class="stat">
    <span class="stat-label">${label}</span>
    <span class="stat-value" style="color:${color}">${value}</span>
    ${extra}
  </div>`;
}

function tankPanel() {
  if (!state.tank.id) {
    return `<div class="empty">
      <p class="empty-title">Bể của bạn đang trống</p>
      <p>Mua một bể ở tab <b>Cửa hàng</b> để bắt đầu. Bể 40L là lựa chọn cân bằng cho người mới.</p>
      <button type="button" class="btn btn-primary" data-act="tab" data-id="shop">Đi tới Cửa hàng</button>
    </div>`;
  }
  const w = state.water;
  const nh3Kind = w.nh3 > 0.25 ? 'bad' : w.nh3 > 0.1 ? 'warn' : 'good';
  const no2Kind = w.no2 > 0.2 ? 'bad' : w.no2 > 0.05 ? 'warn' : 'good';
  const no3Kind = w.no3 > 40 ? 'warn' : 'good';
  const o2Kind = w.o2 < 4 ? 'bad' : 'good';
  const tempKind = w.temp < 22 || w.temp > 29 ? 'warn' : 'good';
  const filter = state.equipment.filter ? FILTER_BY_ID[state.equipment.filter] : null;
  const heater = state.equipment.heater ? HEATER_BY_ID[state.equipment.heater] : null;

  return `
    <div class="stat-grid">
      ${statusRow('NH3', `${w.nh3.toFixed(2)} mg/L`, waterColor(nh3Kind))}
      ${statusRow('NO2', `${w.no2.toFixed(2)} mg/L`, waterColor(no2Kind))}
      ${statusRow('NO3', `${Math.round(w.no3)} mg/L`, waterColor(no3Kind))}
      ${statusRow('Oxy', `${w.o2.toFixed(1)} mg/L`, waterColor(o2Kind))}
      ${statusRow('Nhiệt độ', `${w.temp.toFixed(1)}°C`, waterColor(tempKind))}
      ${statusRow('pH', w.ph.toFixed(1), 'var(--text)')}
      ${statusRow('Độ trong', `${Math.round(w.clarity)}%`, 'var(--text)')}
      ${statusRow('Vi sinh', `${sim.cycleProgress()}%`, state.cycled ? 'var(--good)' : 'var(--warn)')}
    </div>

    <div class="line">
      <span class="pill ${state.cycled ? 'pill-good' : 'pill-warn'}">
        ${state.cycled ? 'Đã cycle — an toàn thả cá' : `Chưa cycle · ổn định ${Math.floor(state.cycleStreak)}/48 giờ`}
      </span>
      <span class="pill">${state.tank.liters}L</span>
      <span class="pill">Tải ${sim.fishLoad().toFixed(0)}/${sim.capacity().toFixed(0)}L</span>
    </div>

    <div class="actions">
      <button type="button" class="btn" data-act="feed">Cho ăn <small>x${state.inv.food}</small></button>
      <button type="button" class="btn" data-act="water">Thay 25% nước</button>
      <button type="button" class="btn" data-act="clean">Vệ sinh lọc</button>
      <button type="button" class="btn" data-act="bacteria">Thêm vi sinh <small>x${state.inv.bacteria}</small></button>
      <button type="button" class="btn" data-act="test">Test nước <small>x${state.inv.tests}</small></button>
      <button type="button" class="btn" data-act="medicine">Dùng thuốc <small>x${state.inv.medicine}</small></button>
      <button type="button" class="btn ${state.lightOn ? 'btn-on' : ''}" data-act="light">Đèn: ${state.lightOn ? 'BẬT' : 'TẮT'}</button>
      <button type="button" class="btn ${state.heaterOn ? 'btn-on' : ''}" data-act="heater">Sưởi: ${state.heaterOn ? 'BẬT' : 'TẮT'}</button>
    </div>

    <h3 class="sub">Thiết bị</h3>
    <ul class="list">
      <li><span>Bể ${state.tank.liters}L</span><span class="dim">${TANK_BY_ID[state.tank.id]?.name || ''}</span></li>
      <li><span>Lọc</span><span class="${filter ? '' : 'dim'}">${filter ? `${filter.name} (hiệu suất ${Math.round(sim.filterEff() * 100)}%)` : 'Chưa có'}</span></li>
      <li><span>Sưởi</span><span class="${heater ? '' : 'dim'}">${heater ? `${heater.name} · ${state.heaterOn ? 'bật' : 'tắt'}` : 'Chưa có'}</span></li>
      <li><span>Đèn</span><span class="${state.equipment.light ? '' : 'dim'}">${state.equipment.light ? (state.lightOn ? 'LED · bật' : 'LED · tắt') : 'Chưa có'}</span></li>
      <li><span>Nền</span><span class="${state.equipment.substrate ? '' : 'dim'}">${state.equipment.substrate ? 'Nền dinh dưỡng' : 'Cát trơ'}</span></li>
      <li><span>Trang trí</span><span>${state.decor.length} món</span></li>
    </ul>
    <p class="hint">Mẹo: NH3 &gt; 0.25 mg/L là nguy hiểm. Khi bể chưa cycle, đừng thả cá.</p>
  `;
}

function shopPanel() {
  const tankRows = TANKS.map((t) => `
    <li class="shop-item">
      <div class="shop-main">
        <b>${t.name}</b>
        <span class="dim">${t.desc}</span>
      </div>
      <div class="shop-buy">
        <span class="price">${money(t.price)}</span>
        ${buyButton('buy-tank', t.id, state.level >= t.level && state.money >= t.price, `Cấp ${t.level}`)}
      </div>
    </li>`).join('');

  const filterRows = FILTERS.map((f) => `
    <li class="shop-item">
      <div class="shop-main"><b>${f.name}</b><span class="dim">${f.desc} · hiệu suất ${Math.round(f.eff * 100)}%</span></div>
      <div class="shop-buy">
        <span class="price">${money(f.price)}</span>
        ${buyButton('buy-filter', f.id, state.level >= f.level && state.money >= f.price, `Cấp ${f.level}`)}
      </div>
    </li>`).join('');

  const heaterRows = HEATERS.map((h) => `
    <li class="shop-item">
      <div class="shop-main"><b>${h.name}</b><span class="dim">${h.desc}</span></div>
      <div class="shop-buy">
        <span class="price">${money(h.price)}</span>
        ${buyButton('buy-heater', h.id, state.level >= h.level && state.money >= h.price, `Cấp ${h.level}`)}
      </div>
    </li>`).join('');

  const supplyRows = SUPPLIES.map((s) => {
    const owned = state.inv[s.key] || 0;
    return `<li class="shop-item">
      <div class="shop-main"><b>${s.name}</b><span class="dim">${s.desc} · đang có ${owned}</span></div>
      <div class="shop-buy">
        <span class="price">${money(s.price)}</span>
        ${buyButton('buy-supply', s.id, state.money >= s.price, '')}
      </div>
    </li>`;
  }).join('');

  const decorRows = DECOR.map((d) => {
    const owned = d.type === 'substrate' ? state.equipment.substrate : d.type === 'light' ? state.equipment.light : false;
    return `<li class="shop-item">
      <div class="shop-main"><b>${d.name}</b><span class="dim">${d.desc}</span></div>
      <div class="shop-buy">
        <span class="price">${money(d.price)}</span>
        ${buyButton('buy-decor', d.id, !owned && state.money >= d.price, owned ? 'Đã có' : '')}
      </div>
    </li>`;
  }).join('');

  const fishRows = FISH.map((f) => `
    <li class="shop-item">
      <div class="shop-main">
        <b>${f.name}</b>
        <span class="dim">${f.minLiters}L tối thiểu · ${f.temp[0]}–${f.temp[1]}°C · pH ${f.ph[0]}–${f.ph[1]}</span>
      </div>
      <div class="shop-buy">
        <span class="price">${money(f.price)}</span>
        ${buyButton('buy-fish', f.id, state.level >= f.level && state.money >= f.price && sim.fishLoad() + f.minLiters <= sim.capacity(), `Cấp ${f.level}`)}
      </div>
    </li>`).join('');

  return `
    <div class="line">
      <span class="pill">${money(state.money)}</span>
      <span class="pill">Tải ${sim.fishLoad().toFixed(0)}/${sim.capacity().toFixed(0)}L</span>
      <span class="pill">Cấp ${state.level}</span>
    </div>
    <h3 class="sub">Bể</h3><ul class="list shop-list">${tankRows}</ul>
    <h3 class="sub">Lọc</h3><ul class="list shop-list">${filterRows}</ul>
    <h3 class="sub">Sưởi</h3><ul class="list shop-list">${heaterRows}</ul>
    <h3 class="sub">Vật tư</h3><ul class="list shop-list">${supplyRows}</ul>
    <h3 class="sub">Trang trí</h3><ul class="list shop-list">${decorRows}</ul>
    <h3 class="sub">Cá</h3><ul class="list shop-list">${fishRows}</ul>
    <p class="hint">Giá và thông số mang tính mô phỏng. Cá vàng cần bể từ 80L, đừng nuôi trong bể nano.</p>
  `;
}

function buyButton(act, id, ok, req) {
  return `<button type="button" class="btn ${ok ? 'btn-primary' : ''}" data-act="${act}" data-id="${id}" ${ok ? '' : 'disabled title="Chưa đủ điều kiện"'}>${req || 'Mua'}</button>`;
}

function fishPanel() {
  if (!state.fish.length) {
    return `<div class="empty">
      <p class="empty-title">Chưa có cá</p>
      <p>${state.cycled ? 'Bể đã sẵn sàng. Chọn loài phù hợp thể tích và nhiệt độ.' : 'Hãy hoàn tất cycle trước khi thả cá để tránh ngộ độc NH3/NO2.'}</p>
      <button type="button" class="btn btn-primary" data-act="tab" data-id="shop">Mua cá</button>
    </div>`;
  }
  const rows = state.fish.map((f, i) => {
    const sp = FISH_BY_ID[f.species];
    const stressColor = f.stress > 65 ? 'var(--bad)' : f.stress > 35 ? 'var(--warn)' : 'var(--good)';
    return `<li class="fish-item">
      <div class="fish-main">
        <b>${sp.name}</b> ${f.sick ? '<span class="pill pill-bad">bệnh</span>' : ''}
        <span class="dim">${sp.minLiters}L · ${sp.temp[0]}–${sp.temp[1]}°C</span>
      </div>
      <div class="fish-side">
        <span class="stress">Stress ${Math.round(f.stress)}%</span>
        ${bar(f.stress, stressColor)}
        <button type="button" class="btn btn-small" data-act="sell-fish" data-id="${i}">Bán ${money(Math.round(sp.price * 0.6))}</button>
      </div>
    </li>`;
  }).join('');
  return `
    <div class="line">
      <span class="pill">Tải ${sim.fishLoad().toFixed(0)}/${sim.capacity().toFixed(0)}L</span>
      <span class="pill">${state.fish.length} con</span>
      <span class="pill">${state.stats.deaths} đã chết</span>
    </div>
    <ul class="list">${rows}</ul>
    <p class="hint">Cá stress &gt; 65% dễ bệnh. Kiểm tra NH3, NO2, nhiệt độ và oxy trước khi dùng thuốc.</p>
  `;
}

function questsPanel() {
  const prog = questProgress();
  const cur = currentQuest();
  const rows = QUESTS.map((q, i) => {
    const done = !!state.quests[q.id];
    const active = cur && cur.id === q.id;
    return `<li class="quest ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}">
      <span class="quest-mark">${done ? '✓' : active ? '▶' : '·'}</span>
      <div class="quest-main">
        <b>${q.title}</b>
        <span class="dim">${q.hint}</span>
        <span class="reward">+${money(q.money)} · +${q.xp} XP</span>
      </div>
    </li>`;
  }).join('');
  return `
    <div class="line">
      <span class="pill">${prog.done}/${prog.total} nhiệm vụ</span>
      <span class="pill">Cấp ${state.level}</span>
      <span class="pill">XP ${state.xp}/${xpNeed(state.level)}</span>
    </div>
    <ul class="list quest-list">${rows}</ul>
  `;
}

function achPanel() {
  const rows = ACHIEVEMENTS.map((a) => {
    const done = !!state.achievements[a.id];
    return `<li class="ach ${done ? 'is-done' : ''}">
      <span class="ach-mark">${done ? '✓' : '?'}</span>
      <div><b>${a.name}</b><span class="dim">${a.desc}</span></div>
    </li>`;
  }).join('');
  return `
    <div class="line">
      <span class="pill">${achievementCount()}/${ACHIEVEMENTS.length}</span>
      <span class="pill">Mỗi thành tựu +30.000đ</span>
    </div>
    <ul class="list ach-list">${rows}</ul>
  `;
}

function settingsPanel() {
  return `
    <div class="line">
      ${[1, 4, 16].map((n) => `<button type="button" class="btn ${state.speed === n && !state.paused ? 'btn-primary' : ''}" data-act="speed" data-id="${n}">x${n}</button>`).join('')}
      <button type="button" class="btn ${state.paused ? 'btn-primary' : ''}" data-act="pause">${state.paused ? 'Tiếp tục' : 'Tạm dừng'}</button>
    </div>
    <ul class="list">
      <li><span>Lưu tự động</span><span class="dim">mỗi 5 giây + sau mỗi thao tác</span></li>
      <li><span>Thời gian game</span><span class="dim">1 giây thực = 1 giờ game</span></li>
      <li><span>Tiến trình</span><span class="dim">Ngày ${state.day} · ${state.stats.hours.toFixed(0)} giờ đã chơi</span></li>
    </ul>
    <div class="actions">
      <button type="button" class="btn" data-act="save-now">Lưu ngay</button>
      <button type="button" class="btn btn-danger" data-act="reset-save">${resetArmed ? 'Chắc chắn xoá? Bấm lần nữa' : 'Chơi mới'}</button>
    </div>
    <h3 class="sub">Hướng dẫn nhanh</h3>
    <ol class="howto">
      <li>Mua bể → lắp lọc → lắp sưởi.</li>
      <li>Thêm vi sinh, rắc một nhúm thức ăn để tạo amoniac.</li>
      <li>Test nước, chờ vi sinh &gt; 75% và NH3/NO2 gần 0 trong 2 ngày game.</li>
      <li>Thay nước, thả cá, cho ăn 1–2 lần/ngày.</li>
      <li>Giữ NH3 &lt; 0.25, NO2 &lt; 0.2, NO3 &lt; 40, nhiệt độ đúng loài.</li>
    </ol>
    <p class="hint">Đây là game mô phỏng, không thay thế hướng dẫn nuôi cá thật.</p>
  `;
}

function panelHtml() {
  switch (state.ui.tab) {
    case 'shop': return shopPanel();
    case 'fish': return fishPanel();
    case 'quests': return questsPanel();
    case 'ach': return achPanel();
    case 'settings': return settingsPanel();
    default: return tankPanel();
  }
}

function handleAct(act, id, el) {
  let ok = false;
  switch (act) {
    case 'tab':
      state.ui.tab = id;
      resetArmed = false;
      renderTabs();
      lastPanelHtml = '';
      renderPanel(true);
      return;
    case 'buy-tank': ok = sim.buyTank(id); if (ok) sfxBuy(); break;
    case 'buy-filter': ok = sim.buyFilter(id); if (ok) sfxBuy(); break;
    case 'buy-heater': ok = sim.buyHeater(id); if (ok) sfxBuy(); break;
    case 'buy-supply': ok = sim.buySupply(id); if (ok) sfxBuy(); break;
    case 'buy-decor': ok = sim.buyDecor(id); if (ok) sfxBuy(); break;
    case 'buy-fish': ok = sim.buyFish(id); if (ok) sfxBuy(); break;
    case 'sell-fish': ok = sim.sellFish(Number(id)); if (ok) sfxGood(); break;
    case 'feed': ok = sim.feed(); break;
    case 'water': ok = sim.waterChange(0.25); break;
    case 'clean': ok = sim.cleanFilter(); break;
    case 'bacteria': ok = sim.addBacteria(); break;
    case 'test': ok = sim.useTest(); break;
    case 'medicine': ok = sim.useMedicine(); break;
    case 'light': ok = sim.toggleLight(); break;
    case 'heater': ok = sim.toggleHeater(); break;
    case 'speed': setSpeed(Number(id)); return;
    case 'pause': togglePause(); return;
    case 'save-now':
      save();
      toast('Đã lưu.', 'good');
      return;
    case 'reset-save':
      if (!resetArmed) {
        resetArmed = true;
        toast('Bấm lần nữa để xoá toàn bộ tiến trình.', 'warn');
        dirty = true;
        renderUI(true);
        return;
      }
      clearSave();
      resetState();
      resetQuestsCursor();
      state.ui.tab = 'tank';
      save();
      window.location.reload();
      return;
    case 'sound': {
      const next = !isAudioOn();
      setAudio(next);
      updateSoundBtn(next);
      if (next) sfxClick();
      return;
    }
    case 'help':
      openDialog({
        speaker: 'Kỹ thuật viên',
        text: 'Bắt đầu bằng bể, lọc, sưởi. Rắc thức ăn vào bể trống để tạo amoniac, thêm vi sinh và chờ chu trình nitơ chạy xong. Khi NH3 và NO2 gần 0 trong 2 ngày game, hãy thay nước rồi thả cá. Đừng cho ăn quá nhiều!',
        options: [{ label: 'Đã hiểu', onPick: () => {} }],
      });
      return;
    default:
      return;
  }
  if (ok) {
    sfxClick();
    save();
    checkQuests();
    checkAchievements();
  } else {
    sfxBad();
  }
  dirty = true;
  renderUI(true);
}

function renderPanel(force = false) {
  renderUI(force);
}

export function toast(text, kind = 'info') {
  if (!toastsEl) return;
  const div = document.createElement('div');
  div.className = `toast toast-${kind}`;
  div.textContent = text;
  toastsEl.appendChild(div);
  while (toastsEl.children.length > 4) toastsEl.firstChild.remove();
  setTimeout(() => {
    div.classList.add('is-out');
    setTimeout(() => div.remove(), 300);
  }, 3200);
}

// ---------- Sự kiện ----------
export function openEvent(id) {
  const ev = EVENTS[id];
  if (!ev) return;
  const options = ev.options.map((opt) => ({
    label: opt.label,
    onPick: () => {
      if (opt.cost) {
        if (state.money < opt.cost) {
          toast('Không đủ tiền cho lựa chọn này.', 'bad');
          return;
        }
        state.money -= opt.cost;
      }
      applyEventEffect(opt.effect);
      checkAchievements();
      dirty = true;
      save();
      renderUI(true);
    },
  }));
  openDialog({ speaker: ev.title, text: ev.text, options });
}

function applyEventEffect(effect) {
  switch (effect) {
    case 'power_buy':
      toast('Máy phát giữ ấm và lọc hoạt động. Bể an toàn.', 'good');
      break;
    case 'power_wait':
      state.water.temp = Math.max(16, state.water.temp - 3);
      for (const f of state.fish) f.stress = Math.min(100, f.stress + 15);
      toast('Nhiệt độ giảm 3°C, cá bị stress.', 'warn');
      break;
    case 'sick_cure':
      for (const f of state.fish) {
        if (f.sick || f.stress > 60) {
          f.sick = false;
          f.stress = Math.min(f.stress, 40);
        }
      }
      toast('Đã dùng thuốc, cá hồi phục.', 'good');
      break;
    case 'sick_wait': {
      const sick = state.fish[0];
      if (sick) sick.stress = Math.min(100, sick.stress + 25);
      toast('Cá yếu hơn, stress tăng.', 'warn');
      break;
    }
    case 'buyer_sell': {
      if (!state.fish.length) break;
      let idx = 0;
      for (let i = 1; i < state.fish.length; i++) {
        if (state.fish[i].stress < state.fish[idx].stress) idx = i;
      }
      const f = state.fish[idx];
      const sp = FISH_BY_ID[f.species];
      state.money += Math.round(sp.price * 1.5);
      state.fish.splice(idx, 1);
      toast(`Đã bán ${sp.name} với giá cao.`, 'good');
      break;
    }
    case 'buyer_keep':
      state.rep = Math.min(100, state.rep + 4);
      toast('Giữ cá, uy tín +4.', 'good');
      break;
    case 'algae_oto': {
      const sp = FISH_BY_ID.oto;
      if (sim.fishLoad() + sp.minLiters <= sim.capacity()) {
        state.fish.push({ species: 'oto', stress: 8, sick: false, x: 120, y: 90, vx: 0.3, vy: 0, phase: Math.random() * 6 });
        state.stats.fishBought += 1;
        toast('Đã thêm Otocinclus dọn tảo.', 'good');
      } else {
        state.algae = Math.max(0.02, state.algae - 0.35);
        toast('Bể đã đầy, bạn vệ sinh tay và giảm tảo.', 'info');
      }
      break;
    }
    case 'algae_reduce':
      state.lightOn = false;
      sim.waterChange(0.3);
      toast('Đã tắt đèn và thay nước, tảo sẽ giảm dần.', 'good');
      break;
    default:
      break;
  }
  state.lastEventDay = state.day;
}

export function showIntro() {
  openDialog({
    speaker: 'Chủ tiệm Bể Xanh',
    text: 'Chào bạn! Bể mới cần một chu trình nitơ trước khi thả cá. Mua bể, lắp lọc và sưởi, thêm vi sinh rồi rắc một nhúm thức ăn để tạo amoniac. Chờ vi sinh xử lý xong là có thể đón cá về.',
    options: [{ label: 'Bắt đầu setup', onPick: () => {} }],
  });
}

export function showOfflineReport(report) {
  if (!report || !report.hours) return;
  const days = report.days ? `${report.days} ngày` : `${Math.round(report.hours)} giờ`;
  const lines = [
    `Bạn đã vắng ${days} trong game.`,
    `Thu nhập: +${money(Math.max(0, report.money))}.`,
    report.deaths > 0
      ? `Có ${report.deaths} con cá chết vì môi trường chưa ổn định.`
      : 'Không có cá nào chết.',
    `Cá hiện tại: ${state.fish.length}.`,
  ].join(' ');
  openDialog({
    speaker: 'Báo cáo bể',
    text: lines,
    options: [{ label: 'Kiểm tra bể', onPick: () => { state.ui.tab = 'tank'; renderUI(true); } }],
  });
}

export function refreshUI() {
  dirty = true;
  renderUI(true);
}
