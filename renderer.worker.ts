type InitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  dpr: number;
  fontPx?: number;
  theme?: Partial<HexViewerTheme>;
  scrollBarWidthPx?: number;
  minBytesPerRow?: number;
  addressGapChars?: number;
  hexGapChars?: number;
  sectionGapChars?: number;
};

type ResizeMessage = {
  type: "resize";
  width: number;
  height: number;
  dpr: number;
};

type WheelMessage = {
  type: "wheel";
  deltaX: number;
  deltaY: number;
  ctrlKey: boolean;
  shiftKey: boolean;
};

type PointerMessage = {
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

type KeyMessage = {
  type: "key";
  phase: "down" | "up";
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

type MainToWorkerMessage =
  | InitMessage
  | ResizeMessage
  | WheelMessage
  | PointerMessage
  | KeyMessage
  | ConfigMessage;
// data 消息类型在主线程定义中通过联合类型扩展，这里使用类型守卫按需处理。

type WorkerToMainMessage =
  | { type: "ready" }
  | { type: "error"; message: string };

/** Colors are expressed as linear-ish RGBA floats in [0,1]. */
type HexViewerTheme = {
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

/** Runtime configuration updates from the main thread. */
type ConfigMessage = {
  type: "config";
  fontPx?: number;
  theme?: Partial<HexViewerTheme>;
};

const defaultTheme: HexViewerTheme = {
  background: [0.06, 0.06, 0.07, 1],
  text: [0.85, 0.85, 0.86, 1],
  address: [0.55, 0.72, 0.78, 1],
  dim: [0.55, 0.55, 0.56, 1],
  selectionBg: [0.16, 0.36, 0.78, 1],
  selectionFg: [0.97, 0.97, 0.98, 1],
  scrollTrack: [0.10, 0.10, 0.12, 1],
  scrollThumb: [0.22, 0.22, 0.25, 1],
  scrollThumbActive: [0.35, 0.35, 0.38, 1],
};

function mergeTheme(base: HexViewerTheme, patch?: Partial<HexViewerTheme>): HexViewerTheme {
  if (!patch) return base;
  return {
    background: patch.background ?? base.background,
    text: patch.text ?? base.text,
    address: patch.address ?? base.address,
    dim: patch.dim ?? base.dim,
    selectionBg: patch.selectionBg ?? base.selectionBg,
    selectionFg: patch.selectionFg ?? base.selectionFg,
    scrollTrack: patch.scrollTrack ?? base.scrollTrack,
    scrollThumb: patch.scrollThumb ?? base.scrollThumb,
    scrollThumbActive: patch.scrollThumbActive ?? base.scrollThumbActive,
  };
}

function layout(
  addrDigits: number,
  bytesPerRow: number,
  addressGapChars: number,
  hexGapChars: number,
  sectionGapChars: number,
): {
  addrChars: number;
  hexStartChar: number;
  asciiStartChar: number;
} {
  // Layout is expressed in monospace "character columns".
  const addrChars = addrDigits + 1;
  const hexStartChar = addrChars + addressGapChars;
  const perByteChars = 2 + hexGapChars;
  const asciiStartChar = hexStartChar + perByteChars * bytesPerRow + sectionGapChars;
  return { addrChars, hexStartChar, asciiStartChar };
}

function post(msg: WorkerToMainMessage): void {
  (self as DedicatedWorkerGlobalScope).postMessage(msg);
}

type Glyph = {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function hexUpperByte(b: number): string {
  const s = b.toString(16).toUpperCase();
  return s.length === 1 ? `0${s}` : s;
}

function bytesPerRowForWidth(
  pxWidth: number,
  cellW: number,
  addrDigits: number,
  scrollBarWidthPx: number,
  minBytesPerRow: number,
  addressGapChars: number,
  hexGapChars: number,
  sectionGapChars: number,
): number {
  const contentPx = Math.max(1, pxWidth - scrollBarWidthPx);
  const contentChars = Math.max(1, Math.floor(contentPx / cellW));

  const addrChars = addrDigits + 1;
  const baseChars = addrChars + addressGapChars + sectionGapChars;
  const perByteChars = 2 + hexGapChars + 1; // two hex chars + gap + one ASCII char
  const max = Math.floor((contentChars - baseChars) / perByteChars);
  return clamp(max, Math.max(1, Math.floor(minBytesPerRow)), 1024);
}

function addressDigitsForMaxOffset(maxOffset: number): 8 | 16 {
  if (maxOffset <= 0xffffffff) return 8;
  return 16;
}

function buildGlyphSet(): string[] {
  const set = new Set<string>();

  for (let c = 32; c <= 126; c++) {
    set.add(String.fromCharCode(c));
  }

  set.add("·");
  set.add("\t");
  set.delete("\t");

  return Array.from(set);
}

function createGlyphAtlas(
  fontCss: string,
  cellW: number,
  cellH: number,
  glyphs: string[],
): {
  map: Map<string, Glyph>;
  rgba: Uint8Array;
  width: number;
  height: number;
} {
  const cols = 16;
  const rows = Math.ceil(glyphs.length / cols);
  const width = cols * cellW;
  const height = rows * cellH;

  const c = new OffscreenCanvas(width, height);
  const ctx = c.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) {
    throw new Error("Failed to create 2D context for glyph atlas.");
  }

  ctx.clearRect(0, 0, width, height);
  ctx.font = fontCss;
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  const map = new Map<string, Glyph>();
  for (let i = 0; i < glyphs.length; i++) {
    const ch = glyphs[i]!;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cellW;
    const y = row * cellH;

    ctx.fillText(ch, x + cellW / 2, y + cellH / 2);

    map.set(ch, {
      u0: x / width,
      v0: y / height,
      u1: (x + cellW) / width,
      v1: (y + cellH) / height,
    });
  }

  const img = ctx.getImageData(0, 0, width, height);
  const rgba = new Uint8Array(img.data.buffer.slice(0));
  return { map, rgba, width, height };
}

function defaultFontCss(px: number): string {
  return `${px}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
}

function measureCell(fontPx: number): { cellW: number; cellH: number; fontCss: string } {
  const fontCss = defaultFontCss(fontPx);
  const c = new OffscreenCanvas(32, 32);
  const ctx = c.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) {
    throw new Error("Failed to create 2D context for font metrics.");
  }
  ctx.font = fontCss;
  const m = ctx.measureText("M");
  const w = Math.max(1, Math.round(m.width));
  const h = Math.max(
    1,
    Math.ceil((m.actualBoundingBoxAscent || fontPx) + (m.actualBoundingBoxDescent || Math.ceil(fontPx * 0.25))),
  );

  const cellW = Math.max(8, w);
  const cellH = Math.max(12, Math.ceil(h * 1.25));
  return { cellW, cellH, fontCss };
}

class Renderer {
  // WebGPU 相关画布、上下文和设备对象
  private canvas: OffscreenCanvas | null = null;
  private ctx: GPUCanvasContext | null = null;
  private device: GPUDevice | null = null;
  private format: GPUTextureFormat | null = null;

  // 渲染管线和顶点/实例缓冲区
  private pipeline: GPURenderPipeline | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private uniformBuf: GPUBuffer | null = null;
  private quadBuf: GPUBuffer | null = null;
  private instanceBuf: GPUBuffer | null = null;
  private instanceCapacityFloats = 0;
  private instanceData = new Float32Array(0);

  // 字形纹理图集和采样器
  private glyphMap: Map<string, Glyph> | null = null;
  private atlasTexture: GPUTexture | null = null;
  private atlasSampler: GPUSampler | null = null;

  // 字体与单元格尺寸
  private fontPx = 14;
  private cellW = 8;
  private cellH = 16;
  private fontCss = "";

  // 滚动条宽度、每行最小字节数和主题配置
  private scrollBarWidthPx = 20;
  private minBytesPerRow = 4;
  private theme: HexViewerTheme = defaultTheme;

  // 当前每行字节数与地址显示位数
  private bytesPerRow = 16;
  private addrDigits: 8 | 16 = 8;
  // 各列之间的字符间距（以“字符列数”为单位）
  private addressGapChars = 1;
  private hexGapChars = 1;
  private sectionGapChars = 2;
  // 垂直滚动偏移（像素）
  private scrollY = 0;

  // 选择区锚点及起止（按字节索引）
  private selAnchor: number | null = null;
  private selStart: number | null = null;
  private selEnd: number | null = null;

  // 滚动条拖拽状态
  private scrollDragActive = false;
  private scrollDragStartY = 0;
  private scrollDragStartScrollY = 0;

  // 当前总字节数（初始为 0，需通过 setData 设置数据）
  private totalBytes = 0;

  // 实际渲染的数据缓冲区（如果提供，则优先使用数据而非 syntheticByte）
  private data: Uint8Array | null = null;

  // 画布像素尺寸
  private width = 1;
  private height = 1;

  // 渲染循环控制
  private running = false;
  private rafId: number | null = null;

  // 初始化 WebGPU 并构建初始资源
  async init(msg: InitMessage): Promise<void> {
    this.canvas = msg.canvas;
    this.resize(msg.width, msg.height);

    const gpu = (self as unknown as DedicatedWorkerGlobalScope).navigator.gpu;

    if (!gpu) {
      throw new Error("WebGPU is not available in this environment.");
    }

    const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) {
      throw new Error("Failed to acquire a WebGPU adapter.");
    }

    this.device = await adapter.requestDevice({});

    const ctx = this.canvas.getContext("webgpu") as GPUCanvasContext | null;
    if (!ctx) {
      throw new Error("Failed to get 'webgpu' context from OffscreenCanvas.");
    }

    this.ctx = ctx;
    this.format = gpu.getPreferredCanvasFormat();

    if (typeof msg.fontPx === "number" && Number.isFinite(msg.fontPx)) {
      this.fontPx = clamp(Math.floor(msg.fontPx), 8, 48);
    }

    if (typeof msg.scrollBarWidthPx === "number" && Number.isFinite(msg.scrollBarWidthPx)) {
      this.scrollBarWidthPx = clamp(Math.floor(msg.scrollBarWidthPx), 8, 64);
    }

    if (typeof msg.minBytesPerRow === "number" && Number.isFinite(msg.minBytesPerRow)) {
      this.minBytesPerRow = clamp(Math.floor(msg.minBytesPerRow), 1, 1024);
    }

    this.theme = mergeTheme(defaultTheme, msg.theme);

    // 如果主线程传入了列间距配置，则覆盖默认值
    if (typeof msg.addressGapChars === "number") {
      this.addressGapChars = clamp(Math.floor((msg as any).addressGapChars), 0, 8);
    }
    if (typeof msg.hexGapChars === "number") {
      this.hexGapChars = clamp(Number(msg.hexGapChars), 0, 8);
    }
    if (typeof msg.sectionGapChars === "number") {
      this.sectionGapChars = clamp(Math.floor((msg as any).sectionGapChars), 0, 16);
    }

    const { cellW, cellH, fontCss } = measureCell(this.fontPx);
    this.cellW = cellW;
    this.cellH = cellH;
    this.fontCss = fontCss;

    this.addrDigits = addressDigitsForMaxOffset(this.totalBytes - 1);
    this.bytesPerRow = bytesPerRowForWidth(
      this.width,
      this.cellW,
      this.addrDigits,
      this.scrollBarWidthPx,
      this.minBytesPerRow,
      this.addressGapChars,
      this.hexGapChars,
      this.sectionGapChars,
    );

    this.configure();
    this.buildResources();

    this.running = true;
    this.frame();
  }

  // 处理窗口/画布尺寸变化
  resize(width: number, height: number): void {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));

    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    if (this.ctx && this.device && this.format) {
      this.configure();
      this.addrDigits = addressDigitsForMaxOffset(this.totalBytes - 1);
      this.bytesPerRow = bytesPerRowForWidth(
        this.width,
        this.cellW,
        this.addrDigits,
        this.scrollBarWidthPx,
        this.minBytesPerRow,
        this.addressGapChars,
        this.hexGapChars,
        this.sectionGapChars,
      );
      this.clampScroll();
    }
  }

  private configure(): void {
    if (!this.ctx || !this.device || !this.format) return;

    this.ctx.configure({
      device: this.device,
      format: this.format,
      alphaMode: "opaque",
    });
  }

  // 根据当前字体、主题等重新构建 GPU 资源（纹理、缓冲、管线等）
  private buildResources(): void {
    if (!this.device || !this.ctx || !this.format) return;

    this.pipeline = null;
    this.bindGroup = null;
    this.uniformBuf = null;
    this.quadBuf = null;
    this.instanceBuf = null;
    this.instanceCapacityFloats = 0;
    this.instanceData = new Float32Array(0);
    this.glyphMap = null;
    this.atlasTexture = null;
    this.atlasSampler = null;

    // 构建要支持的字形集合，并根据字体生成纹理图集
    const glyphs = buildGlyphSet();
    const atlas = createGlyphAtlas(this.fontCss, this.cellW, this.cellH, glyphs);
    this.glyphMap = atlas.map;

    const atlasRgba = atlas.rgba as unknown as ArrayBufferView<ArrayBuffer>;

    this.atlasTexture = this.device.createTexture({
      size: [atlas.width, atlas.height, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.device.queue.writeTexture(
      { texture: this.atlasTexture },
      atlasRgba,
      { bytesPerRow: atlas.width * 4 },
      { width: atlas.width, height: atlas.height, depthOrArrayLayers: 1 },
    );

    this.atlasSampler = this.device.createSampler({
      magFilter: "nearest",
      minFilter: "nearest",
      mipmapFilter: "nearest",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });

    this.uniformBuf = this.device.createBuffer({
      size: 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const quadVerts = new Float32Array([
      0, 0, 0, 0,
      1, 0, 1, 0,
      0, 1, 0, 1,
      0, 1, 0, 1,
      1, 0, 1, 0,
      1, 1, 1, 1,
    ]);

    this.quadBuf = this.device.createBuffer({
      size: quadVerts.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.quadBuf, 0, quadVerts);

    // WGSL 着色器：顶点阶段将实例化的矩形映射到 NDC，片段阶段用字形 alpha 做前景/背景混合
    const shader = this.device.createShaderModule({
      code: `
struct Uniforms {
  viewport: vec2<f32>,
  _pad: vec2<f32>,
};

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var s: sampler;
@group(0) @binding(2) var t: texture_2d<f32>;

struct VSIn {
  @location(0) aPos: vec2<f32>,
  @location(1) aUv: vec2<f32>,

  @location(2) iPos: vec2<f32>,
  @location(3) iSize: vec2<f32>,
  @location(4) iUv0: vec2<f32>,
  @location(5) iUv1: vec2<f32>,
  @location(6) iFg: vec4<f32>,
  @location(7) iBg: vec4<f32>,
};

struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) fg: vec4<f32>,
  @location(2) bg: vec4<f32>,
};

@vertex
fn vsMain(in: VSIn) -> VSOut {
  var out: VSOut;
  let px = in.iPos + in.aPos * in.iSize;
  let ndcX = (px.x / u.viewport.x) * 2.0 - 1.0;
  let ndcY = 1.0 - (px.y / u.viewport.y) * 2.0;
  out.pos = vec4<f32>(ndcX, ndcY, 0.0, 1.0);

  out.uv = mix(in.iUv0, in.iUv1, in.aUv);
  out.fg = in.iFg;
  out.bg = in.iBg;
  return out;
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  let a = textureSample(t, s, in.uv).a;
  return in.bg * (1.0 - a) + in.fg * a;
}
`,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shader,
        entryPoint: "vsMain",
        buffers: [
          {
            arrayStride: 16,
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x2" },
              { shaderLocation: 1, offset: 8, format: "float32x2" },
            ],
          },
          {
            arrayStride: 64,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 2, offset: 0, format: "float32x2" },
              { shaderLocation: 3, offset: 8, format: "float32x2" },
              { shaderLocation: 4, offset: 16, format: "float32x2" },
              { shaderLocation: 5, offset: 24, format: "float32x2" },
              { shaderLocation: 6, offset: 32, format: "float32x4" },
              { shaderLocation: 7, offset: 48, format: "float32x4" },
            ],
          },
        ],
      },
      fragment: {
        module: shader,
        entryPoint: "fsMain",
        targets: [{ format: this.format }],
      },
      primitive: { topology: "triangle-list" },
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuf } },
        { binding: 1, resource: this.atlasSampler },
        { binding: 2, resource: this.atlasTexture.createView() },
      ],
    });

    this.ensureInstanceCapacity(8192);
  }

  // 整个内容（所有字节行）对应的总像素高度
  private contentHeightPx(): number {
    return Math.ceil(this.totalBytes / this.bytesPerRow) * this.cellH;
  }

  // 最大允许滚动位置（确保内容刚好滚完）
  private maxScrollY(): number {
    return Math.max(0, this.contentHeightPx() - this.height);
  }

  // 限制 scrollY 在合法范围内
  private clampScroll(): void {
    this.scrollY = clamp(this.scrollY, 0, this.maxScrollY());
  }

  // 根据内容高度和视口高度计算滚动条轨道和滑块几何信息
  private scrollBarMetrics(): {
    x: number;
    y: number;
    w: number;
    h: number;
    thumbY: number;
    thumbH: number;
  } {
    const w = this.scrollBarWidthPx;
    const h = this.height;
    const x = this.width - w;
    const y = 0;
    const contentH = this.contentHeightPx();
    const viewH = this.height;

    if (contentH <= viewH) {
      return { x, y, w, h, thumbY: 0, thumbH: h };
    }

    const minThumb = 24;
    const thumbH = Math.max(minThumb, Math.floor((viewH / contentH) * h));
    const trackH = h - thumbH;
    const thumbY = Math.floor((this.scrollY / (contentH - viewH)) * trackH);
    return { x, y, w, h, thumbY, thumbH };
  }

  // 命中测试：判断一个像素位置是否位于滚动条区域及其滑块上
  private hitTestScrollBar(px: number, py: number): { hit: boolean; onThumb: boolean } {
    // 追加滚动条的轨道和滑块背景
    const sb = this.scrollBarMetrics();
    if (px < sb.x || px > sb.x + sb.w || py < 0 || py > sb.h) {
      return { hit: false, onThumb: false };
    }
    const onThumb = py >= sb.thumbY && py <= sb.thumbY + sb.thumbH;
    return { hit: true, onThumb };
  }

  // 根据滑块的 Y 坐标反推 scrollY
  private setScrollFromThumbY(thumbY: number): void {
    const sb = this.scrollBarMetrics();
    const contentH = this.contentHeightPx();
    const viewH = this.height;
    if (contentH <= viewH) {
      this.scrollY = 0;
      return;
    }
    const trackH = sb.h - sb.thumbH;
    const t = trackH <= 0 ? 0 : clamp(thumbY / trackH, 0, 1);
    this.scrollY = t * (contentH - viewH);
    this.clampScroll();
  }

  // 从屏幕坐标（像素）反算出对应的字节索引（十六进制区或 ASCII 区）
  private byteIndexAt(px: number, py: number): number | null {
    const l = layout(this.addrDigits, this.bytesPerRow, this.addressGapChars, this.hexGapChars, this.sectionGapChars);

    const row = Math.floor((py + this.scrollY) / this.cellH);
    if (row < 0) return null;
    const base = row * this.bytesPerRow;
    if (base >= this.totalBytes) return null;

    const charX = Math.floor(px / this.cellW);

    if (charX >= l.hexStartChar && charX < l.hexStartChar + this.bytesPerRow * 3) {
      const rel = charX - l.hexStartChar;
      const b = Math.floor(rel / 3);
      const sub = rel % 3;
      if (sub === 2) {
        const idx = base + b;
        return idx < this.totalBytes ? idx : null;
      }
      const idx = base + b;
      return idx < this.totalBytes ? idx : null;
    }

    if (charX >= l.asciiStartChar && charX < l.asciiStartChar + this.bytesPerRow) {
      const b = charX - l.asciiStartChar;
      const idx = base + b;
      return idx < this.totalBytes ? idx : null;
    }

    return null;
  }

  // 确保实例缓冲区容量足够渲染指定数量的实例
  private ensureInstanceCapacity(instanceCount: number): void {
    if (!this.device) return;
    const floatsPerInstance = 16;
    const neededFloats = instanceCount * floatsPerInstance;
    if (this.instanceCapacityFloats >= neededFloats && this.instanceBuf) return;

    this.instanceCapacityFloats = Math.max(neededFloats, this.instanceCapacityFloats * 2, 16 * 2048);
    this.instanceData = new Float32Array(this.instanceCapacityFloats);

    this.instanceBuf = this.device.createBuffer({
      size: this.instanceData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  }

  // 将一个字符实例写入实例缓冲（位置、UV、前景/背景颜色）
  private putChar(
    out: Float32Array,
    floatIndex: number,
    x: number,
    y: number,
    ch: string,
    fg: [number, number, number, number],
    bg: [number, number, number, number],
  ): number {
    const gm = this.glyphMap;
    if (!gm) return floatIndex;
    const g = gm.get(ch) ?? gm.get("·") ?? gm.get(" ");
    if (!g) return floatIndex;

    out[floatIndex + 0] = x;
    out[floatIndex + 1] = y;
    out[floatIndex + 2] = this.cellW;
    out[floatIndex + 3] = this.cellH;
    out[floatIndex + 4] = g.u0;
    out[floatIndex + 5] = g.v0;
    out[floatIndex + 6] = g.u1;
    out[floatIndex + 7] = g.v1;
    out[floatIndex + 8] = fg[0];
    out[floatIndex + 9] = fg[1];
    out[floatIndex + 10] = fg[2];
    out[floatIndex + 11] = fg[3];
    out[floatIndex + 12] = bg[0];
    out[floatIndex + 13] = bg[1];
    out[floatIndex + 14] = bg[2];
    out[floatIndex + 15] = bg[3];
    return floatIndex + 16;
  }

  // 用“空白字符”纹理绘制一个有背景色的矩形，用于背景块/滚动条等
  private putRect(
    out: Float32Array,
    floatIndex: number,
    x: number,
    y: number,
    w: number,
    h: number,
    color: [number, number, number, number],
  ): number {
    const gm = this.glyphMap;
    if (!gm) return floatIndex;
    const g = gm.get(" ") ?? gm.get("·");
    if (!g) return floatIndex;

    out[floatIndex + 0] = x;
    out[floatIndex + 1] = y;
    out[floatIndex + 2] = w;
    out[floatIndex + 3] = h;
    out[floatIndex + 4] = g.u0;
    out[floatIndex + 5] = g.v0;
    out[floatIndex + 6] = g.u1;
    out[floatIndex + 7] = g.v1;
    out[floatIndex + 8] = 0;
    out[floatIndex + 9] = 0;
    out[floatIndex + 10] = 0;
    out[floatIndex + 11] = 0;
    out[floatIndex + 12] = color[0];
    out[floatIndex + 13] = color[1];
    out[floatIndex + 14] = color[2];
    out[floatIndex + 15] = color[3];
    return floatIndex + 16;
  }

  // 根据偏移生成一个可重复的伪随机字节，用于演示数据
  private syntheticByte(offset: number): number {
    // 如果有真实数据，则优先使用真实数据
    if (this.data && offset >= 0 && offset < this.data.length) {
      return this.data[offset]!;
    }
    const x = (offset * 1103515245 + 12345) >>> 0;
    return (x >>> 16) & 0xff;
  }

  // 生成当前帧要绘制的所有实例数据，并返回实例数量
  private drawHexView(): number {
    if (!this.glyphMap) return 0;

    const bg0 = this.theme.background;
    const fg0 = this.theme.text;
    const fgAddr = this.theme.address;
    const fgDim = this.theme.dim;
    const selBg = this.theme.selectionBg;
    const selFg = this.theme.selectionFg;

    // 视口中可见的行数（多渲染两行做缓冲，避免滚动抖动）
    const rowsVisible = Math.ceil(this.height / this.cellH) + 2;
    const firstRow = Math.max(0, Math.floor(this.scrollY / this.cellH));
    const yOffset = -(this.scrollY - firstRow * this.cellH);

    const addrChars = this.addrDigits + 1;
    const perByteChars = 2 + this.hexGapChars + 1; // 两个 hex 字符 + hex 间隙 + 一个 ASCII 字符
    const baseChars = addrChars + this.addressGapChars + this.sectionGapChars;
    const approxCharsPerLine = baseChars + perByteChars * this.bytesPerRow;
    const maxInstances = rowsVisible * (approxCharsPerLine + 8);
    this.ensureInstanceCapacity(maxInstances);

    const out = this.instanceData;
    let f = 0;

    const l = layout(this.addrDigits, this.bytesPerRow, this.addressGapChars, this.hexGapChars, this.sectionGapChars);

    const contentWidthPx = this.width - this.scrollBarWidthPx;

    for (let r = 0; r < rowsVisible; r++) {
      const row = firstRow + r;
      const baseOffset = row * this.bytesPerRow;
      if (baseOffset >= this.totalBytes) break;

      const y = yOffset + r * this.cellH;
      if (y < -this.cellH || y > this.height + this.cellH) continue;

      // 行首地址列（例如 00000010:）
      let addr = baseOffset.toString(16).toUpperCase();
      while (addr.length < this.addrDigits) addr = `0${addr}`;
      addr = `${addr}:`;

      for (let i = 0; i < addr.length; i++) {
        const x = i * this.cellW;
        if (x >= contentWidthPx) break;
        f = this.putChar(out, f, x, y, addr[i]!, fgAddr, bg0);
      }

      // 地址列和十六进制列之间的间隙（addressGapChars 个空格）
      for (let i = 0; i < this.addressGapChars; i++) {
        const x = (addr.length + i) * this.cellW;
        if (x >= contentWidthPx) break;
        f = this.putChar(out, f, x, y, " ", fg0, bg0);
      }

      // 绘制十六进制列（每字节两个 hex 字符 + hexGapChars 个空格）
      for (let b = 0; b < this.bytesPerRow; b++) {
        const off = baseOffset + b;
        const v = off < this.totalBytes ? this.syntheticByte(off) : 0;
        const s = hexUpperByte(v);
        const hx = (l.hexStartChar + b * (2 + this.hexGapChars)) * this.cellW;
        if (hx >= contentWidthPx) break;
        // 选中范围内的字节需要高亮显示
        const isSel =
          this.selStart !== null &&
          this.selEnd !== null &&
          off >= this.selStart &&
          off <= this.selEnd;
        // Selection highlights both hex and ASCII columns for the same byte range.
        const fg = isSel ? selFg : fg0;
        const bg = isSel ? selBg : bg0;
        f = this.putChar(out, f, hx + 0 * this.cellW, y, s[0]!, fg, bg);
        f = this.putChar(out, f, hx + 1 * this.cellW, y, s[1]!, fg, bg);
        // 分隔空格不使用选中背景，只使用普通背景，以避免视觉上选中块偏右
        for (let i = 0; i < this.hexGapChars; i++) {
          f = this.putChar(out, f, hx + (2 + i) * this.cellW, y, " ", fg0, bg0);
        }
      }

      // 十六进制列和 ASCII 列之间的间隙（sectionGapChars 个空格）
      for (let i = 0; i < this.sectionGapChars; i++) {
        const x = (l.asciiStartChar - this.sectionGapChars + i) * this.cellW;
        if (x >= contentWidthPx) break;
        f = this.putChar(out, f, x, y, " ", fgDim, bg0);
      }

      for (let b = 0; b < this.bytesPerRow; b++) {
        const off = baseOffset + b;
        const v = off < this.totalBytes ? this.syntheticByte(off) : 0;
        const ch = v >= 32 && v <= 126 ? String.fromCharCode(v) : ".";
        const x = (l.asciiStartChar + b) * this.cellW;
        if (x >= contentWidthPx) break;
        const isSel =
          this.selStart !== null &&
          this.selEnd !== null &&
          off >= this.selStart &&
          off <= this.selEnd;
        const fg = isSel ? selFg : fg0;
        const bg = isSel ? selBg : bg0;
        f = this.putChar(out, f, x, y, ch, fg, bg);
      }
    }

    const sb = this.scrollBarMetrics();
    const trackBg = this.theme.scrollTrack;
    const thumbBg = this.scrollDragActive ? this.theme.scrollThumbActive : this.theme.scrollThumb;

    f = this.putRect(out, f, sb.x, 0, sb.w, sb.h, trackBg);
    f = this.putRect(out, f, sb.x, sb.thumbY, sb.w, sb.thumbH, thumbBg);

    return f / 16;
  }

  // 安排下一帧渲染（优先使用 requestAnimationFrame，退化为 setTimeout）
  private scheduleNextFrame(): void {
    const g = self as unknown as { requestAnimationFrame?: (cb: () => void) => number };

    if (typeof g.requestAnimationFrame === "function") {
      this.rafId = g.requestAnimationFrame(() => this.frame());
      return;
    }

    this.rafId = self.setTimeout(() => this.frame(), 16);
  }

  // 单帧渲染逻辑：更新 uniform、写入实例数据并提交渲染命令
  private frame(): void {
    if (!this.running || !this.device || !this.ctx) return;
    if (!this.pipeline || !this.bindGroup || !this.uniformBuf || !this.quadBuf || !this.instanceBuf) {
      this.scheduleNextFrame();
      return;
    }

    const uniforms = new Float32Array([this.width, this.height, 0, 0]);
    this.device.queue.writeBuffer(this.uniformBuf, 0, uniforms);

    const instanceCount = this.drawHexView();
    if (instanceCount > 0) {
      this.device.queue.writeBuffer(this.instanceBuf, 0, this.instanceData.subarray(0, instanceCount * 16));
    }

    const encoder = this.device.createCommandEncoder();
    const view = this.ctx.getCurrentTexture().createView();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view,
          clearValue: { r: 0.06, g: 0.06, b: 0.07, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.quadBuf);
    pass.setVertexBuffer(1, this.instanceBuf);
    if (instanceCount > 0) {
      pass.draw(6, instanceCount, 0, 0);
    }
    pass.end();

    this.device.queue.submit([encoder.finish()]);

    this.scheduleNextFrame();
  }

  // 鼠标滚轮事件：根据 deltaY 更新垂直滚动位置
  onWheel(msg: WheelMessage): void {
    const speed = msg.shiftKey ? 3.0 : 1.0;
    this.scrollY += msg.deltaY * speed;
    this.clampScroll();
  }
  // 指针事件：处理滚动条拖拽和字节选择
  onPointer(msg: PointerMessage): void {
    if (msg.phase === "down") {
      if (msg.button !== 0) return;

      // 优先检测点击是否落在滚动条区域
      const hit = this.hitTestScrollBar(msg.x, msg.y);
      if (hit.hit) {
        const sb = this.scrollBarMetrics();
        if (hit.onThumb) {
          this.scrollDragActive = true;
          this.scrollDragStartY = msg.y;
          this.scrollDragStartScrollY = this.scrollY;
          return;
        }

        // 点击轨道空白区域时，将滑块居中对齐到点击位置
        const targetThumbY = msg.y - Math.floor(sb.thumbH / 2);
        this.setScrollFromThumbY(targetThumbY);
        return;
      }

      // 未点中滚动条时，尝试命中字节并建立新的选择区
      const idx = this.byteIndexAt(msg.x, msg.y);
      if (idx === null) {
        this.selAnchor = null;
        this.selStart = null;
        this.selEnd = null;
        return;
      }

      this.selAnchor = idx;
      this.selStart = idx;
      this.selEnd = idx;
      return;
    }

    if (msg.phase === "move") {
      if (this.scrollDragActive) {
        const sb = this.scrollBarMetrics();
        const contentH = this.contentHeightPx();
        const viewH = this.height;
        if (contentH > viewH) {
          const trackH = sb.h - sb.thumbH;
          const dy = msg.y - this.scrollDragStartY;
          const scrollDelta = trackH > 0 ? (dy / trackH) * (contentH - viewH) : 0;
          this.scrollY = this.scrollDragStartScrollY + scrollDelta;
          this.clampScroll();
        }
        return;
      }

      // 仅在有选择锚点且仍按下主键时更新选择范围
      if (this.selAnchor === null) return;
      if ((msg.buttons & 1) === 0) return;

      const idx = this.byteIndexAt(msg.x, msg.y);
      if (idx === null) return;
      const a = this.selAnchor;
      this.selStart = Math.min(a, idx);
      this.selEnd = Math.max(a, idx);
      return;
    }

    if (msg.phase === "up") {
      if (msg.button === 0) {
        this.scrollDragActive = false;
      }
      return;
    }
  }

  // 键盘事件预留，目前未处理
  onKey(_msg: KeyMessage): void { }

  // 应用运行时配置更新（字体大小、主题等），必要时重建 GPU 资源
  applyConfig(msg: ConfigMessage): void {
    let rebuild = false;

    if (typeof msg.fontPx === "number" && Number.isFinite(msg.fontPx)) {
      const next = clamp(Math.floor(msg.fontPx), 8, 48);
      if (next !== this.fontPx) {
        this.fontPx = next;

        const { cellW, cellH, fontCss } = measureCell(this.fontPx);
        this.cellW = cellW;
        this.cellH = cellH;
        this.fontCss = fontCss;

        this.addrDigits = addressDigitsForMaxOffset(this.totalBytes - 1);
        this.bytesPerRow = bytesPerRowForWidth(
          this.width,
          this.cellW,
          this.addrDigits,
          this.scrollBarWidthPx,
          this.minBytesPerRow,
          this.addressGapChars,
          this.hexGapChars,
          this.sectionGapChars,
        );
        this.clampScroll();
        rebuild = true;
      }
    }

    if (msg.theme) {
      this.theme = mergeTheme(this.theme, msg.theme);
    }

    if (rebuild) {
      this.buildResources();
    }
  }
}

const renderer = new Renderer();

(self as DedicatedWorkerGlobalScope).onmessage = (ev: MessageEvent<MainToWorkerMessage>) => {
  const msg = ev.data;

  if (msg.type === "init") {
    renderer
      .init(msg)
      .then(() => post({ type: "ready" }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        post({ type: "error", message });
      });
    return;
  }

  if (msg.type === "resize") {
    renderer.resize(msg.width, msg.height);
    return;
  }

  if (msg.type === "wheel") {
    renderer.onWheel(msg);
    return;
  }

  if (msg.type === "pointer") {
    renderer.onPointer(msg);
    return;
  }

  if (msg.type === "key") {
    renderer.onKey(msg);
    return;
  }

  if (msg.type === "config") {
    renderer.applyConfig(msg);
    return;
  }

  // data 消息：更新 Renderer 内部的数据缓冲和总字节数，供渲染使用
  if ((msg as any).type === "data" && (msg as any).buffer) {
    const buffer = (msg as any).buffer as ArrayBufferLike;
    const bytes = new Uint8Array(buffer);
    // 直接更新私有字段：实际渲染数据和总字节数
    (renderer as any).data = bytes;
    (renderer as any).totalBytes = bytes.length;
    // 更新地址位数和每行字节数以适配新数据长度
    (renderer as any).addrDigits = addressDigitsForMaxOffset(bytes.length > 0 ? bytes.length - 1 : 0);
    (renderer as any).bytesPerRow = bytesPerRowForWidth(
      (renderer as any).width,
      (renderer as any).cellW,
      (renderer as any).addrDigits,
      (renderer as any).scrollBarWidthPx,
      (renderer as any).minBytesPerRow,
      (renderer as any).addressGapChars,
      (renderer as any).hexGapChars,
      (renderer as any).sectionGapChars,
    );
    (renderer as any).clampScroll();
  }
};
