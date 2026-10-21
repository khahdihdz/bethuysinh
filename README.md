# Bể Xanh 16-bit

Game web pixel art 16-bit (phong cách SNES) về setup và quản lý bể thủy sinh.
Mua bể, lắp lọc và sưởi, chạy chu trình nitơ bằng vi sinh, thả cá, giữ nước ổn định
và mở rộng bể qua từng ngày.

- Chơi trực tiếp: https://khahdihdz.github.io/bethuysinh/
- Không backend, không đăng nhập, tiến trình lưu trong `localStorage`.
- Toàn bộ đồ hoạ sinh từ code (pixel + Canvas 2D), không ảnh raster, không CDN.

## Cách chơi

1. **Cửa hàng → Bể**: chọn bể (20L / 40L / 80L / 150L).
2. Lắp **lọc** và **sưởi** trong mục Thiết bị.
3. Mua **vi sinh** và **thức ăn** (Vật tư).
4. Tab **Bể**: thêm vi sinh, rắc một nhúm thức ăn vào bể trống để tạo amoniac.
5. Bấm **Test nước** để xem NH3 / NO2 / NO3 / pH.
6. Chờ vi sinh đạt ≥ 75% và NH3, NO2 gần 0 trong 2 ngày game → **cycle xong**.
7. Thay 25% nước rồi thả cá. Cho ăn 1–2 lần/ngày, tránh dư thừa.
8. Giữ NH3 < 0.25 mg/L, NO2 < 0.2 mg/L, NO3 < 40 mg/L, nhiệt độ đúng loài.
9. Thêm cây/đá/lũa để tăng uy tín và thu nhập thụ động.

Phím tắt: `1` `2` `3` đổi tốc độ x1 / x4 / x16, `Space` tạm dừng.

## Cơ chế mô phỏng

- 1 giây thực = 1 giờ game (x1). Một ngày game = 24 giây.
- Chất thải cá + thức ăn thừa → NH3 → NO2 → NO3 (nhờ vi khuẩn nitrat hóa).
- Vi sinh phát triển nhanh khi có lọc; lọc bẩn làm giảm hiệu suất.
- Oxy giảm khi nhiều cá/nhiệt cao; cây và lọc tăng oxy.
- Cá stress khi nhiệt độ, pH, NH3, NO2 hoặc oxy sai ngưỡng; stress 100 → chết.
- Sự kiện ngẫu nhiên: mất điện, cá bệnh, khách mua cá, tảo bùng phát.
- Quay lại sau khi đóng tab: mô phỏng bù tối đa 12 ngày game và hiện báo cáo.

> Đây là game mô phỏng giáo dục, số liệu được đơn giản hoá.
> Không thay thế hướng dẫn nuôi cá thật.

## Kỹ thuật

- HTML + CSS + JavaScript ES module thuần, không build step, không framework.
- Canvas nội bộ **256×224** (tỉ lệ SNES 4:3), scale nguyên khi đủ chỗ,
  `image-rendering: pixelated`, mọi toạ độ vẽ làm tròn pixel.
- Palette 64 màu chia bộ, sprite vẽ bằng `fillRect` trên lưới pixel.
- HUD trong canvas dùng bitmap font 5×7; nội dung dài dùng HTML monospace.
- Dữ liệu cân bằng tập trung ở `assets/js/config.js`.

### Cấu trúc

```
index.html
assets/css/style.css
assets/js/config.js    hằng số cân bằng, vật phẩm, cá, nhiệm vụ, thành tựu
assets/js/palette.js   bảng màu
assets/js/sprites.js   vẽ cá, cây, đá, thiết bị bằng pixel
assets/js/font.js      bitmap font 5x7 cho HUD
assets/js/state.js     trạng thái + event bus
assets/js/sim.js       mô phỏng nước, mua bán, hành động
assets/js/render.js    render 16-bit + animation
assets/js/ui.js        panel, tab, sự kiện, toast
assets/js/quests.js    nhiệm vụ + thành tựu
assets/js/dialog.js    hộp thoại typewriter
assets/js/save.js      localStorage + mô phỏng bù khi offline
assets/js/audio.js     WebAudio chip (mặc định tắt)
assets/js/main.js      bootstrap + vòng lặp game
assets/img/favicon.svg
.github/workflows/deploy.yml
```

## Deploy

Workflow `.github/workflows/deploy.yml` chạy khi push lên `main`:

1. `actions/configure-pages@v5`
2. `actions/upload-pages-artifact@v3` với `path: "."`
3. `actions/deploy-pages@v4`

Repo đã bật Pages với `build_type: workflow`, không cần nhánh `gh-pages`.

## Ghi chú phát triển

- Mọi đường dẫn tài nguyên là tương đối để chạy đúng dưới `/bethuysinh/`.
- Save có version; dữ liệu thiếu được merge với mặc định khi load.
- Chạy thử cục bộ: `python3 -m http.server 8080` rồi mở `http://localhost:8080/`.
