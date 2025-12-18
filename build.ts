import { readFile, writeFile, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";

const DIST_DIR = "./dist";

async function build() {
  // 清理 dist 目录
  if (existsSync(DIST_DIR)) {
    await rm(DIST_DIR, { recursive: true });
  }
  await mkdir(DIST_DIR, { recursive: true });

  console.log("📦 Building worker...");

  // 使用 Bun 编译 worker 为单文件
  const workerBuild = await Bun.build({
    entrypoints: ["./renderer.worker.ts"],
    target: "browser",
    minify: true,
  });

  if (!workerBuild.success) {
    console.error("Worker build failed:", workerBuild.logs);
    process.exit(1);
  }

  const workerCode = await workerBuild.outputs[0]!.text();
  console.log(`   Worker size: ${(workerCode.length / 1024).toFixed(1)} KB`);

  // 读取 hex-viewer.ts 源码
  let hexViewerSource = await readFile("./hex-viewer.ts", "utf-8");

  // 替换 workerUrl 函数定义
  const workerUrlFuncRegex = /\/\/ 构造 renderer\.worker\.ts 的 URL，兼容 file: 协议（本地开发场景）\nfunction workerUrl\(\): URL \{[^}]+\n  \}\n  return url;\n\}/;

  const inlineWorkerFunc = `// 内联的 Worker 代码（构建时注入）
const WORKER_CODE = ${JSON.stringify(workerCode)};

function createWorkerFromInlineCode(): Worker {
  const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}`;

  if (!workerUrlFuncRegex.test(hexViewerSource)) {
    console.error("❌ Failed to find workerUrl function in hex-viewer.ts");
    process.exit(1);
  }

  hexViewerSource = hexViewerSource.replace(workerUrlFuncRegex, inlineWorkerFunc);

  // 替换 Worker 创建调用
  hexViewerSource = hexViewerSource.replace(
    /new Worker\(workerUrl\(\), \{ type: "module" \}\)/g,
    "createWorkerFromInlineCode()"
  );

  // 写入临时文件用于构建
  const tempFile = "./dist/_hex-viewer-temp.ts";
  await writeFile(tempFile, hexViewerSource);

  console.log("📦 Building main module...");

  // 构建主入口
  const mainBuild = await Bun.build({
    entrypoints: [tempFile],
    outdir: DIST_DIR,
    target: "browser",
    format: "esm",
    minify: false,
    naming: "index.js",
  });

  if (!mainBuild.success) {
    console.error("Main build failed:", mainBuild.logs);
    process.exit(1);
  }

  // 删除临时文件
  await rm(tempFile);

  console.log("📦 Generating type declarations...");

  // 使用 TypeScript 编译器生成 .d.ts
  const tscResult = Bun.spawnSync({
    cmd: ["bunx", "tsc", "./hex-viewer.ts", "--declaration", "--emitDeclarationOnly", "--outDir", DIST_DIR],
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });

  if (tscResult.exitCode !== 0) {
    // tsc 可能会有一些警告但仍然生成文件，检查文件是否存在
    const dtsExists = existsSync(`${DIST_DIR}/hex-viewer.d.ts`);
    if (!dtsExists) {
      console.error("TypeScript declaration generation failed:");
      console.error(tscResult.stderr.toString());
      process.exit(1);
    }
  }

  // 重命名 hex-viewer.d.ts 为 index.d.ts
  if (existsSync(`${DIST_DIR}/hex-viewer.d.ts`)) {
    const dtsContent = await readFile(`${DIST_DIR}/hex-viewer.d.ts`, "utf-8");
    await writeFile(`${DIST_DIR}/index.d.ts`, dtsContent);
    await rm(`${DIST_DIR}/hex-viewer.d.ts`);
  }

  // 清理可能生成的 renderer.worker.d.ts
  if (existsSync(`${DIST_DIR}/renderer.worker.d.ts`)) {
    await rm(`${DIST_DIR}/renderer.worker.d.ts`);
  }

  const jsSize = (await readFile(`${DIST_DIR}/index.js`)).length;
  console.log("✅ Build completed successfully!");
  console.log(`   Output: ${DIST_DIR}/index.js (${(jsSize / 1024).toFixed(1)} KB)`);
  console.log(`   Types:  ${DIST_DIR}/index.d.ts`);
}

build().catch((err) => {
  console.error("Build error:", err);
  process.exit(1);
});
