export type HexViewerTheme = {
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

export type HexViewerOptions = {
  /** Font size in CSS pixels. The renderer will clamp to [8, 48]. */
  fontPx?: number;

  /** Override theme colors. */
  theme?: Partial<HexViewerTheme>;

  /** Width of the in-canvas scrollbar in device pixels. */
  scrollBarWidthPx?: number;

  /** Minimum bytes per row for the hex grid. */
  minBytesPerRow?: number;
};

type RendererInitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  dpr: number;
  fontPx?: number;
  theme?: Partial<HexViewerTheme>;
  scrollBarWidthPx?: number;
  minBytesPerRow?: number;
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
  theme?: Partial<HexViewerTheme>;
};

type MainToWorkerMessage =
  | RendererInitMessage
  | RendererResizeMessage
  | RendererWheelMessage
  | RendererPointerMessage
  | RendererKeyMessage
  | RendererConfigMessage;

type WorkerToMainMessage =
  | { type: "ready" }
  | { type: "error"; message: string };

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

function workerUrl(): URL {
  let url = new URL("./renderer.worker.ts", import.meta.url);
  if (url.protocol === "file:") {
    url = new URL("./renderer.worker.ts", window.location.href);
  }
  return url;
}


/**
 * HexViewer is a self-contained renderer bound to a user-provided canvas.
 * Rendering happens in a Worker using WebGPU + OffscreenCanvas.
 */
export class HexViewer {
  readonly canvas: HTMLCanvasElement;

  private worker: Worker;
  private resizeObserver: ResizeObserver | null = null;
  private disposed = false;

  private readonly onResize: () => void;
  private readonly onWheel: (e: WheelEvent) => void;
  private readonly onPointerDown: (e: PointerEvent) => void;
  private readonly onPointerMove: (e: PointerEvent) => void;
  private readonly onPointerUp: (e: PointerEvent) => void;
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onKeyUp: (e: KeyboardEvent) => void;

  constructor(canvas: HTMLCanvasElement, options: HexViewerOptions = {}) {
    this.canvas = canvas;
    this.canvas.tabIndex = this.canvas.tabIndex || 0;

    const offscreen = canvas.transferControlToOffscreen();
    this.worker = new Worker(workerUrl(), { type: "module" });

    this.worker.onmessage = (ev: MessageEvent<WorkerToMainMessage>) => {
      if (ev.data.type === "error") {
        console.error(ev.data.message);
      }
    };

    const size = getCanvasSize(canvas);
    const initMsg: RendererInitMessage = {
      type: "init",
      canvas: offscreen,
      width: size.width,
      height: size.height,
      dpr: size.dpr,
      fontPx: options.fontPx,
      theme: options.theme,
      scrollBarWidthPx: options.scrollBarWidthPx,
      minBytesPerRow: options.minBytesPerRow,
    };
    this.worker.postMessage(initMsg, [offscreen]);

    this.onResize = () => {
      if (this.disposed) return;
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
      this.resizeObserver.observe(this.canvas);
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
    this.worker.postMessage({ type: "config", theme } satisfies RendererConfigMessage);
  }
}

export function createHexViewer(canvas: HTMLCanvasElement, options: HexViewerOptions = {}): HexViewer {
  return new HexViewer(canvas, options);
}
