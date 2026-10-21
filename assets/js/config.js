// Toàn bộ hằng số cân bằng của game nằm ở đây.
import { P } from './palette.js';

export const CONFIG = {
  tickRealMs: 1000, // 1 giây thực = 1 giờ trong game (tốc độ x1)
  startMoney: 2500000,
  startFood: 6,
  startTests: 2,
  startBacteria: 0,
  offlineCapHours: 24 * 12, // tối đa 12 ngày game khi quay lại
  saveKey: 'bexanh16_save_v1',
  saveVersion: 1,
  eventMinDay: 5,
  eventCooldownDays: 3,
};

export const TANKS = [
  { id: 't20', name: 'Bể 20L', liters: 20, price: 350000, level: 1, desc: 'Bể nano, hợp betta hoặc tép.' },
  { id: 't40', name: 'Bể 40L', liters: 40, price: 650000, level: 1, desc: 'Bể cộng đồng nhỏ, dễ chăm.' },
  { id: 't80', name: 'Bể 80L', liters: 80, price: 1200000, level: 3, desc: 'Đủ chỗ cho cá vàng, nhiều cây.' },
  { id: 't150', name: 'Bể 150L', liters: 150, price: 2400000, level: 6, desc: 'Bể lớn, mở khóa hệ sinh thái đầy đủ.' },
];

export const FILTERS = [
  { id: 'f_sponge', name: 'Lọc sponge', price: 180000, eff: 0.6, level: 1, desc: 'Rẻ, an toàn cho cá nhỏ và tép.' },
  { id: 'f_hob', name: 'Lọc HOB', price: 320000, eff: 1.0, level: 2, desc: 'Treo thành bể, xử lý nitơ tốt.' },
  { id: 'f_canister', name: 'Lọc canister', price: 850000, eff: 1.6, level: 5, desc: 'Công suất cao cho bể lớn.' },
];

export const HEATERS = [
  { id: 'h50', name: 'Sưởi 50W', price: 260000, watts: 50, maxLiters: 60, level: 1, desc: 'Cho bể tới 60L.' },
  { id: 'h100', name: 'Sưởi 100W', price: 420000, watts: 100, maxLiters: 120, level: 3, desc: 'Cho bể tới 120L.' },
  { id: 'h200', name: 'Sưởi 200W', price: 650000, watts: 200, maxLiters: 250, level: 5, desc: 'Cho bể lớn tới 250L.' },
];

export const SUPPLIES = [
  { id: 'food', name: 'Thức ăn (10 lần)', price: 40000, qty: 10, key: 'food', desc: 'Cho ăn ít, tránh dư thừa.' },
  { id: 'bacteria', name: 'Vi sinh (1 liều)', price: 120000, qty: 1, key: 'bacteria', desc: 'Tăng nhanh khuẩn xử lý nitơ.' },
  { id: 'test', name: 'Test kit (5 lần)', price: 150000, qty: 5, key: 'tests', desc: 'Kiểm tra NH3/NO2/NO3, pH.' },
  { id: 'medicine', name: 'Thuốc trị bệnh', price: 180000, qty: 1, key: 'medicine', desc: 'Chữa cá đang bị bệnh.' },
];

export const DECOR = [
  { id: 'plant', name: 'Cây thủy sinh', price: 90000, type: 'plant', beauty: 6, desc: 'Tăng O2, giảm NO3, đẹp bể.' },
  { id: 'rock', name: 'Đá trang trí', price: 80000, type: 'rock', beauty: 5, desc: 'Tạo chỗ trú cho cá.' },
  { id: 'wood', name: 'Lũa', price: 110000, type: 'wood', beauty: 7, desc: 'Điểm nhấn tự nhiên.' },
  { id: 'substrate', name: 'Nền dinh dưỡng', price: 120000, type: 'substrate', beauty: 3, desc: 'Giúp cây khỏe, giảm pH nhẹ.' },
  { id: 'light', name: 'Đèn LED', price: 250000, type: 'light', beauty: 4, desc: 'Cần cho cây, dễ gây tảo nếu bật lâu.' },
];

// Loài cá: màu sprite + thông số môi trường
export const FISH = [
  {
    id: 'neon', name: 'Neon tetra', price: 25000, minLiters: 3, temp: [22, 26], ph: [6.0, 7.2],
    waste: 0.6, level: 1, rep: 1, len: 12, h: 6,
    colors: { top: '#1e5f6e', body: '#4a8fe0', belly: '#e8f4f0', fin: '#a8e6d5', tail: '#e07a9a' },
    stripe: '#e0553f', desc: 'Cá bầy đàn, cần đi theo nhóm từ 4 con.',
  },
  {
    id: 'guppy', name: 'Guppy', price: 30000, minLiters: 4, temp: [22, 28], ph: [6.8, 7.8],
    waste: 0.7, level: 1, rep: 1, len: 11, h: 6,
    colors: { top: '#a8452f', body: '#ff8a3d', belly: '#ffe3b0', fin: '#ffd35c', tail: '#e0553f' },
    desc: 'Dễ nuôi, sinh sản nhanh, hợp người mới.',
  },
  {
    id: 'betta', name: 'Betta', price: 90000, minLiters: 10, temp: [24, 28], ph: [6.5, 7.5],
    waste: 0.9, level: 2, rep: 2, len: 14, h: 9,
    colors: { top: '#4b1f6b', body: '#6b2f6b', belly: '#e07a9a', fin: '#e0553f', tail: '#e07a9a' },
    desc: 'Nuôi riêng hoặc bể có chỗ trốn, không hợp cá hay rỉa vây.',
  },
  {
    id: 'molly', name: 'Moly', price: 35000, minLiters: 6, temp: [22, 28], ph: [7.0, 8.0],
    waste: 1.0, level: 1, rep: 1, len: 13, h: 7,
    colors: { top: '#20202a', body: '#4a4a5a', belly: '#c9d6d3', fin: '#8a8a96', tail: '#5f5f6e' },
    desc: 'Ăn tảo tốt, cần nước hơi kiềm.',
  },
  {
    id: 'cory', name: 'Corydoras', price: 45000, minLiters: 5, temp: [22, 26], ph: [6.5, 7.5],
    waste: 0.8, level: 2, rep: 2, len: 12, h: 6, bottom: true,
    colors: { top: '#3f3f2a', body: '#8a8a5a', belly: '#e8e3c0', fin: '#c7b07a', tail: '#6b6b4a' },
    desc: 'Cá đáy, dọn thức ăn thừa, thích cát mịn.',
  },
  {
    id: 'oto', name: 'Otocinclus', price: 60000, minLiters: 5, temp: [22, 27], ph: [6.5, 7.5],
    waste: 0.5, level: 3, rep: 2, len: 11, h: 5, algaeEater: true,
    colors: { top: '#2a2a36', body: '#6b6b4a', belly: '#e8e3c0', fin: '#c7b07a', tail: '#4a4a3a' },
    desc: 'Ăn tảo, giữ kính bể sạch.',
  },
  {
    id: 'gold', name: 'Cá vàng', price: 120000, minLiters: 35, temp: [16, 26], ph: [7.0, 8.0],
    waste: 2.4, level: 4, rep: 3, len: 21, h: 11,
    colors: { top: '#c74a1e', body: '#ff8a3d', belly: '#ffd35c', fin: '#ffb060', tail: '#e0553f' },
    desc: 'Cần bể từ 80L, tạo rất nhiều chất thải.',
  },
  {
    id: 'shrimp', name: 'Tép cherry', price: 20000, minLiters: 1.5, temp: [20, 26], ph: [6.5, 7.5],
    waste: 0.2, level: 2, rep: 1, len: 8, h: 5, shrimp: true,
    colors: { body: '#e0553f', belly: '#ffd35c' },
    desc: 'Nhỏ, ăn tảo, nhạy cảm với NO2 và thuốc.',
  },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));
export const TANK_BY_ID = Object.fromEntries(TANKS.map((t) => [t.id, t]));
export const FILTER_BY_ID = Object.fromEntries(FILTERS.map((f) => [f.id, f]));
export const HEATER_BY_ID = Object.fromEntries(HEATERS.map((h) => [h.id, h]));

export function xpNeed(level) {
  return 100 + level * 50;
}

export function fmtMoney(n) {
  const v = Math.round(n);
  return v.toLocaleString('de-DE');
}

// Nhiệm vụ hướng dẫn (tuần tự)
export const QUESTS = [
  { id: 'q_tank', title: 'Mua bể đầu tiên', hint: 'Vào Cửa hàng → Thiết bị và chọn một bể.', money: 100000, xp: 20,
    check: (s) => !!s.tank.id },
  { id: 'q_filter', title: 'Lắp bộ lọc', hint: 'Lọc là bộ phận quan trọng nhất của bể.', money: 80000, xp: 20,
    check: (s) => !!s.equipment.filter },
  { id: 'q_heater', title: 'Lắp máy sưởi', hint: 'Giữ nhiệt độ ổn định cho cá.', money: 60000, xp: 20,
    check: (s) => !!s.equipment.heater },
  { id: 'q_bacteria', title: 'Thêm vi sinh', hint: 'Mua Vi sinh ở Cửa hàng → Vật tư rồi dùng trong tab Bể.', money: 50000, xp: 20,
    check: (s) => s.flags.addedBacteria > 0 },
  { id: 'q_feed_empty', title: 'Rắc thức ăn tạo amoniac', hint: 'Bể trống chưa có cá: cho ăn một nhúm để bắt đầu chu trình nitơ.', money: 50000, xp: 25,
    check: (s) => s.flags.fedEmpty > 0 },
  { id: 'q_test', title: 'Test nước lần đầu', hint: 'Test kit cho bạn biết NH3/NO2/NO3 và pH.', money: 40000, xp: 25,
    check: (s) => s.flags.tested > 0 },
  { id: 'q_cycle', title: 'Chờ chu trình nitơ hoàn tất', hint: 'Giữ NH3 và NO2 gần 0 trong 2 ngày game. Có thể tăng tốc x4.', money: 300000, xp: 100,
    check: (s) => s.cycled },
  { id: 'q_water', title: 'Thay 25% nước', hint: 'Thay nước giúp giảm NO3 tích tụ.', money: 50000, xp: 25,
    check: (s) => s.flags.waterChanges > 0 },
  { id: 'q_fish', title: 'Thả ít nhất 2 con cá', hint: 'Chọn loài phù hợp thể tích bể đang có.', money: 100000, xp: 40,
    check: (s) => s.fish.length >= 2 },
  { id: 'q_rep', title: 'Đạt uy tín 60', hint: 'Giữ nước sạch, cá khỏe và thêm cây/đá trang trí.', money: 200000, xp: 80,
    check: (s) => s.rep >= 60 },
];

// 20 thành tựu
export const ACHIEVEMENTS = [
  { id: 'a_first_tank', name: 'Bể đầu tiên', desc: 'Mua bể.', check: (s) => !!s.tank.id },
  { id: 'a_filter', name: 'Tuần hoàn', desc: 'Lắp lọc.', check: (s) => !!s.equipment.filter },
  { id: 'a_heater', name: 'Ổn nhiệt', desc: 'Lắp sưởi.', check: (s) => !!s.equipment.heater },
  { id: 'a_light', name: 'Bật đèn', desc: 'Mua đèn LED.', check: (s) => !!s.equipment.light },
  { id: 'a_cycled', name: 'Chu trình vàng', desc: 'Hoàn tất cycle.', check: (s) => s.cycled },
  { id: 'a_first_fish', name: 'Cư dân đầu tiên', desc: 'Thả con cá đầu tiên.', check: (s) => s.stats.fishBought >= 1 },
  { id: 'a_school', name: 'Bầy đàn', desc: 'Có 6 con cá cùng lúc.', check: (s) => s.fish.length >= 6 },
  { id: 'a_gold', name: 'Cá vàng', desc: 'Nuôi cá vàng trong bể 80L+.', check: (s) => s.fish.some((f) => f.species === 'gold') && s.tank.liters >= 80 },
  { id: 'a_shrimp', name: 'Tép nhỏ', desc: 'Nuôi tép cherry.', check: (s) => s.fish.some((f) => f.species === 'shrimp') },
  { id: 'a_no_death_10', name: '10 ngày bình yên', desc: 'Sống 10 ngày không cá chết.', check: (s) => s.stats.daysWithoutDeath >= 10 },
  { id: 'a_no_death_30', name: '30 ngày bình yên', desc: 'Sống 30 ngày không cá chết.', check: (s) => s.stats.daysWithoutDeath >= 30 },
  { id: 'a_rep_80', name: 'Uy tín cao', desc: 'Đạt uy tín 80.', check: (s) => s.rep >= 80 },
  { id: 'a_rep_100', name: 'Bậc thầy bể', desc: 'Đạt uy tín 100.', check: (s) => s.rep >= 100 },
  { id: 'a_money_5m', name: '5 triệu', desc: 'Có 5.000.000đ.', check: (s) => s.money >= 5000000 },
  { id: 'a_money_10m', name: '10 triệu', desc: 'Có 10.000.000đ.', check: (s) => s.money >= 10000000 },
  { id: 'a_level_5', name: 'Cấp 5', desc: 'Đạt cấp 5.', check: (s) => s.level >= 5 },
  { id: 'a_level_10', name: 'Cấp 10', desc: 'Đạt cấp 10.', check: (s) => s.level >= 10 },
  { id: 'a_plants_3', name: 'Vườn nước', desc: 'Trồng 3 cây.', check: (s) => s.decor.filter((d) => d.type === 'plant').length >= 3 },
  { id: 'a_water_5', name: 'Chăm chỉ', desc: 'Thay nước 5 lần.', check: (s) => s.flags.waterChanges >= 5 },
  { id: 'a_breed', name: 'Sinh sản', desc: 'Có cá sinh sản trong bể.', check: (s) => s.stats.bred >= 1 },
];

// Sự kiện ngẫu nhiên
export const EVENTS = {
  power: {
    title: 'Mất điện!',
    text: 'Máy sưởi và lọc tắt. Nhiệt độ bể bắt đầu tụt. Bạn xử lý thế nào?',
    options: [
      { label: 'Mua máy phát dự phòng (100.000đ)', cost: 100000, effect: 'power_buy' },
      { label: 'Ủ bể bằng chăn, chịu đựng', effect: 'power_wait' },
    ],
  },
  sick: {
    title: 'Cá có dấu hiệu bệnh',
    text: 'Một con cá bơi lờ đờ, vây xếp lại. Có thể do nước hoặc nhiễm khuẩn.',
    options: [
      { label: 'Mua thuốc và cách ly (180.000đ)', cost: 180000, effect: 'sick_cure' },
      { label: 'Theo dõi thêm, chưa can thiệp', effect: 'sick_wait' },
    ],
  },
  buyer: {
    title: 'Khách muốn mua cá',
    text: 'Một vị khách trả giá cao cho con cá khỏe nhất bể của bạn.',
    options: [
      { label: 'Bán con cá khỏe nhất', effect: 'buyer_sell' },
      { label: 'Từ chối, giữ bể ổn định (+4 uy tín)', effect: 'buyer_keep' },
    ],
  },
  algae: {
    title: 'Tảo bùng phát',
    text: 'Kính bể phủ một lớp xanh. Nguyên nhân thường do đèn bật quá lâu và NO3 cao.',
    options: [
      { label: 'Mua Otocinclus dọn tảo (60.000đ)', cost: 60000, effect: 'algae_oto' },
      { label: 'Giảm đèn và thay nước', effect: 'algae_reduce' },
    ],
  },
};
