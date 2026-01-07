async function buildTs(entryAbsPath: string): Promise<ArrayBuffer> {
  const result = await Bun.build({
    entrypoints: [entryAbsPath],
    target: "browser",
    format: "esm",
    sourcemap: "inline",
    minify: false,
  });

  if (!result.success) {
    const msg = result.logs.map((l: { message: string }) => l.message).join("\n");
    throw new Error(msg || "Bun.build failed");
  }

  const out = result.outputs[0];
  if (!out) throw new Error("Bun.build produced no outputs");
  return await out.arrayBuffer();
}

function contentTypeForPath(pathname: string): string {
  if (pathname.endsWith(".html")) return "text/html; charset=utf-8";
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".ts") || pathname.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "application/octet-stream";
}

const rootUrl = new URL("./", import.meta.url);
const indexHtml = new URL("./index.html", rootUrl);
const indexCss = new URL("./index.css", rootUrl);
const indexTs = new URL("./index.ts", rootUrl);
const workerTs = new URL("./renderer.worker.ts", rootUrl);
const hexViewerTs = new URL("./hex-viewer.ts", rootUrl);

async function serveTsFile(absPath: string): Promise<Response> {
  const code = await buildTs(absPath);
  return new Response(code, {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  });
}

function serveFile(url: URL): Response {
  return new Response(Bun.file(url), {
    headers: { "Content-Type": contentTypeForPath(url.pathname) },
  });
}

const port = Number(Bun.env.PORT ?? 3001);

Bun.serve({
  port,
  async fetch(req: Request) {
    const url = new URL(req.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return serveFile(indexHtml);
    }

    if (url.pathname === "/index.css") {
      return serveFile(indexCss);
    }

    if (url.pathname === "/index.ts") {
      return serveTsFile(indexTs.pathname);
    }

    if (url.pathname === "/hex-viewer.ts") {
      return serveTsFile(hexViewerTs.pathname);
    }

    if (url.pathname === "/renderer.worker.ts") {
      return serveTsFile(workerTs.pathname);
    }

    // 支持 /src/ 路径
    if (url.pathname === "/src/index.ts") {
      return serveTsFile(new URL("./src/index.ts", rootUrl).pathname);
    }

    if (url.pathname === "/src/hex-viewer.ts") {
      return serveTsFile(new URL("./src/hex-viewer.ts", rootUrl).pathname);
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`dev server: http://localhost:${port}`);
