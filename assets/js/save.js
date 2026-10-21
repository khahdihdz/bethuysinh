import { state } from './state.js';
import { CONFIG } from './config.js';
import { simulate } from './sim.js';
import { syncQuests } from './quests.js';

const KEY = CONFIG.saveKey;

function mergeDeep(target, src) {
  for (const key of Object.keys(src)) {
    const val = src[key];
    if (
      val && typeof val === 'object' && !Array.isArray(val) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      mergeDeep(target[key], val);
    } else {
      target[key] = val;
    }
  }
}

export function save() {
  try {
    state.savedAt = Date.now();
    const data = { ...state };
    delete data.ui;
    localStorage.setItem(KEY, JSON.stringify({ v: CONFIG.saveVersion, data }));
    return true;
  } catch (err) {
    console.error('save failed', err);
    return false;
  }
}

export function hasSave() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function load() {
  let parsed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('save corrupted', err);
    return null;
  }
  if (!parsed || !parsed.data) return null;
  const data = parsed.data;
  mergeDeep(state, data);
  // Đảm bảo cấu trúc tối thiểu sau khi migrate
  if (!state.inv) state.inv = { food: 0, bacteria: 0, tests: 0, medicine: 0 };
  if (!state.flags) state.flags = { addedBacteria: 0, fedEmpty: 0, tested: 0, waterChanges: 0, fedToday: 0, lastFeedDay: 0 };
  if (!state.stats) state.stats = { fishBought: 0, deaths: 0, daysWithoutDeath: 0, bred: 0, hours: 0 };
  if (!Array.isArray(state.fish)) state.fish = [];
  if (!Array.isArray(state.decor)) state.decor = [];
  state.fish = state.fish.filter((f) => f && f.species);
  state.ui = { tab: 'tank' };
  state.paused = false;
  syncQuests();

  const savedAt = Number(parsed.data.savedAt) || 0;
  const elapsedSec = Math.max(0, (Date.now() - savedAt) / 1000);
  const hours = Math.min(CONFIG.offlineCapHours, elapsedSec);
  if (!state.tank.id || hours < 60) return { hours: 0, deaths: 0 };

  const before = {
    money: state.money,
    day: state.day,
    fish: state.fish.length,
    deaths: state.stats.deaths,
  };
  simulate(hours, { offline: true });
  return {
    hours,
    days: Math.floor(hours / 24),
    money: Math.round(state.money - before.money),
    fishBefore: before.fish,
    fishAfter: state.fish.length,
    deaths: state.stats.deaths - before.deaths,
  };
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch (err) {
    console.error('clear save failed', err);
  }
}
