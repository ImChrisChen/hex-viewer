<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { HexViewer, type ThemePreset, type HexViewerTheme } from '@imccc/hex-viewer-js/vue';
import bigData from '../comments.json';

// Sample Data
const samples = {
  hello: 'Hello, World! Greetings from HexViewer Vue Demo.\nThis is a high-performance hex viewer.',
  bigdata: bigData,
  binary: new Uint8Array([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
    0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F,
    0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2E, 0x2F,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0x3E, 0x3F,
    0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8, 0xF7, 0xF6, 0xF5, 0xF4, 0xF3, 0xF2, 0xF1, 0xF0,
  ]),
  unicode: '🚀 Unicode Test\nChinese: 你好世界\nEmoji: 😀😃😄😁😆😅🤣😂\nJapanese: こんにちは\nKorean: 안녕하세요\nRussian: Привет',
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
const editableData = ref('');
const themePreset = ref<ThemePreset>('light');
const fontSize = ref(32);
const addressGap = ref(0.4);
const hexGap = ref(0.6);
const sectionGap = ref(1);
const colors = reactive({ ...lightTheme });
const copySuccess = ref(false);

// Convert to display text
function dataToDisplayText(value: unknown): string {
  if (value instanceof Uint8Array) {
    return Array.from(value).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

// Initialize editable data
watch(sampleKey, (key) => {
  if (key !== 'custom') {
    editableData.value = dataToDisplayText(samples[key]);
  }
}, { immediate: true });

const data = computed(() => {
  if (sampleKey.value === 'custom') {
    return customData.value;
  }
  // Use editable data
  return editableData.value;
});

const theme = computed(() => ({ ...colors }));

// Generate code example
const exampleCode = computed(() => {
  const themeCode = themePreset.value === 'light' ? 'light' : 'dark';
  const customTheme = Object.entries(colors)
    .map(([key, value]) => `    ${key}: '${value}'`)
    .join(',\n');

  return `<template>
  <HexViewer
    :data="data"
    themePreset="${themeCode}"
    :theme="customTheme"
    :fontPx="${fontSize.value}"
    :addressGapChars="${addressGap.value}"
    :hexGapChars="${hexGap.value}"
    :sectionGapChars="${sectionGap.value}"
  />
</template>

<script setup>
import { HexViewer } from '@imccc/hex-viewer-js/vue';

const data = \`${sampleKey.value === 'custom' ? customData.value.slice(0, 50) + '...' : editableData.value.slice(0, 50) + '...'}\`;

const customTheme = {
${customTheme}
};
<\/script>`;
});

function handleThemeChange(preset: ThemePreset) {
  themePreset.value = preset;
  const newColors = preset === 'light' ? lightTheme : darkTheme;
  Object.assign(colors, newColors);
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(exampleCode.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>🔍 HexViewer Vue Demo</h1>
      <p>High Performance WebGPU Hex Viewer - Vue Component</p>
    </div>

    <div class="main-content">
      <!-- Sidebar -->
      <div class="sidebar">
        <!-- Sample Data -->
        <div class="section">
          <div class="section-title">📄 Sample Data</div>
          <div class="control-group">
            <label class="control-label">Select Sample</label>
            <select v-model="sampleKey" class="control-input">
              <option value="hello">Hello World</option>
              <option value="bigdata">JSON</option>
              <option value="binary">Binary Data</option>
              <option value="unicode">Unicode Characters</option>
              <option value="custom">Custom Data</option>
            </select>
          </div>
          <div v-if="sampleKey === 'custom'" class="control-group">
            <label class="control-label">Custom Data</label>
            <textarea v-model="customData" class="control-input data-textarea"
              placeholder="Enter text or hex data..."></textarea>
          </div>
          <div v-else class="control-group">
            <label class="control-label">Raw Data (Editable)</label>
            <textarea v-model="editableData" class="control-input data-textarea"
              placeholder="Edit to preview..."></textarea>
          </div>
        </div>

        <!-- Theme Settings -->
        <div class="section">
          <div class="section-title">🎨 Theme Settings</div>
          <div class="control-group">
            <label class="control-label">Preset</label>
            <div class="button-group">
              <button :class="['btn', themePreset === 'light' ? 'btn-primary' : 'btn-secondary']"
                @click="handleThemeChange('light')">
                ☀️ Light
              </button>
              <button :class="['btn', themePreset === 'dark' ? 'btn-primary' : 'btn-secondary']"
                @click="handleThemeChange('dark')">
                🌙 Dark
              </button>
            </div>
          </div>
          <div class="color-grid">
            <div class="control-group">
              <label class="control-label">Background</label>
              <input type="color" v-model="colors.background" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">Text</label>
              <input type="color" v-model="colors.text" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">Address</label>
              <input type="color" v-model="colors.address" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">Dim</label>
              <input type="color" v-model="colors.dim" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">Selection Bg</label>
              <input type="color" v-model="colors.selectionBg" class="control-input" />
            </div>
            <div class="control-group">
              <label class="control-label">Selection Fg</label>
              <input type="color" v-model="colors.selectionFg" class="control-input" />
            </div>
          </div>
        </div>

        <!-- Display Settings -->
        <div class="section">
          <div class="section-title">⚙️ Display Settings</div>
          <div class="control-group">
            <label class="control-label">
              Font Size <span class="range-value">{{ fontSize }}px</span>
            </label>
            <input type="range" v-model.number="fontSize" class="control-input" min="8" max="48" />
          </div>
          <div class="control-group">
            <label class="control-label">
              Address Gap <span class="range-value">{{ addressGap }}</span>
            </label>
            <input type="range" v-model.number="addressGap" class="control-input" min="0" max="8" step="0.1" />
          </div>
          <div class="control-group">
            <label class="control-label">
              Hex Gap <span class="range-value">{{ hexGap }}</span>
            </label>
            <input type="range" v-model.number="hexGap" class="control-input" min="0" max="4" step="0.1" />
          </div>
          <div class="control-group">
            <label class="control-label">
              Section Gap <span class="range-value">{{ sectionGap }}</span>
            </label>
            <input type="range" v-model.number="sectionGap" class="control-input" min="0" max="8" step="0.1" />
          </div>
        </div>

        <!-- Code Example -->
        <div class="section">
          <div class="section-title">
            📝 Usage Example
            <button class="copy-btn" :class="{ 'copy-success': copySuccess }" @click="copyCode">
              {{ copySuccess ? '✓ Copied' : '📋 Copy Code' }}
            </button>
          </div>
          <div class="code-preview">
            <pre><code>{{ exampleCode }}</code></pre>
          </div>
        </div>

      </div>

      <!-- Viewer Container -->
      <div class="viewer-container">
        <HexViewer class="hex-viewer-wrapper" :data="data" :themePreset="themePreset" :theme="theme" :fontPx="fontSize"
          :addressGapChars="addressGap" :hexGapChars="hexGap" :sectionGapChars="sectionGap" />
      </div>
    </div>
  </div>
</template>
