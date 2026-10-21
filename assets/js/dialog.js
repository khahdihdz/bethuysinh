// Hộp thoại kiểu console 16-bit: chữ hiện dần, có nút bỏ qua.
let layer;
let speakerEl;
let textEl;
let optionsEl;
let skipBtn;
let timer = null;
let fullText = '';
let shown = 0;
let pendingOptions = [];
let open = false;

export function initDialog() {
  layer = document.getElementById('dialog-layer');
  speakerEl = document.getElementById('dialog-speaker');
  textEl = document.getElementById('dialog-text');
  optionsEl = document.getElementById('dialog-options');
  skipBtn = document.getElementById('dialog-skip');
  if (!layer) return;

  skipBtn.addEventListener('click', finishTyping);
  textEl.addEventListener('click', finishTyping);
  layer.addEventListener('click', (e) => {
    if (e.target === layer) finishTyping();
  });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      finishTyping();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      const first = optionsEl.querySelector('button');
      if (first && shown >= fullText.length) {
        e.preventDefault();
        first.click();
      }
    }
  });
}

function finishTyping() {
  if (!open) return;
  if (shown < fullText.length) {
    shown = fullText.length;
    textEl.textContent = fullText;
    if (timer) clearInterval(timer);
    timer = null;
    renderOptions();
    skipBtn.hidden = true;
    return;
  }
}

function renderOptions() {
  optionsEl.innerHTML = '';
  pendingOptions.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      closeDialog();
      if (typeof opt.onPick === 'function') opt.onPick();
    });
    optionsEl.appendChild(btn);
  });
  if (pendingOptions.length === 0) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = 'Đóng';
    btn.addEventListener('click', closeDialog);
    optionsEl.appendChild(btn);
  }
}

export function openDialog(config) {
  if (!layer) return;
  const { speaker = 'Chủ tiệm', text = '', options = [] } = config;
  open = true;
  fullText = text;
  shown = 0;
  pendingOptions = options;
  textEl.textContent = '';
  speakerEl.textContent = speaker;
  optionsEl.innerHTML = '';
  layer.hidden = false;
  skipBtn.hidden = false;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    shown = Math.min(fullText.length, shown + 2);
    textEl.textContent = fullText.slice(0, shown);
    if (shown >= fullText.length) {
      clearInterval(timer);
      timer = null;
      skipBtn.hidden = true;
      renderOptions();
      if (pendingOptions.length === 0) {
        // không có lựa chọn: đóng sau khi người chơi bấm
      }
    }
  }, 18);
}

export function closeDialog() {
  open = false;
  if (timer) clearInterval(timer);
  timer = null;
  if (layer) layer.hidden = true;
}

export function isDialogOpen() {
  return open;
}

// Hiện toàn bộ chữ ngay (dùng cho hội thoại quan trọng)
export function openDialogInstant(config) {
  openDialog(config);
  shown = fullText.length;
  textEl.textContent = fullText;
  if (timer) clearInterval(timer);
  timer = null;
  skipBtn.hidden = true;
  renderOptions();
}
