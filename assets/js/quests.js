import { state, emit } from './state.js';
import { QUESTS, ACHIEVEMENTS } from './config.js';
import { addXp } from './sim.js';

let questsCursor = 0;

// Kiểm tra nhiệm vụ theo thứ tự. Trả về id vừa hoàn thành (nếu có).
export function checkQuests() {
  if (questsCursor >= QUESTS.length) return null;
  const q = QUESTS[questsCursor];
  let ok = false;
  try {
    ok = !!q.check(state);
  } catch (err) {
    console.error('quest check failed', q.id, err);
  }
  if (!ok) return null;
  state.quests[q.id] = true;
  state.money += q.money;
  addXp(q.xp);
  questsCursor += 1;
  emit('toast', { text: `Hoàn thành: ${q.title} (+${q.money.toLocaleString('de-DE')}đ)`, kind: 'good' });
  emit('quest', q.id);
  return q.id;
}

export function questProgress() {
  return { done: questsCursor, total: QUESTS.length };
}

export function resetQuestsCursor() {
  questsCursor = 0;
}

// Đồng bộ con trỏ nhiệm vụ sau khi load save.
export function syncQuests() {
  let i = 0;
  while (i < QUESTS.length && state.quests[QUESTS[i].id]) i += 1;
  questsCursor = i;
}

export function currentQuest() {
  return QUESTS[questsCursor] || null;
}

export function checkAchievements() {
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    let ok = false;
    try {
      ok = !!a.check(state);
    } catch (err) {
      console.error('achievement check failed', a.id, err);
    }
    if (ok) {
      state.achievements[a.id] = true;
      state.money += 30000;
      addXp(15);
      unlocked.push(a);
      emit('toast', { text: `Thành tựu: ${a.name} (+30.000đ)`, kind: 'good' });
    }
  }
  return unlocked;
}

export function achievementCount() {
  return ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;
}
