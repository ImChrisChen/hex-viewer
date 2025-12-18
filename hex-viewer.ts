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

// 创建 HexViewer 时的配置选项
export type HexViewerOptions = {
  /** 字体大小（CSS 像素），渲染器内部会限制在 [8, 48] 范围。 */
  fontPx?: number;

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
  data?: string | Uint8Array;
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
  // 运行时配置更新中的主题字段，使用 Worker 端的主题类型
  theme?: Partial<WorkerHexViewerTheme>;
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
  | { type: "error"; message: string };

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

// 构造 renderer.worker.ts 的 URL，兼容 file: 协议（本地开发场景）
function workerUrl(): URL {
  let url = new URL("./renderer.worker.ts", import.meta.url);
  if (url.protocol === "file:") {
    url = new URL("./renderer.worker.ts", window.location.href);
  }
  return url;
}

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

// 将对外的 HexViewerTheme（十六进制字符串）映射为 Worker 使用的浮点主题对象
function mapThemeToWorker(theme?: Partial<HexViewerTheme>): Partial<WorkerHexViewerTheme> | undefined {
  if (!theme) return undefined;
  const result: Partial<WorkerHexViewerTheme> = {};

  const assign = (key: keyof WorkerHexViewerTheme, value: string | undefined) => {
    if (typeof value !== "string") return;
    const rgba = hexToRgbaFloats(value);
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

  private readonly onResize: () => void;
  private readonly onWheel: (e: WheelEvent) => void;
  private readonly onPointerDown: (e: PointerEvent) => void;
  private readonly onPointerMove: (e: PointerEvent) => void;
  private readonly onPointerUp: (e: PointerEvent) => void;
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onKeyUp: (e: KeyboardEvent) => void;

  constructor(el: HTMLElement | Element, options: HexViewerOptions = {}) {

    this.container = el;

    // 创建并配置 canvas 元素
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    el.appendChild(canvas);

    this.canvas = canvas;
    this.canvas.tabIndex = this.canvas.tabIndex || 0;

    const offscreen = canvas.transferControlToOffscreen();
    this.worker = new Worker(workerUrl(), { type: "module" });

    this.worker.onmessage = (ev: MessageEvent<WorkerToMainMessage>) => {
      if (ev.data.type === "error") {
        console.error(ev.data.message);
      }
    };

    // 初始化时根据当前 canvas 尺寸和配置构造一条 init 消息给 Worker
    const size = getCanvasSize(canvas);
    const workerTheme = mapThemeToWorker(options.theme);
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
   * 设置要渲染的内容。
   * - 字符串会通过 UTF-8 编码为字节；
   * - Uint8Array 会被复制一份后发送给 Worker。
   */
  setData(data: string | Uint8Array): void {
    let bytes: Uint8Array;
    if (typeof data === "string") {
      const encoder = new TextEncoder();
      bytes = encoder.encode(data);
    } else {
      // 拷贝一份，避免后续对原数组的修改影响到 Worker 端
      // bytes = new Uint8Array(data);
      bytes = data
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

export function createHexViewer(canvas: HTMLCanvasElement, options: HexViewerOptions = {}): HexViewer {
  return new HexViewer(canvas, options);
}
