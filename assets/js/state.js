import { CONFIG } from './config.js';

// Trạng thái game. Chỉ chứa dữ liệu thuần để serialize được.
export const state = {
  money: CONFIG.startMoney,
  level: 1,
  xp: 0,
  rep: 50,
  day: 1,
  hour: 8,
  speed: 1,
  paused: false,
  tank: { id: null, liters: 0 },
  equipment: { filter: null, heater: null, light: false, substrate: false },
  heaterOn: true,
  lightOn: false,
  water: { nh3: 0, no2: 0, no3: 5, o2: 7.5, temp: 24, ph: 7.0, clarity: 100 },
  bacteria: 0.02,
  cycleStreak: 0,
  cycled: false,
  foodWaste: 0,
  filterGunk: 0,
  algae: 0.03,
  inv: { food: CONFIG.startFood, bacteria: CONFIG.startBacteria, tests: CONFIG.startTests, medicine: 0 },
  fish: [],
  decor: [],
  flags: { addedBacteria: 0, fedEmpty: 0, tested: 0, waterChanges: 0, fedToday: 0, lastFeedDay: 0 },
  stats: { fishBought: 0, deaths: 0, daysWithoutDeath: 0, bred: 0, hours: 0 },
  quests: {},
  achievements: {},
  lastEventDay: 0,
  savedAt: 0,
  ui: { tab: 'tank' },
};

// --- Event bus nội bộ: onEvent(type, fn) ---
const listeners = [];

export function onEvent(type, fn) {
  const entry = { type, fn };
  listeners.push(entry);
  return () => {
    const i = listeners.indexOf(entry);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function emit(type, payload) {
  for (const entry of listeners) {
    if (entry.type !== type) continue;
    try {
      entry.fn(payload);
    } catch (err) {
      // Không để listener lỗi làm hỏng vòng game
      console.error('event listener error', err);
    }
  }
}

export function resetState() {
  const fresh = {
    money: CONFIG.startMoney,
    level: 1,
    xp: 0,
    rep: 50,
    day: 1,
    hour: 8,
    speed: 1,
    paused: false,
    tank: { id: null, liters: 0 },
    equipment: { filter: null, heater: null, light: false, substrate: false },
    heaterOn: true,
  lightOn: false,
    water: { nh3: 0, no2: 0, no3: 5, o2: 7.5, temp: 24, ph: 7.0, clarity: 100 },
    bacteria: 0.02,
    cycleStreak: 0,
    cycled: false,
    foodWaste: 0,
    filterGunk: 0,
    algae: 0.03,
    inv: { food: CONFIG.startFood, bacteria: 0, tests: CONFIG.startTests, medicine: 0 },
    fish: [],
    decor: [],
    flags: { addedBacteria: 0, fedEmpty: 0, tested: 0, waterChanges: 0, fedToday: 0, lastFeedDay: 0 },
    stats: { fishBought: 0, deaths: 0, daysWithoutDeath: 0, bred: 0, hours: 0 },
    quests: {},
    achievements: {},
    lastEventDay: 0,
    savedAt: 0,
    ui: state.ui,
  };
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
}
