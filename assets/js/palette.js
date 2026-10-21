// Bảng màu 16-bit: 64 màu, chia bộ 16 màu theo nhóm (mô phỏng giới hạn SNES)
export const P = {
  // Nền / phòng
  black: '#080c10',
  night1: '#0b1a24',
  night2: '#10293a',
  room1: '#1b1b24',
  room2: '#2a2a36',
  room3: '#4a4a5a',
  ink: '#0b0f14',

  // Nước (bộ 16)
  water1: '#0d2433',
  water2: '#12384a',
  water3: '#16405a',
  water4: '#1e5f6e',
  water5: '#2f8f8f',
  water6: '#57c2b4',
  water7: '#a8e6d5',
  foam: '#d9f7ef',

  // Cát / đá / gỗ
  sand1: '#e3cf8f',
  sand2: '#d9c27e',
  sand3: '#b08d57',
  sand4: '#7a5c3e',
  rock1: '#8a8a96',
  rock2: '#5f5f6e',
  rock3: '#3a3a46',
  wood1: '#6b4a2f',
  wood2: '#3f2d22',

  // Cây
  leaf1: '#2f5a26',
  leaf2: '#3b6b2f',
  leaf3: '#5f9e3a',
  leaf4: '#78b23c',
  leaf5: '#c7e06a',

  // Cá / sinh vật
  red1: '#8a2f3f',
  red2: '#e0553f',
  orange: '#ff8a3d',
  yellow: '#ffd35c',
  pink: '#e07a9a',
  purple: '#6b2f6b',
  blue1: '#2a5fa8',
  blue2: '#4a8fe0',
  cyan: '#7fd6cf',
  white: '#e8f4f0',
  pure: '#ffffff',
  grey1: '#4a4a5a',
  grey2: '#2a2a36',
  grey3: '#1b1b24',
  green: '#78b23c',
};

// Dải màu nước từ đậm tới nhạt (dùng cho band + dither)
export const WATER_BANDS = [P.water1, P.water2, P.water3, P.water4, P.water5];

// Bộ màu UI
export const UI = {
  bg: P.ink,
  panel: '#101820',
  border: P.grey1,
  text: P.white,
  dim: '#9fb3ad',
  accent: P.water6,
  warn: P.orange,
  bad: P.red2,
  good: P.leaf5,
};
