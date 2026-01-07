import { createHexViewer, type ThemePreset } from './src/hex-viewer';

// 示例数据
const samples = {
  hello: 'Hello, World! 你好,世界!\nWelcome to HexViewer Demo.\n这是一个高性能的十六进制查看器。',
  lorem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  binary: new Uint8Array([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
    0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F,
    0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0x3E, 0x3F,
    0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8, 0xF7, 0xF6, 0xF5, 0xF4, 0xF3, 0xF2, 0xF1, 0xF0,
  ]),
  unicode: '🚀 Unicode 测试\n中文字符:你好世界\nEmoji: 😀😃😄😁😆😅🤣😂\n日本語:こんにちは\n한국어: 안녕하세요\nРусский: Привет',
};

let viewer: any = null;
let currentConfig = {
  fontPx: 14,
  minBytesPerRow: 16,
  addressGapChars: 2,
  hexGapChars: 1,
  sectionGapChars: 4,
  themePreset: 'light' as ThemePreset,
  theme: {
    background: '#FFFFFF',
    text: '#000000',
    address: '#666666',
    dim: '#999999',
    selectionBg: '#0078D4',
    selectionFg: '#FFFFFF',
  }
};

// 初始化 HexViewer
function initViewer() {
  const el = document.querySelector('#hex-viewer-display');
  if (!el) throw new Error("Container element not found");

  if (viewer) {
    viewer.destroy();
  }

  viewer = createHexViewer(el, {
    fontPx: currentConfig.fontPx,
    scrollBarWidthPx: 20,
    minBytesPerRow: currentConfig.minBytesPerRow,
    themePreset: currentConfig.themePreset,
    theme: currentConfig.theme,
    addressGapChars: currentConfig.addressGapChars,
    hexGapChars: currentConfig.hexGapChars,
    sectionGapChars: currentConfig.sectionGapChars,
  });

  viewer.setData(samples.hello);
}

// 更新范围输入的显示值
function updateRangeDisplay(id: string, value: string, suffix = '') {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value + suffix;
  }
}

// 应用设置
function applySettings() {
  const fontSizeEl = document.getElementById('font-size') as HTMLInputElement;
  const bytesPerRowEl = document.getElementById('bytes-per-row') as HTMLInputElement;
  const addressGapEl = document.getElementById('address-gap') as HTMLInputElement;
  const hexGapEl = document.getElementById('hex-gap') as HTMLInputElement;
  const sectionGapEl = document.getElementById('section-gap') as HTMLInputElement;
  const colorBgEl = document.getElementById('color-background') as HTMLInputElement;
  const colorTextEl = document.getElementById('color-text') as HTMLInputElement;
  const colorAddressEl = document.getElementById('color-address') as HTMLInputElement;
  const colorDimEl = document.getElementById('color-dim') as HTMLInputElement;
  const colorSelBgEl = document.getElementById('color-selection-bg') as HTMLInputElement;
  const colorSelFgEl = document.getElementById('color-selection-fg') as HTMLInputElement;

  currentConfig = {
    fontPx: parseInt(fontSizeEl.value),
    minBytesPerRow: parseInt(bytesPerRowEl.value),
    addressGapChars: parseInt(addressGapEl.value),
    hexGapChars: parseInt(hexGapEl.value),
    sectionGapChars: parseInt(sectionGapEl.value),
    themePreset: currentConfig.themePreset,
    theme: {
      background: colorBgEl.value,
      text: colorTextEl.value,
      address: colorAddressEl.value,
      dim: colorDimEl.value,
      selectionBg: colorSelBgEl.value,
      selectionFg: colorSelFgEl.value,
    }
  };

  // 重新初始化 viewer
  initViewer();

  // 应用当前选中的示例数据
  const sampleSelectEl = document.getElementById('sample-select') as HTMLSelectElement;
  const sampleKey = sampleSelectEl.value;

  if (sampleKey === 'custom') {
    const customDataEl = document.getElementById('custom-data') as HTMLTextAreaElement;
    const customData = customDataEl.value;
    if (customData && viewer) {
      viewer.setData(customData);
    }
  } else if (sampleKey in samples) {
    if (viewer) {
      viewer.setData(samples[sampleKey as keyof typeof samples]);
    }
  }
}

// 设置浅色主题
function setLightTheme() {
  (document.getElementById('color-background') as HTMLInputElement).value = '#FFFFFF';
  (document.getElementById('color-text') as HTMLInputElement).value = '#000000';
  (document.getElementById('color-address') as HTMLInputElement).value = '#666666';
  (document.getElementById('color-dim') as HTMLInputElement).value = '#999999';
  (document.getElementById('color-selection-bg') as HTMLInputElement).value = '#0078D4';
  (document.getElementById('color-selection-fg') as HTMLInputElement).value = '#FFFFFF';
  currentConfig.themePreset = 'light';
}

// 设置深色主题
function setDarkTheme() {
  (document.getElementById('color-background') as HTMLInputElement).value = '#1E1E1E';
  (document.getElementById('color-text') as HTMLInputElement).value = '#FFFFFF';
  (document.getElementById('color-address') as HTMLInputElement).value = '#8EC0E4';
  (document.getElementById('color-dim') as HTMLInputElement).value = '#888888';
  (document.getElementById('color-selection-bg') as HTMLInputElement).value = '#0078D4';
  (document.getElementById('color-selection-fg') as HTMLInputElement).value = '#FFFFFF';
  currentConfig.themePreset = 'dark';
}

// 初始化事件监听
function initEventListeners() {
  // 范围输入事件
  document.getElementById('font-size')?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    updateRangeDisplay('font-size-value', target.value, 'px');
  });

  document.getElementById('bytes-per-row')?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    updateRangeDisplay('bytes-per-row-value', target.value);
  });

  document.getElementById('address-gap')?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    updateRangeDisplay('address-gap-value', target.value);
  });

  document.getElementById('hex-gap')?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    updateRangeDisplay('hex-gap-value', target.value);
  });

  document.getElementById('section-gap')?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    updateRangeDisplay('section-gap-value', target.value);
  });

  // 主题按钮事件
  document.getElementById('theme-light')?.addEventListener('click', setLightTheme);
  document.getElementById('theme-dark')?.addEventListener('click', setDarkTheme);

  // 示例选择事件
  document.getElementById('sample-select')?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    const customGroup = document.getElementById('custom-data-group');
    if (target.value === 'custom') {
      if (customGroup) customGroup.style.display = 'block';
    } else {
      if (customGroup) customGroup.style.display = 'none';
      if (viewer) {
        viewer.setData(samples[target.value as keyof typeof samples]);
      }
    }
  });

  // 应用设置按钮
  document.getElementById('apply-settings')?.addEventListener('click', applySettings);
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initViewer();
    initEventListeners();
  });
} else {
  initViewer();
  initEventListeners();
}