<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, type PropType } from 'vue';
import { createHexViewer, type HexViewerOptions, type HexViewerTheme, type ThemePreset } from '../hex-viewer';

type HexViewerInstance = ReturnType<typeof createHexViewer>;

const props = defineProps({
  /** 要显示的十六进制数据 */
  data: {
    type: [String, Object, Array] as PropType<string | Uint8Array | object | unknown[]>,
    default: undefined,
  },
  /** 字体大小（CSS 像素） */
  fontPx: {
    type: Number,
    default: undefined,
  },
  /** 主题预设 */
  themePreset: {
    type: String as PropType<ThemePreset>,
    default: undefined,
  },
  /** 主题颜色覆盖 */
  theme: {
    type: Object as PropType<Partial<HexViewerTheme>>,
    default: undefined,
  },
  /** 滚动条宽度（设备像素） */
  scrollBarWidthPx: {
    type: Number,
    default: undefined,
  },
  /** 每行最小字节数 */
  minBytesPerRow: {
    type: Number,
    default: undefined,
  },
  /** 地址列和十六进制列之间的字符间隙 */
  addressGapChars: {
    type: Number,
    default: undefined,
  },
  /** 十六进制字节之间的字符间隙 */
  hexGapChars: {
    type: Number,
    default: undefined,
  },
  /** 十六进制列和 ASCII 列之间的字符间隙 */
  sectionGapChars: {
    type: Number,
    default: undefined,
  },
});

const containerRef = ref<HTMLDivElement | null>(null);
let viewer: HexViewerInstance | null = null;

// 暴露方法给父组件
defineExpose({
  setData: (data: string | Uint8Array) => {
    viewer?.setData(data);
  },
  setOptions: (options: Partial<HexViewerOptions>) => {
    viewer?.setOptions(options);
  },
  setTheme: (theme: Partial<HexViewerTheme>) => {
    viewer?.setTheme(theme);
  },
  setFontPx: (fontPx: number) => {
    viewer?.setFontPx(fontPx);
  },
});

onMounted(() => {
  if (!containerRef.value) return;

  const options: HexViewerOptions = {
    data: props.data,
    fontPx: props.fontPx,
    themePreset: props.themePreset,
    theme: props.theme,
    scrollBarWidthPx: props.scrollBarWidthPx,
    minBytesPerRow: props.minBytesPerRow,
    addressGapChars: props.addressGapChars,
    hexGapChars: props.hexGapChars,
    sectionGapChars: props.sectionGapChars,
  };

  viewer = createHexViewer(containerRef.value, options);
});

onBeforeUnmount(() => {
  viewer?.destroy();
  viewer = null;
});

// 监听配置变化
watch(
  () => [
    props.fontPx,
    props.themePreset,
    props.theme,
    props.scrollBarWidthPx,
    props.minBytesPerRow,
    props.addressGapChars,
    props.hexGapChars,
    props.sectionGapChars,
  ],
  () => {
    viewer?.setOptions({
      fontPx: props.fontPx,
      themePreset: props.themePreset,
      theme: props.theme,
      scrollBarWidthPx: props.scrollBarWidthPx,
      minBytesPerRow: props.minBytesPerRow,
      addressGapChars: props.addressGapChars,
      hexGapChars: props.hexGapChars,
      sectionGapChars: props.sectionGapChars,
    });
  },
  { deep: true }
);

// 监听 data 变化
watch(
  () => props.data,
  (newData) => {
    if (newData !== undefined) {
      console.log('props.data:', props.data)
      viewer?.setData(newData);
    }
  }
);
</script>

<template>
  <div ref="containerRef"></div>
</template>
