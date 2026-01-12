// 使用 Vite 的 ?worker&inline 语法导入内联 worker
import RendererWorker from './renderer.worker.ts?worker&inline';

// 对外暴露给使用者的主题配置，颜色使用 CSS 十六进制字符串（如 "#FFFFFF" 或 "#11223344"）
export type HexViewerTheme = {
  background: string;
  text: string;
  address: string;
  dim: string;
  selectionBg: string;
  selectionFg: string;
  scrollTrack: string;
  scrollThumb: string;
  scrollThumbActive: string;
};

/** 预设主题：light / dark */
export type ThemePreset = 'light' | 'dark';

/** Light 主题预设（所有字段的默认值） */
const LIGHT_THEME: HexViewerTheme = {
  background: '#FFFFFF',
  text: '#000000',
  address: '#666666',
  dim: '#999999',
  selectionBg: '#0078D4',
  selectionFg: '#FFFFFF',
  scrollTrack: '#EDEDED',
  scrollThumb: '#C9C9C9',
  scrollThumbActive: '#AFAFAF',
};

/** Dark 主题预设（所有字段的默认值） */
const DARK_THEME: HexViewerTheme = {
  background: '#1E1E1E',
  text: '#FFFFFF',
  address: '#8EC0E4',
  dim: '#888888',
  selectionBg: '#0078D4',
  selectionFg: '#FFFFFF',
  scrollTrack: '#333333',
  scrollThumb: '#555555',
  scrollThumbActive: '#777777',
};

// 创建 HexViewer 时的配置选项
export type HexViewerOptions = {
  /** 字体大小（CSS 像素），渲染器内部会限制在 [8, 48] 范围。 */
  fontPx?: number;

  /** 主题预设：'light' | 'dark'。会先应用预设，再用 theme 字段覆盖。 */
  themePreset?: ThemePreset;

  /** 主题颜色覆盖，使用十六进制颜色字符串（例如 "#1E1E1E"）。 */
  theme?: Partial<HexViewerTheme>;

  /** 画布内部滚动条的宽度（设备像素）。 */
  scrollBarWidthPx?: number;

  /** 十六进制视图中每行的最小字节数。 */
  minBytesPerRow?: number;

  /** 地址列和十六进制列之间的字符间隙（以等宽字符个数为单位）。 */
  addressGapChars?: number;

  /** 十六进制字节之间的字符间隙（每个字节 2 个 hex 字符后追加的空格数）。 */
  hexGapChars?: number;

  /** 十六进制列和 ASCII 列之间的字符间隙。 */
  sectionGapChars?: number;

  /**
   * 初始渲染内容，可以是字符串（将按 UTF-8 编码为字节）或者 Uint8Array（直接作为字节缓冲）。
   */
  data?: string | Uint8Array | object | unknown[];
};

// 发送给 Worker 端渲染器的主题类型：颜色为线性 RGBA 浮点数组
type WorkerHexViewerTheme = {
  background: [number, number, number, number];
  text: [number, number, number, number];
  address: [number, number, number, number];
  dim: [number, number, number, number];
  selectionBg: [number, number, number, number];
  selectionFg: [number, number, number, number];
  scrollTrack: [number, number, number, number];
  scrollThumb: [number, number, number, number];
  scrollThumbActive: [number, number, number, number];
};

type RendererInitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  dpr: number;
  fontPx?: number;
  // 传给 Worker 的主题对象，已经通过工具函数将颜色从十六进制字符串转换为 [r,g,b,a]。
  theme?: Partial<WorkerHexViewerTheme>;
  scrollBarWidthPx?: number;
  minBytesPerRow?: number;
  addressGapChars?: number;
  hexGapChars?: number;
  sectionGapChars?: number;
};

type RendererResizeMessage = {
  type: "resize";
  width: number;
  height: number;
  dpr: number;
};

type RendererWheelMessage = {
  type: "wheel";
  deltaX: number;
  deltaY: number;
  ctrlKey: boolean;
  shiftKey: boolean;
};

type RendererPointerMessage = {
  type: "pointer";
  phase: "down" | "move" | "up";
  x: number;
  y: number;
  button: number;
  buttons: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

type RendererKeyMessage = {
  type: "key";
  phase: "down" | "up";
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

type RendererConfigMessage = {
  type: "config";
  fontPx?: number;
  // 运行时配置更新中的主题字段,使用 Worker 端的主题类型
  theme?: Partial<WorkerHexViewerTheme>;
  scrollBarWidthPx?: number;
  minBytesPerRow?: number;
  addressGapChars?: number;
  hexGapChars?: number;
  sectionGapChars?: number;
};

type RendererDataMessage = {
  type: "data";
  /** 实际渲染的数据缓冲区，以 ArrayBuffer 形式发送给 Worker。 */
  buffer: ArrayBufferLike;
};

type MainToWorkerMessage =
  | RendererInitMessage
  | RendererResizeMessage
  | RendererWheelMessage
  | RendererPointerMessage
  | RendererKeyMessage
  | RendererConfigMessage
  | RendererDataMessage;

type WorkerToMainMessage =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "copy"; text: string };

// 将浏览器中 canvas 的 CSS 尺寸转换为设备像素尺寸
function getCanvasSize(canvas: HTMLCanvasElement): { width: number; height: number; dpr: number } {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssW = canvas.clientWidth || rect.width;
  const cssH = canvas.clientHeight || rect.height;
  const width = Math.max(1, Math.floor(cssW * dpr));
  const height = Math.max(1, Math.floor(cssH * dpr));
  return { width, height, dpr };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Worker 已通过 Vite 内联导入（见文件顶部的 import 语句）

// 将十六进制颜色字符串转换为 [r,g,b,a] 浮点数组，范围 [0,1]
// 支持形如 #RRGGBB 或 #RRGGBBAA，不合法输入会返回 undefined
function hexToRgbaFloats(hex: string): [number, number, number, number] | undefined {
  let s = hex.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (s.length !== 6 && s.length !== 8) return undefined;

  const parse = (start: number) => Number.parseInt(s.slice(start, start + 2), 16);
  const r = parse(0);
  const g = parse(2);
  const b = parse(4);
  const a = s.length === 8 ? parse(6) : 255;
  if ([r, g, b, a].some((v) => Number.isNaN(v))) return undefined;
  return [r / 255, g / 255, b / 255, a / 255];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function parseRgbComponent(raw: string): number | undefined {
  const s = raw.trim();
  if (s.endsWith("%")) {
    const pct = Number.parseFloat(s.slice(0, -1));
    if (!Number.isFinite(pct)) return undefined;
    return clamp01(pct / 100) * 255;
  }
  const v = Number.parseFloat(s);
  if (!Number.isFinite(v)) return undefined;
  return Math.max(0, Math.min(255, v));
}

function parseAlphaComponent(raw: string): number | undefined {
  const s = raw.trim();
  if (s.endsWith("%")) {
    const pct = Number.parseFloat(s.slice(0, -1));
    if (!Number.isFinite(pct)) return undefined;
    return clamp01(pct / 100);
  }
  const v = Number.parseFloat(s);
  if (!Number.isFinite(v)) return undefined;
  return clamp01(v);
}

function cssRgbToRgbaFloats(input: string): [number, number, number, number] | undefined {
  const m = input.trim().match(/^rgba?\((.*)\)$/i);
  if (!m) return undefined;

  // 支持：
  // - rgb(r, g, b)
  // - rgba(r, g, b, a)
  // - rgb(r g b / a)
  // - rgba(r g b / a)
  const body = (m[1] ?? "").trim();
  if (!body) return undefined;
  const parts = body.includes("/")
    ? body
      .split("/")
      .map((x) => x.trim())
      .flatMap((seg, idx) => (idx === 0 ? seg.split(/[ ,]+/).filter(Boolean) : [seg]))
    : body.split(/\s*,\s*/);

  if (parts.length !== 3 && parts.length !== 4) return undefined;

  const [p0, p1, p2, p3] = parts;
  if (p0 === undefined || p1 === undefined || p2 === undefined) return undefined;

  const r255 = parseRgbComponent(p0);
  const g255 = parseRgbComponent(p1);
  const b255 = parseRgbComponent(p2);
  if (r255 === undefined || g255 === undefined || b255 === undefined) return undefined;
  const a = parts.length === 4 ? parseAlphaComponent(p3 ?? "") : 1;
  if (a === undefined) return undefined;
  return [r255 / 255, g255 / 255, b255 / 255, a];
}

function colorToRgbaFloats(color: string): [number, number, number, number] | undefined {
  return hexToRgbaFloats(color) ?? cssRgbToRgbaFloats(color);
}

// 解析最终主题：先应用 themePreset 预设，再用 theme 字段覆盖
function resolveTheme(preset?: ThemePreset, override?: Partial<HexViewerTheme>): HexViewerTheme | undefined {
  const base = preset === 'light' ? LIGHT_THEME : preset === 'dark' ? DARK_THEME : undefined;
  if (!base && !override) return undefined;
  // 确保 base 存在；若没有 preset 则用空对象作为基础，避免 undefined 传播
  const merged: HexViewerTheme = { ...base, ...override } as HexViewerTheme;
  return merged;
}

// 将对外的 HexViewerTheme（十六进制字符串）映射为 Worker 使用的浮点主题对象
function mapThemeToWorker(theme?: Partial<HexViewerTheme>): Partial<WorkerHexViewerTheme> | undefined {
  if (!theme) return undefined;
  const result: Partial<WorkerHexViewerTheme> = {};

  const assign = (key: keyof WorkerHexViewerTheme, value: string | undefined) => {
    if (typeof value !== "string") return;
    const rgba = colorToRgbaFloats(value);
    if (!rgba) return;
    switch (key) {
      case "background":
        result.background = rgba;
        break;
      case "text":
        result.text = rgba;
        break;
      case "address":
        result.address = rgba;
        break;
      case "dim":
        result.dim = rgba;
        break;
      case "selectionBg":
        result.selectionBg = rgba;
        break;
      case "selectionFg":
        result.selectionFg = rgba;
        break;
      case "scrollTrack":
        result.scrollTrack = rgba;
        break;
      case "scrollThumb":
        result.scrollThumb = rgba;
        break;
      case "scrollThumbActive":
        result.scrollThumbActive = rgba;
        break;
    }
  };

  assign("background", theme.background);
  assign("text", theme.text);
  assign("address", theme.address);
  assign("dim", theme.dim);
  assign("selectionBg", theme.selectionBg);
  assign("selectionFg", theme.selectionFg);
  assign("scrollTrack", theme.scrollTrack);
  assign("scrollThumb", theme.scrollThumb);
  assign("scrollThumbActive", theme.scrollThumbActive);

  return result;
}

/**
 * HexViewer 是一个绑定到用户提供的 canvas 的自包含渲染器。
 * 渲染发生在使用 WebGPU + OffscreenCanvas 的 Worker 中。
 */
export class HexViewer {
  // 绑定的容器元素
  private readonly container: HTMLElement | Element;
  // 绑定的 canvas 元素
  readonly canvas: HTMLCanvasElement;

  // 渲染器 Worker 实例
  private worker: Worker;
  // 容器尺寸观察器
  private resizeObserver: ResizeObserver | null = null;
  // 是否已经销毁
  private disposed = false;
  // 当前的配置选项
  private currentOptions: HexViewerOptions;

  private readonly onResize: () => void;
  private readonly onWheel: (e: WheelEvent) => void;
  private readonly onPointerDown: (e: PointerEvent) => void;
  private readonly onPointerMove: (e: PointerEvent) => void;
  private readonly onPointerUp: (e: PointerEvent) => void;
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onKeyUp: (e: KeyboardEvent) => void;

  constructor(el: HTMLElement | Element, options: HexViewerOptions = {}) {
    // 保存当前配置
    this.currentOptions = { ...options };

    this.container = el;

    // 创建并配置 canvas 元素
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.outline = 'none';
    canvas.style.position = 'absolute'
    canvas.style.top = '0';
    canvas.style.left = '0';
    (el as HTMLElement).style.position = 'relative';
    el.appendChild(canvas);

    this.canvas = canvas;
    this.canvas.tabIndex = this.canvas.tabIndex || 0;

    const offscreen = canvas.transferControlToOffscreen();
    this.worker = new RendererWorker();

    this.worker.onmessage = (ev: MessageEvent<WorkerToMainMessage>) => {
      if (ev.data.type === "error") {
        console.error('hexviewer error: ', ev.data);
        // 在容器中显示错误信息
        this.showError(ev.data.message);
      } else if (ev.data.type === "copy") {
        // 将选中内容复制到剪贴板
        navigator.clipboard.writeText(ev.data.text).catch((err) => {
          console.error("Failed to copy to clipboard:", err);
        });
      }
    };

    // 初始化时根据当前 canvas 尺寸和配置构造一条 init 消息给 Worker
    const size = getCanvasSize(canvas);
    const resolvedTheme = resolveTheme(options.themePreset, options.theme);
    const workerTheme = mapThemeToWorker(resolvedTheme);
    const initMsg: RendererInitMessage = {
      type: "init",
      canvas: offscreen,
      width: size.width,
      height: size.height,
      dpr: size.dpr,
      fontPx: options.fontPx,
      theme: workerTheme,
      scrollBarWidthPx: options.scrollBarWidthPx,
      minBytesPerRow: options.minBytesPerRow,
      addressGapChars: options.addressGapChars,
      hexGapChars: options.hexGapChars,
      sectionGapChars: options.sectionGapChars,
    };
    this.worker.postMessage(initMsg, [offscreen]);

    // 如果提供了初始数据，在初始化消息发送后立即下发数据缓冲
    if (options.data !== undefined) {
      this.setData(options.data);
    }

    this.onResize = () => {
      if (this.disposed) return;
      // 根据容器尺寸更新 canvas 的 CSS 尺寸
      this.canvas.style.width = this.container.clientWidth + "px";
      this.canvas.style.height = this.container.clientHeight + "px";
      const s = getCanvasSize(this.canvas);
      const msg: RendererResizeMessage = {
        type: "resize",
        width: s.width,
        height: s.height,
        dpr: s.dpr,
      };
      this.worker.postMessage(msg);
    };

    this.onWheel = (e) => {
      e.preventDefault();
      const msg: RendererWheelMessage = {
        type: "wheel",
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
      };
      this.worker.postMessage(msg);
    };

    const toCanvasXY = (e: PointerEvent): { x: number; y: number } => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
    };

    this.onPointerDown = (e) => {
      this.canvas.focus();
      this.canvas.setPointerCapture(e.pointerId);
      const p = toCanvasXY(e);
      const msg: RendererPointerMessage = {
        type: "pointer",
        phase: "down",
        x: p.x,
        y: p.y,
        button: e.button,
        buttons: e.buttons,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      };
      this.worker.postMessage(msg);
    };

    this.onPointerMove = (e) => {
      const p = toCanvasXY(e);
      const msg: RendererPointerMessage = {
        type: "pointer",
        phase: "move",
        x: p.x,
        y: p.y,
        button: e.button,
        buttons: e.buttons,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      };
      this.worker.postMessage(msg);
    };

    this.onPointerUp = (e) => {
      const p = toCanvasXY(e);
      const msg: RendererPointerMessage = {
        type: "pointer",
        phase: "up",
        x: p.x,
        y: p.y,
        button: e.button,
        buttons: e.buttons,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      };
      this.worker.postMessage(msg);
    };

    this.onKeyDown = (e) => {
      const msg: RendererKeyMessage = {
        type: "key",
        phase: "down",
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      };
      this.worker.postMessage(msg);
    };

    this.onKeyUp = (e) => {
      const msg: RendererKeyMessage = {
        type: "key",
        phase: "up",
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      };
      this.worker.postMessage(msg);
    };

    window.addEventListener("resize", this.onResize, { passive: true });
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(this.container);
    }
  }

  private showError(message: string): void {
    // 隐藏 canvas
    this.canvas.style.display = 'none';

    // 创建错误提示元素
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      color: #333;
      padding: 20px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const icon = document.createElement('div');
    icon.textContent = '⚠️';
    icon.style.cssText = 'font-size: 48px; margin-bottom: 16px;';

    const title = document.createElement('div');
    title.textContent = 'WebGPU 不可用';
    title.style.cssText = 'font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #2c3e50;';

    const messageDiv = document.createElement('pre');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      font-size: 13px;
      line-height: 1.6;
      color: #555;
      background: white;
      padding: 16px;
      border-radius: 4px;
      border: 1px solid #ddd;
      max-width: 600px;
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0;
    `;

    errorDiv.appendChild(icon);
    errorDiv.appendChild(title);
    errorDiv.appendChild(messageDiv);

    this.container.appendChild(errorDiv);
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;

    window.removeEventListener("resize", this.onResize);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.worker.terminate();
  }

  setFontPx(fontPx: number): void {
    this.worker.postMessage({ type: "config", fontPx: clamp(fontPx, 8, 48) } satisfies RendererConfigMessage);
  }

  setTheme(theme: Partial<HexViewerTheme>): void {
    const workerTheme = mapThemeToWorker(theme);
    this.worker.postMessage({ type: "config", theme: workerTheme } satisfies RendererConfigMessage);
  }

  /**
   * 设置配置选项。
   * 新的配置会与原有配置合并,并立即生效重新渲染 canvas。
   * @param options 要更新的配置选项(部分配置)
   */
  setOptions(options: Partial<HexViewerOptions>): void {
    // 合并新配置到当前配置
    this.currentOptions = { ...this.currentOptions, ...options };

    // 构造配置消息
    const msg: RendererConfigMessage = {
      type: "config",
    };

    // 处理 fontPx
    if (options.fontPx !== undefined) {
      msg.fontPx = clamp(options.fontPx, 8, 48);
    }

    // 处理主题配置
    if (options.themePreset !== undefined || options.theme !== undefined) {
      // 重新解析完整主题(基于当前配置)
      const resolvedTheme = resolveTheme(this.currentOptions.themePreset, this.currentOptions.theme);
      const workerTheme = mapThemeToWorker(resolvedTheme);
      msg.theme = workerTheme;
    }

    // 处理其他配置选项
    if (options.scrollBarWidthPx !== undefined) {
      msg.scrollBarWidthPx = options.scrollBarWidthPx;
    }
    if (options.minBytesPerRow !== undefined) {
      msg.minBytesPerRow = options.minBytesPerRow;
    }
    if (options.addressGapChars !== undefined) {
      msg.addressGapChars = options.addressGapChars;
    }
    if (options.hexGapChars !== undefined) {
      msg.hexGapChars = options.hexGapChars;
    }
    if (options.sectionGapChars !== undefined) {
      msg.sectionGapChars = options.sectionGapChars;
    }

    // 发送配置更新消息给 Worker
    this.worker.postMessage(msg);

    // 如果提供了新的数据,也更新数据
    if (options.data !== undefined) {
      this.setData(options.data);
    }
  }

  /**
   * 设置要渲染的内容。
   * - 字符串会通过 UTF-8 编码为字节；
   * - Uint8Array 直接使用；
   * - 对象/数组等会先 JSON.stringify 后再编码为字节。
   */
  setData(data: string | Uint8Array | object | unknown[]): void {
    let bytes: Uint8Array;

    if (data instanceof Uint8Array) {
      // Uint8Array 直接使用
      bytes = data;
    } else if (typeof data === "string") {
      // 字符串直接编码
      const encoder = new TextEncoder();
      bytes = encoder.encode(data);
    } else if (data !== null && typeof data === "object") {
      // 对象/数组序列化为 JSON 字符串后编码
      const encoder = new TextEncoder();
      const jsonStr = JSON.stringify(data, null, 2);
      bytes = encoder.encode(jsonStr);
    } else {
      // 其他类型转为字符串后编码
      const encoder = new TextEncoder();
      bytes = encoder.encode(String(data));
    }

    // 使用 slice 创建独立的 ArrayBuffer，作为可转移对象发送给 Worker
    const buffer = bytes.buffer.slice(0) as ArrayBufferLike;
    const msg: RendererDataMessage = {
      type: "data",
      buffer,
    };
    this.worker.postMessage(msg, [buffer]);
  }
}

export function createHexViewer(el: HTMLElement | Element, options: HexViewerOptions = {}): HexViewer {
  return new HexViewer(el, options);
}
