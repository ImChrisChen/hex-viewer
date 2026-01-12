<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { HexViewer, type ThemePreset, type HexViewerTheme } from '@imccc/hex-viewer-js/vue';

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

const lightTheme: Partial<HexViewerTheme> = {
  background: '#FFFFFF',
  text: '#000000',
  address: '#666666',
  dim: '#999999',
  selectionBg: '#0078D4',
  selectionFg: '#FFFFFF',
};

const darkTheme: Partial<HexViewerTheme> = {
  background: '#1E1E1E',
  text: '#FFFFFF',
  address: '#8EC0E4',
  dim: '#888888',
  selectionBg: '#0078D4',
  selectionFg: '#FFFFFF',
};

const sampleKey = ref<keyof typeof samples | 'custom'>('hello');
const customData = ref('');
const themePreset = ref<ThemePreset>('light');
const fontSize = ref(34);
const addressGap = ref(2);
const hexGap = ref(1);
const sectionGap = ref(4);
const colors = reactive({ ...lightTheme });

const data = computed(() => {
  if (sampleKey.value === 'custom') {
    return customData.value;
  }
  return samples[sampleKey.value];
});

const theme = computed(() => ({ ...colors }));

function handleThemeChange(preset: ThemePreset) {
  themePreset.value = preset;
  const newColors = preset === 'light' ? lightTheme : darkTheme;
  Object.assign(colors, newColors);
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>🔍 HexViewer Vue 演示</h1>
      <p>高性能 WebGPU 十六进制查看器 - Vue 组件</p>
    </div>

    <div class="main-content">
      <!-- 左侧控制面板 -->
      <div class="sidebar">
        <!-- 示例数据选择 -->
        <div class="section">
          <div class="section-title">📄 示例数据</div>
          <div class="control-group">
            <label class="control-label">选择示例</label>
            <select v-model="sampleKey" class="control-input">
              <option value="hello">Hello World</option>
              <option value="lorem">Lorem Ipsum</option>
              <option value="binary">二进制数据</option>
              <option value="unicode">Unicode 字符</option>
              <option value="custom">自定义数据</option>
            </select>
          </div>
          <div v-if="sampleKey === 'custom'" class="control-group">
            <label class="control-label">自定义数据</label>
            <textarea
              v-model="customData"
              class="control-input"
              placeholder="输入文本或十六进制数据..."
            ></textarea>
          </div>
        </div>

        <!-- 主题设置 -->
        <div class="section">
          <div class="section-title">🎨 主题设置</div>
          <div class="control-group">
            <label class="control-label">主题预设</label>
            <div class="button-group">
              <button
                :class="['btn', themePreset === 'light' ? 'btn-primary' : 'btn-secondary']"
                @click="handleThemeChange('light')"
              >
                ☀️ Light
              </button>
              <button
                :class="['btn', themePreset === 'dark' ? 'btn-primary' : 'btn-secondary']"
                @click="handleThemeChange('dark')"
              >
                🌙 Dark
              </button>
            </div>
          </div>
          <div class="color-grid">
            <div class="control-group">
              <label class="control-label">背景色</label>
              <input type="color" v-model="colors.background" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">文本色</label>
              <input type="color" v-model="colors.text" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">地址色</label>
              <input type="color" v-model="colors.address" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">暗色</label>
              <input type="color" v-model="colors.dim" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">选中背景</label>
              <input type="color" v-model="colors.selectionBg" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">选中前景</label>
              <input type="color" v-model="colors.selectionFg" class="control-input" />
            </div>
          </div>
        </div>

        <!-- 显示设置 -->
        <div class="section">
          <div class="section-title">⚙️ 显示设置</div>
          <div class="control-group">
            <label class="control-label">
              字体大小 <span class="range-value">{{ fontSize }}px</span>
            </label>
            <input
              type="range"
              v-model.number="fontSize"
              class="control-input"
              min="8"
              max="48"
            />
          </div>
          <div class="control-group">
            <label class="control-label">
              地址间隙 <span class="range-value">{{ addressGap }}</span>
            </label>
            <input
              type="range"
              v-model.number="addressGap"
              class="control-input"
              min="0"
              max="8"
              step="0.1"
            />
          </div>
          <div class="control-group">
            <label class="control-label">
              十六进制间隙 <span class="range-value">{{ hexGap }}</span>
            </label>
            <input
              type="range"
              v-model.number="hexGap"
              class="control-input"
              min="0"
              max="4"
              step="0.1"
            />
          </div>
          <div class="control-group">
            <label class="control-label">
              列间隙 <span class="range-value">{{ sectionGap }}</span>
            </label>
            <input
              type="range"
              v-model.number="sectionGap"
              class="control-input"
              min="0"
              max="8"
              step="0.1"
            />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="section">
          <div class="info-badge">✨ 修改参数后会自动实时更新</div>
        </div>
      </div>

      <!-- 右侧预览区域 -->
      <div class="viewer-container">
        <HexViewer
          class="hex-viewer-wrapper"
          :data="data"
          :themePreset="themePreset"
          :theme="theme"
          :fontPx="fontSize"
          :addressGapChars="addressGap"
          :hexGapChars="hexGap"
          :sectionGapChars="sectionGap"
        />
      </div>
    </div>
  </div>
</template>
