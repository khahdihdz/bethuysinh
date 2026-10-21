import { state, emit } from './state.js';
import {
  TANK_BY_ID, FILTER_BY_ID, HEATER_BY_ID, SUPPLIES, DECOR, FISH_BY_ID, FISH,
  xpNeed, EVENTS,
} from './config.js';

const MAX_LEVEL = 20;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function toast(text, kind = 'info') {
  emit('toast', { text, kind });
}

function fail(text) {
  toast(text, 'bad');
  return false;
}

export function addXp(amount) {
  state.xp += amount;
  while (state.level < MAX_LEVEL && state.xp >= xpNeed(state.level)) {
    state.xp -= xpNeed(state.level);
    state.level += 1;
    state.money += 50000;
    toast(`Lên cấp ${state.level}! Thưởng 50.000đ.`, 'good');
    emit('levelup', state.level);
  }
  if (state.level >= MAX_LEVEL) state.xp = Math.min(state.xp, xpNeed(MAX_LEVEL) - 1);
}

export function filterEff() {
  if (!state.equipment.filter) return 0;
  const f = FILTER_BY_ID[state.equipment.filter];
  if (!f) return 0;
  return f.eff * (1 - Math.min(0.4, state.filterGunk));
}

export function fishLoad() {
  return state.fish.reduce((sum, f) => sum + (FISH_BY_ID[f.species]?.minLiters || 0), 0);
}

export function capacity() {
  return state.tank.liters * 0.8;
}

export function beauty() {
  let b = state.decor.reduce((sum, d) => sum + (d.beauty || 0), 0);
  if (state.equipment.light) b += 4;
  if (state.equipment.substrate) b += 3;
  return b;
}

export function heaterPowered() {
  const h = HEATER_BY_ID[state.equipment.heater];
  return !!(h && state.heaterOn && state.tank.id);
}

// ---------- Mua sắm ----------
export function buyTank(id) {
  const t = TANK_BY_ID[id];
  if (!t) return fail('Bể không tồn tại.');
  if (state.level < t.level) return fail(`Cần cấp ${t.level} để mua ${t.name}.`);
  if (state.money < t.price) return fail('Không đủ tiền.');
  if (fishLoad() > t.liters * 0.8) return fail('Cá hiện tại không vừa bể nhỏ hơn. Hãy bán bớt cá.');
  const moved = !!state.tank.id;
  state.money -= t.price;
  state.tank = { id: t.id, liters: t.liters };
  if (!moved) {
    state.water = { nh3: 0, no2: 0, no3: 5, o2: 7.5, temp: 24, ph: 7.0, clarity: 100 };
    state.fish = [];
    state.decor = [];
  }
  addXp(15);
  toast(`Đã mua ${t.name}.`, 'good');
  emit('action', { act: 'buy' });
  return true;
}

export function buyFilter(id) {
  const f = FILTER_BY_ID[id];
  if (!f) return fail('Lọc không tồn tại.');
  if (!state.tank.id) return fail('Cần mua bể trước.');
  if (state.level < f.level) return fail(`Cần cấp ${f.level}.`);
  if (state.money < f.price) return fail('Không đủ tiền.');
  state.money -= f.price;
  state.equipment.filter = f.id;
  state.filterGunk = 0;
  addXp(15);
  toast(`Đã lắp ${f.name}.`, 'good');
  return true;
}

export function buyHeater(id) {
  const h = HEATER_BY_ID[id];
  if (!h) return fail('Sưởi không tồn tại.');
  if (!state.tank.id) return fail('Cần mua bể trước.');
  if (state.level < h.level) return fail(`Cần cấp ${h.level}.`);
  if (state.money < h.price) return fail('Không đủ tiền.');
  state.money -= h.price;
  state.equipment.heater = h.id;
  state.heaterOn = true;
  if (state.tank.liters > h.maxLiters) {
    toast(`${h.name} hơi yếu cho bể ${state.tank.liters}L, nhiệt sẽ khó ổn định.`, 'warn');
  } else {
    toast(`Đã lắp ${h.name}.`, 'good');
  }
  addXp(15);
  return true;
}

export function buySupply(id) {
  const s = SUPPLIES.find((x) => x.id === id);
  if (!s) return fail('Vật tư không tồn tại.');
  if (state.money < s.price) return fail('Không đủ tiền.');
  state.money -= s.price;
  state.inv[s.key] = (state.inv[s.key] || 0) + s.qty;
  toast(`Đã mua ${s.name}.`, 'good');
  addXp(5);
  return true;
}

export function buyDecor(id) {
  const d = DECOR.find((x) => x.id === id);
  if (!d) return fail('Món đồ không tồn tại.');
  if (!state.tank.id) return fail('Cần mua bể trước.');
  if (state.money < d.price) return fail('Không đủ tiền.');
  state.money -= d.price;
  if (d.type === 'light') {
    state.equipment.light = true;
    state.lightOn = true;
    toast('Đã lắp đèn LED. Bật/tắt trong tab Bể.', 'good');
  } else if (d.type === 'substrate') {
    state.equipment.substrate = true;
    toast('Đã thêm nền dinh dưỡng.', 'good');
  } else {
    state.decor.push({
      type: d.type,
      beauty: d.beauty,
      seed: Math.floor(Math.random() * 9999) + 1,
      x: 0.18 + Math.random() * 0.55,
    });
    toast(`Đã thêm ${d.name} vào bể.`, 'good');
  }
  addXp(8);
  return true;
}

export function buyFish(speciesId) {
  const sp = FISH_BY_ID[speciesId];
  if (!sp) return fail('Loài không tồn tại.');
  if (!state.tank.id) return fail('Cần mua bể trước.');
  if (state.level < sp.level) return fail(`Cần cấp ${sp.level} để mua ${sp.name}.`);
  if (state.money < sp.price) return fail('Không đủ tiền.');
  if (fishLoad() + sp.minLiters > capacity()) {
    return fail('Bể đã đầy theo quy tắc tải. Hãy nâng bể hoặc bán bớt cá.');
  }
  if (!state.cycled) {
    toast('Bể chưa cycle xong! Cá có thể bị ngộ độc NH3/NO2.', 'warn');
  }
  state.money -= sp.price;
  state.fish.push({
    species: sp.id,
    stress: state.cycled ? 8 : 35,
    sick: false,
    x: 70 + Math.random() * 110,
    y: sp.bottom ? 118 + Math.random() * 10 : 52 + Math.random() * 60,
    vx: Math.random() < 0.5 ? -0.35 : 0.35,
    vy: 0,
    phase: Math.random() * 6.28,
  });
  state.stats.fishBought += 1;
  addXp(18);
  toast(`Đã thả ${sp.name}.`, 'good');
  emit('action', { act: 'stock' });
  return true;
}

export function sellFish(index) {
  const f = state.fish[index];
  if (!f) return false;
  const sp = FISH_BY_ID[f.species];
  const price = Math.round(sp.price * 0.6);
  state.fish.splice(index, 1);
  state.money += price;
  addXp(5);
  toast(`Đã bán ${sp.name} được ${price.toLocaleString('de-DE')}đ.`, 'info');
  return true;
}

// ---------- Hành động ----------
export function feed() {
  if (!state.tank.id) return fail('Cần mua bể trước.');
  if (state.inv.food <= 0) return fail('Hết thức ăn. Mua thêm ở Cửa hàng → Vật tư.');
  state.inv.food -= 1;
  state.foodWaste += 0.6;
  if (state.flags.lastFeedDay !== state.day) {
    state.flags.fedToday = 0;
    state.flags.lastFeedDay = state.day;
  }
  state.flags.fedToday += 1;
  if (state.fish.length === 0) {
    state.flags.fedEmpty += 1;
    toast('Bạn rắc thức ăn vào bể trống. Nó sẽ phân hủy thành amoniac (NH3) — cách khởi động cycle.', 'info');
  } else {
    if (state.flags.fedToday > 3) {
      state.foodWaste += 0.8;
      toast('Cho ăn quá nhiều! Thức ăn thừa sẽ làm NH3 tăng nhanh.', 'warn');
    } else {
      toast('Cá đã được cho ăn.', 'good');
    }
    addXp(2);
  }
  return true;
}

export function waterChange(pct = 0.25) {
  if (!state.tank.id) return fail('Cần mua bể trước.');
  const k = 1 - pct;
  state.water.nh3 *= k;
  state.water.no2 *= k;
  state.water.no3 *= k;
  state.water.clarity = clamp(state.water.clarity + 12, 0, 100);
  state.water.temp = Math.max(18, state.water.temp - 1);
  state.foodWaste = Math.max(0, state.foodWaste - 0.5);
  state.flags.waterChanges += 1;
  addXp(4);
  toast(`Đã thay ${Math.round(pct * 100)}% nước. Các chỉ số độc giảm.`, 'good');
  emit('action', { act: 'water' });
  return true;
}

export function cleanFilter() {
  if (!state.tank.id) return fail('Cần mua bể trước.');
  if (!state.equipment.filter) return fail('Chưa có bộ lọc.');
  state.filterGunk = 0;
  addXp(4);
  toast('Đã vệ sinh lọc. Hiệu suất xử lý nitơ trở lại bình thường.', 'good');
  return true;
}

export function addBacteria() {
  if (!state.tank.id) return fail('Cần mua bể trước.');
  if (state.inv.bacteria <= 0) return fail('Không có vi sinh. Mua ở Cửa hàng → Vật tư.');
  state.inv.bacteria -= 1;
  state.bacteria = clamp(state.bacteria + 0.18, 0, 1);
  state.flags.addedBacteria += 1;
  addXp(6);
  toast('Đã thêm vi sinh. Chu trình nitơ sẽ nhanh hơn.', 'good');
  return true;
}

export function useTest() {
  if (!state.tank.id) return fail('Cần mua bể trước.');
  if (state.inv.tests <= 0) return fail('Hết test kit.');
  state.inv.tests -= 1;
  state.flags.tested += 1;
  addXp(5);
  const w = state.water;
  let verdict = 'Nước ổn.';
  if (w.nh3 > 0.25) verdict = 'NH3 cao! Thay nước và ngừng cho ăn.';
  else if (w.no2 > 0.2) verdict = 'NO2 cao! Cycle chưa xong.';
  else if (w.no3 > 40) verdict = 'NO3 cao, nên thay nước.';
  const text = `NH3 ${w.nh3.toFixed(2)} · NO2 ${w.no2.toFixed(2)} · NO3 ${Math.round(w.no3)} · pH ${w.ph.toFixed(1)} · ${w.temp.toFixed(0)}°C. ${verdict}`;
  toast(text, w.nh3 > 0.25 || w.no2 > 0.2 ? 'warn' : 'info');
  emit('tested', { verdict });
  return true;
}

export function useMedicine() {
  if (state.inv.medicine <= 0) return fail('Không có thuốc.');
  state.inv.medicine -= 1;
  let cured = 0;
  for (const f of state.fish) {
    if (f.sick || f.stress > 60) {
      f.sick = false;
      f.stress = Math.min(f.stress, 40);
      cured += 1;
    }
  }
  addXp(5);
  toast(cured ? `Đã chữa cho ${cured} con cá.` : 'Không có cá bệnh, thuốc để dành.', 'info');
  return true;
}

export function toggleLight() {
  if (!state.equipment.light) return fail('Chưa có đèn. Mua ở Cửa hàng → Thiết bị.');
  state.lightOn = !state.lightOn;
  toast(state.lightOn ? 'Đã bật đèn.' : 'Đã tắt đèn.', 'info');
  return true;
}

export function toggleHeater() {
  if (!state.equipment.heater) return fail('Chưa có máy sưởi.');
  state.heaterOn = !state.heaterOn;
  toast(state.heaterOn ? 'Đã bật sưởi.' : 'Đã tắt sưởi.', 'info');
  return true;
}

// ---------- Mô phỏng ----------
function advanceTime(dt) {
  state.stats.hours += dt;
  state.hour += dt;
  while (state.hour >= 24) {
    state.hour -= 24;
    state.day += 1;
    onNewDay();
  }
}

function onNewDay() {
  state.flags.fedToday = 0;
  state.stats.daysWithoutDeath += 1;
  const income = Math.round(state.rep * 600 + state.fish.length * 1200 + (state.cycled ? 15000 : 0));
  state.money += income;
  emit('income', income);

  // Sinh sản
  if (state.cycled && state.fish.length >= 2) {
    const healthy = state.fish.filter((f) => !f.sick && f.stress < 25).length;
    if (healthy >= 2 && fishLoad() + 4 <= capacity() && Math.random() < 0.06) {
      const parent = state.fish.find((f) => !f.sick && f.stress < 25);
      const sp = FISH_BY_ID[parent.species];
      state.fish.push({
        species: sp.id, stress: 5, sick: false,
        x: 90 + Math.random() * 70, y: 60 + Math.random() * 50,
        vx: Math.random() < 0.5 ? -0.3 : 0.3, vy: 0, phase: Math.random() * 6.28,
      });
      state.stats.bred += 1;
      addXp(10);
      toast(`Cá sinh sản! Bạn có thêm một ${sp.name}.`, 'good');
    }
  }

  // Sự kiện ngẫu nhiên
  if (
    state.day >= 5 &&
    state.day - state.lastEventDay >= 3 &&
    state.fish.length > 0 &&
    Math.random() < 0.35
  ) {
    state.lastEventDay = state.day;
    const keys = Object.keys(EVENTS);
    emit('event', keys[Math.floor(Math.random() * keys.length)]);
  }
}

function killFish(index, reason) {
  const f = state.fish[index];
  const sp = FISH_BY_ID[f.species];
  state.fish.splice(index, 1);
  state.stats.deaths += 1;
  state.stats.daysWithoutDeath = 0;
  state.rep = clamp(state.rep - 8, 0, 100);
  toast(`${sp.name} đã chết: ${reason}. Uy tín -8.`, 'bad');
}

function stepHour(dt, opts = {}) {
  if (!state.tank.id) {
    state.roomTemp = state.hour >= 18 || state.hour < 6 ? 23 : 25;
    advanceTime(dt);
    return;
  }
  state.roomTemp = state.hour >= 18 || state.hour < 6 ? 23 : 25;

  const vol = state.tank.liters;
  const eff = filterEff();
  const fishN = state.fish.length;
  const plants = state.decor.filter((d) => d.type === 'plant').length;
  const w = state.water;

  // Thức ăn thừa phân hủy
  state.foodWaste = Math.max(0, state.foodWaste * Math.pow(0.88, dt));

  // Amoniac từ cá + thức ăn
  let waste = 0;
  for (const f of state.fish) waste += FISH_BY_ID[f.species]?.waste || 0;
  const volFactor = Math.sqrt(Math.max(1, vol / 40));
  w.nh3 += (waste * 0.02) / volFactor * dt + state.foodWaste * 0.05 * dt;

  // Vi khuẩn nitrat hóa
  let cap1 = state.bacteria * (0.35 + eff) * 0.30;
  const p1 = Math.min(w.nh3, cap1 * dt);
  w.nh3 -= p1;
  w.no2 += p1 * 0.75;
  let cap2 = state.bacteria * (0.25 + eff) * 0.24;
  const p2 = Math.min(w.no2, cap2 * dt);
  w.no2 -= p2;
  w.no3 += p2 * 1.1;

  // Cây hấp thụ NO3
  w.no3 = Math.max(0, w.no3 - plants * 0.01 * dt);

  // Sinh khối vi sinh (cần lọc + nước)
  if (eff > 0) {
    const growth = 0.006 * (1 - state.bacteria) * (0.4 + eff);
    state.bacteria = Math.min(1, state.bacteria + growth * dt + (w.nh3 > 0.05 ? 0.0015 * dt : 0));
  } else {
    state.bacteria = Math.max(0.01, state.bacteria - 0.001 * dt);
  }

  // Oxy hòa tan
  const o2target = 7.4 + eff * 1.2 + plants * 0.25 - fishN * 0.18 - (w.temp - 25) * 0.12;
  w.o2 += (o2target - w.o2) * 0.15 * dt;
  w.o2 = clamp(w.o2, 0, 12);

  // Nhiệt độ
  let target = state.roomTemp + (state.lightOn ? 0.3 : 0);
  const heater = HEATER_BY_ID[state.equipment.heater];
  if (heater && state.heaterOn) {
    target = vol <= heater.maxLiters ? 25.0 : 24.5;
  }
  const tempSpeed = state.heaterOn && heater ? 0.22 : 0.07;
  w.temp += (target - w.temp) * tempSpeed * dt;
  w.temp = clamp(w.temp, 15, 34);

  // pH
  const phtarget = 7.0 - Math.max(0, w.no3 - 40) * 0.004 - (state.equipment.substrate ? 0.15 : 0);
  w.ph += (phtarget - w.ph) * 0.08 * dt;
  w.ph = clamp(w.ph, 5, 9);

  // Độ trong + tảo
  const clutter = state.foodWaste * 4 + (w.nh3 > 0.5 ? 15 : 0) + state.algae * 20;
  w.clarity += (100 - clutter - w.clarity) * 0.1 * dt;
  w.clarity = clamp(w.clarity, 0, 100);

  const algaeTarget = state.lightOn && w.no3 > 25
    ? Math.min(1, (w.no3 - 25) / 80)
    : 0.02;
  state.algae += (algaeTarget - state.algae) * 0.012 * dt;
  state.algae = clamp(state.algae, 0, 1);

  // Cặn lọc
  state.filterGunk = Math.min(0.5, state.filterGunk + 0.0012 * dt * (1 + state.foodWaste));

  // Chu trình nitơ hoàn tất
  if (state.bacteria >= 0.75 && w.nh3 < 0.15 && w.no2 < 0.15) {
    state.cycleStreak += dt;
    if (state.cycleStreak >= 48 && !state.cycled) {
      state.cycled = true;
      addXp(60);
      state.rep = clamp(state.rep + 5, 0, 100);
      toast('Chu trình nitơ hoàn tất! Bể đã sẵn sàng thả cá.', 'good');
      emit('cycled');
    }
  } else {
    state.cycleStreak = 0;
  }

  // Sức khỏe cá
  for (let i = state.fish.length - 1; i >= 0; i--) {
    const f = state.fish[i];
    const sp = FISH_BY_ID[f.species];
    if (!sp) continue;
    let bad = 0;
    const tempDev = Math.max(0, sp.temp[0] - w.temp, w.temp - sp.temp[1]);
    if (tempDev > 0) bad += Math.min(5, 0.8 + tempDev * 1.4);
    const phDev = Math.max(0, sp.ph[0] - w.ph, w.ph - sp.ph[1]);
    if (phDev > 0) bad += Math.min(4, 0.5 + phDev * 2);
    if (w.nh3 > 0.25) bad += 4 + (w.nh3 - 0.25) * 4;
    if (w.no2 > 0.2) bad += 3;
    if (w.o2 < 4) bad += 4 * (1 - w.o2 / 4) + 1;
    if (state.foodWaste > 3) bad += 1;
    if (sp.algaeEater && state.algae > 0.2) state.algae = Math.max(0.02, state.algae - 0.004 * dt);
    if (f.sick) bad += 0.5;

    f.stress = clamp(f.stress + (bad > 0 ? bad * dt : -2 * dt), 0, 100);
    if (f.stress > 70 && !f.sick && Math.random() < 0.02 * dt) {
      f.sick = true;
      toast(`${sp.name} có dấu hiệu bệnh. Kiểm tra nước hoặc dùng thuốc.`, 'warn');
    }
    if (f.stress >= 100) {
      let reason = 'sốc môi trường';
      if (w.nh3 > 0.25) reason = 'ngộ độc NH3';
      else if (w.no2 > 0.2) reason = 'ngộ độc NO2';
      else if (w.temp < sp.temp[0] || w.temp > sp.temp[1]) reason = 'nhiệt độ sai';
      else if (w.o2 < 4) reason = 'thiếu oxy';
      if (!opts.offline) killFish(i, reason);
      else {
        state.fish.splice(i, 1);
        state.stats.deaths += 1;
        state.stats.daysWithoutDeath = 0;
        state.rep = clamp(state.rep - 8, 0, 100);
      }
    }
  }

  // Uy tín
  const avgStress = state.fish.length
    ? state.fish.reduce((s, f) => s + f.stress, 0) / state.fish.length
    : 10;
  const repTarget = clamp(
    55 + (state.cycled ? 12 : 0) - avgStress * 0.25 + beauty() * 0.4
      - state.algae * 15 + (state.fish.length > 0 && avgStress < 30 ? 8 : 0),
    0, 100,
  );
  state.rep += (repTarget - state.rep) * 0.02 * dt;
  state.rep = clamp(state.rep, 0, 100);

  // Nitơ không âm
  w.nh3 = Math.max(0, w.nh3);
  w.no2 = Math.max(0, w.no2);

  advanceTime(dt);
}

export function simulate(hours, opts = {}) {
  let left = hours;
  let guard = 0;
  while (left > 0.0001 && guard < 5000) {
    const step = Math.min(1, left);
    stepHour(step, opts);
    left -= step;
    guard += 1;
  }
  if (opts.offline) {
    // Giới hạn thiệt hại khi vắng lâu: hồi phục stress nhẹ
    for (const f of state.fish) f.stress = Math.min(f.stress, 90);
  }
}

// Trạng thái tổng quát cho HUD
export function cycleProgress() {
  return Math.round(state.bacteria * 100);
}

export function waterVerdict() {
  const w = state.water;
  if (!state.tank.id) return { text: 'CHUA CO BE', kind: 'dim' };
  if (!state.cycled) {
    return {
      text: `CYCLE ${cycleProgress()}% ${state.cycleStreak >= 1 ? `· ON DINH ${Math.floor(state.cycleStreak)}/48H` : ''}`,
      kind: 'warn',
    };
  }
  if (w.nh3 > 0.25) return { text: 'NH3 CAO - THAY NUOC', kind: 'bad' };
  if (w.no2 > 0.2) return { text: 'NO2 CAO - CYCLE LOI', kind: 'bad' };
  if (w.no3 > 40) return { text: 'NO3 CAO - NEN THAY NUOC', kind: 'warn' };
  if (w.o2 < 4) return { text: 'THIEU OXY', kind: 'bad' };
  return { text: 'NUOC ON DINH', kind: 'good' };
}

export function statusColor(kind) {
  if (kind === 'bad') return '#e0553f';
  if (kind === 'warn') return '#ff8a3d';
  if (kind === 'good') return '#c7e06a';
  if (kind === 'dim') return '#4a4a5a';
  return '#a8e6d5';
}

export function allFishSpecies() {
  return FISH;
}
