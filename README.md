# @imccc/hex-viewer-js

A high-performance, WebGPU-based Hex Viewer component for modern web applications.

## Preview

Check out the live demos:

- **[Vanilla JS Demo](https://github.com/ImChrisChen/hex-viewer)**
- **[Vue Demo](https://github.com/ImChrisChen/hex-viewer)**
- **[React Demo](https://github.com/ImChrisChen/hex-viewer)**

## Why High Performance?

This component is engineered for extreme performance using **WebGPU** and **Web Workers**.

### 🚀 Architecture vs Traditional DOM
Traditional hex viewers render thousands of DOM elements (`<div>` or `<span>`) for each byte. This causes massive memory usage and "layout thrashing," crashing the browser when loading files larger than a few megabytes.

**HexViewer** takes a different approach:
1. **Off-Main-Thread Rendering**: It uses `OffscreenCanvas` to move all rendering logic to a separate **Web Worker**. This ensures your UI remains responsive (no freezing!) even while rendering gigabytes of data.
2. **GPU Acceleration**: Data is rendered as a single texture using **WebGPU**, utilizing the massive parallel processing power of your graphics card.
3. **Virtualization**: Only the visible viewport is processed.

### 📊 Performance Comparison

| Feature | Traditional DOM Viewer | HexViewer (WebGPU) |
|:---|:---|:---|
| **Rendering Tech** | HTML / CSS (CPU) | WebGPU (GPU) |
| **DOM Nodes** | Thousands (1 per byte) | **1** (Canvas element) |
| **Main Thread** | Blocked during scroll/render | **Idle** (Render in Worker) |
| **Memory Usage** | High (DOM overhead) | **Low** (Buffer only) |
| **Max File Size** | ~10MB (Browser limit) | **Unlimited** (Virtual) |
| **FPS** | Drops with data size | **Stable 60 FPS** |

## Installation

```bash
npm install @imccc/hex-viewer-js
# or
bun add @imccc/hex-viewer-js
```

## Usage

### Vanilla JS

```typescript
import { HexViewer, createHexViewer } from '@imccc/hex-viewer-js';

const container = document.getElementById('hex-viewer-container');

// Method 1: Using Class
const viewer = new HexViewer(container, {
  fontPx: 14,
  theme: {
    background: '#1E1E1E',
    text: '#D4D4D4',
    address: '#569CD6',
  },
});

// Method 2: Using Factory Function
// const viewer = createHexViewer(container, options);

// Set Data
// Supports String
viewer.setData('Hello, World!');
// Supports Uint8Array (recommended for binary data)
viewer.setData(new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]));

// Cleanup
// viewer.destroy();
```

### Vue 3

```vue
<script setup>
import { HexViewer } from '@imccc/hex-viewer-js/vue';

const data = new Uint8Array([0xCA, 0xFE, 0xBA, 0xBE]);
const theme = {
  background: '#1E1E1E',
  text: '#FFFFFF',
};
</script>

<template>
  <div style="height: 500px">
    <HexViewer 
      :data="data" 
      :theme="theme" 
      :fontPx="14" 
    />
  </div>
</template>
```

### React

```tsx
import { HexViewer } from '@imccc/hex-viewer-js/react';

function App() {
  const data = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
  
  return (
    <div style={{ height: '500px' }}>
      <HexViewer 
        data={data}
        fontPx={14}
        theme={{
          background: '#ffffff',
          text: '#000000'
        }}
      />
    </div>
  );
}
```

## Configuration

`HexViewerOptions` interface:

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `data` | `string \| Uint8Array` | `null` | Initial data to display. |
| `fontPx` | `number` | `14` | Font size in pixels (range 8-48). |
| `theme` | `Partial<HexViewerTheme>` | - | Custom theme colors. |
| `themePreset` | `'light' \| 'dark'` | `'light'` | Built-in theme preset. |
| `scrollBarWidthPx` | `number` | `20` | Width of the custom scrollbar. |
| `minBytesPerRow` | `number` | `4` | Minimum bytes to display per row. |
| `addressGapChars` | `number` | - | Character gap between Address and Hex columns. |
| `hexGapChars` | `number` | - | Character gap between hex bytes. |
| `sectionGapChars` | `number` | - | Character gap between Hex and ASCII sections. |

## Theme Configuration

You can customize every aspect of the color scheme via the `theme` prop:

```typescript
type HexViewerTheme = {
  background: string;      // Main background color
  text: string;            // Primary text color
  address: string;         // Address column text color
  dim: string;             // Color for non-printable/dimmed characters
  selectionBg: string;     // Background color of selected bytes
  selectionFg: string;     // Text color of selected bytes
  scrollTrack: string;     // Scrollbar track color
  scrollThumb: string;     // Scrollbar thumb color
  scrollThumbActive: string; // Scrollbar thumb hover/active color
};
```

## API

### `HexViewer` Class

- **`constructor(el: Element, options?: HexViewerOptions)`**
  Creates a new instance attached to the provided DOM element.

- **`setData(data: string | Uint8Array)`**
  Updates the data being displayed. Efficiently handles large updates.

- **`destroy()`**
  Cleans up WebGPU resources, event listeners, and removes the canvas. Always call this when the component is no longer needed (the Vue and React wrappers handle this automatically).

## Features

- 🚀 **WebGPU Rendering**: High-performance rendering pipeline.
- 📦 **Zero Dependencies**: Lightweight and standalone.
- 🎨 **Theming**: comprehensive theming support with light/dark presets.
- 📱 **Responsive**: Automatically adjusts bytes per row based on container width.
- 🖱️ **Interactive**: Mouse selection, scrolling, and keyboard navigation support.
- 📋 **Clipboard**: Easy copy-paste functionality.

## Development

```bash
# Install dependencies
bun install

# Start development server (Vanilla JS)
bun run dev:purejs

# Start Vue demo
bun run dev:vue

# Start React demo
bun run dev:react

# Build library
bun run build:lib

# Build all examples
bun run build:all
```

## License

MIT
