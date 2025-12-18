# @imccc/hex-viewer-js

高性能 WebGPU 十六进制查看器组件。

## 安装

```bash
npm install @imccc/hex-viewer-js
# 或
bun add @imccc/hex-viewer-js
```

## 使用

```typescript
import { HexViewer, createHexViewer } from '@imccc/hex-viewer-js';

// 方式 1: 使用类
const container = document.getElementById('container');
const viewer = new HexViewer(container, {
  fontPx: 14,
  theme: {
    background: '#1E1E1E',
    text: '#D4D4D4',
    address: '#569CD6',
  },
});

// 设置数据
viewer.setData('Hello, World!');
// 或使用 Uint8Array
viewer.setData(new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]));

// 方式 2: 使用工厂函数
const viewer2 = createHexViewer(container, options);
```

## 配置选项

```typescript
type HexViewerOptions = {
  /** 字体大小（CSS 像素），范围 [8, 48]，默认 14 */
  fontPx?: number;

  /** 主题颜色配置 */
  theme?: Partial<HexViewerTheme>;

  /** 滚动条宽度（像素），默认 20 */
  scrollBarWidthPx?: number;

  /** 每行最小字节数，默认 4 */
  minBytesPerRow?: number;

  /** 地址列和十六进制列之间的间隙（字符数） */
  addressGapChars?: number;

  /** 十六进制字节之间的间隙（字符数） */
  hexGapChars?: number;

  /** 十六进制列和 ASCII 列之间的间隙（字符数） */
  sectionGapChars?: number;

  /** 初始数据 */
  data?: string | Uint8Array;
};
```

## 主题配置

```typescript
type HexViewerTheme = {
  background: string;      // 背景色
  text: string;            // 文本色
  address: string;         // 地址列颜色
  dim: string;             // 暗色（不可打印字符）
  selectionBg: string;     // 选中背景色
  selectionFg: string;     // 选中前景色
  scrollTrack: string;     // 滚动条轨道色
  scrollThumb: string;     // 滚动条滑块色
  scrollThumbActive: string; // 滚动条滑块激活色
};
```

## API

### `HexViewer`

- `constructor(el: Element, options?: HexViewerOptions)` - 创建实例
- `setData(data: string | Uint8Array)` - 设置显示数据
- `destroy()` - 销毁实例，释放资源

### `createHexViewer(el: Element, options?: HexViewerOptions): HexViewer`

工厂函数，创建并返回 HexViewer 实例。

## 特性

- 🚀 **WebGPU 渲染** - 高性能 GPU 加速渲染
- 📦 **零依赖** - 无外部依赖
- 🎨 **可定制主题** - 完全可配置的颜色方案
- 📱 **响应式** - 自动适应容器尺寸
- 🖱️ **交互支持** - 支持鼠标选择、滚动、拖拽

## 开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 构建
bun run build
```

## License

MIT
