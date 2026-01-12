import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue(),
    react(),
    dts({
      include: ["src/**/*.ts", "src/**/*.vue"],
      exclude: ["src/**/*.worker.ts"],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        react: resolve(__dirname, "src/react/index.ts"),
        vue: resolve(__dirname, "src/vue/index.ts"),
      },
      formats: ["es"],
      fileName: (_format: string, entryName: string) => `${entryName}.js`,
    },
    rollupOptions: {
      // 外部依赖，不打包进去
      external: ["react", "react-dom", "vue"],
    },
    // 输出目录
    outDir: "dist",
    // 清空输出目录
    emptyOutDir: true,
    // 不压缩，方便调试
    minify: false,
    // 生成 sourcemap
    sourcemap: true,
    // 目标环境
    target: "es2020",
  },
  // Worker 配置 - 内联到主代码中
  worker: {
    format: "es",
  },
  // 开发服务器配置
  server: {
    port: 3001,
    // 监听 src 目录变化实现热更新
    watch: {
      // 监听整个项目目录
      usePolling: false,
    },
    // 启用 HMR
    hmr: true,
  },
});
