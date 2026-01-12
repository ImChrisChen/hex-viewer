import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createHexViewer, type HexViewerOptions, type HexViewerTheme, type ThemePreset } from '../hex-viewer';

export interface HexViewerProps {
  /** 要显示的十六进制数据 */
  data?: string | Uint8Array;
  /** 字体大小（CSS 像素） */
  fontPx?: number;
  /** 主题预设 */
  themePreset?: ThemePreset;
  /** 主题颜色覆盖 */
  theme?: Partial<HexViewerTheme>;
  /** 滚动条宽度（设备像素） */
  scrollBarWidthPx?: number;
  /** 每行最小字节数 */
  minBytesPerRow?: number;
  /** 地址列和十六进制列之间的字符间隙 */
  addressGapChars?: number;
  /** 十六进制字节之间的字符间隙 */
  hexGapChars?: number;
  /** 十六进制列和 ASCII 列之间的字符间隙 */
  sectionGapChars?: number;
  /** 容器类名 */
  className?: string;
  /** 容器样式 */
  style?: React.CSSProperties;
}

export interface HexViewerRef {
  /** 设置要渲染的数据 */
  setData: (data: string | Uint8Array) => void;
  /** 设置配置选项 */
  setOptions: (options: Partial<HexViewerOptions>) => void;
  /** 设置主题 */
  setTheme: (theme: Partial<HexViewerTheme>) => void;
  /** 设置字体大小 */
  setFontPx: (fontPx: number) => void;
}

/**
 * HexViewer React 组件
 * 
 * 一个高性能的 WebGPU 十六进制查看器组件。
 * 
 * @example
 * ```tsx
 * import { HexViewer } from '@imccc/hex-viewer-js/react';
 * 
 * function App() {
 *   const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
 *   return (
 *     <HexViewer
 *       data={data}
 *       themePreset="dark"
 *       fontPx={16}
 *       style={{ height: '400px' }}
 *     />
 *   );
 * }
 * ```
 */
export const HexViewer = forwardRef<HexViewerRef, HexViewerProps>(function HexViewer(
  {
    data,
    fontPx,
    themePreset,
    theme,
    scrollBarWidthPx,
    minBytesPerRow,
    addressGapChars,
    hexGapChars,
    sectionGapChars,
    className,
    style,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ReturnType<typeof createHexViewer> | null>(null);

  // 暴露实例方法给父组件
  useImperativeHandle(ref, () => ({
    setData: (data: string | Uint8Array) => {
      viewerRef.current?.setData(data);
    },
    setOptions: (options: Partial<HexViewerOptions>) => {
      viewerRef.current?.setOptions(options);
    },
    setTheme: (theme: Partial<HexViewerTheme>) => {
      viewerRef.current?.setTheme(theme);
    },
    setFontPx: (fontPx: number) => {
      viewerRef.current?.setFontPx(fontPx);
    },
  }), []);

  // 初始化和销毁
  useEffect(() => {
    if (!containerRef.current) return;

    const options: HexViewerOptions = {
      data,
      fontPx,
      themePreset,
      theme,
      scrollBarWidthPx,
      minBytesPerRow,
      addressGapChars,
      hexGapChars,
      sectionGapChars,
    };

    viewerRef.current = createHexViewer(containerRef.current, options);

    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
    // 只在挂载和卸载时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听 props 变化并更新配置
  useEffect(() => {
    if (!viewerRef.current) return;

    viewerRef.current.setOptions({
      fontPx,
      themePreset,
      theme,
      scrollBarWidthPx,
      minBytesPerRow,
      addressGapChars,
      hexGapChars,
      sectionGapChars,
    });
  }, [fontPx, themePreset, theme, scrollBarWidthPx, minBytesPerRow, addressGapChars, hexGapChars, sectionGapChars]);

  // 监听 data 变化
  useEffect(() => {
    if (!viewerRef.current || data === undefined) return;
    viewerRef.current.setData(data);
  }, [data]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
    />
  );
});

export default HexViewer;
