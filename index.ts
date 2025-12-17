import { HexViewer } from "./hex-viewer.ts";

function getFontPx(): number | undefined {
  const q = new URLSearchParams(window.location.search);
  const raw = q.get("font");
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(8, Math.min(48, Math.floor(n)));
}

const canvas = document.createElement("canvas");
canvas.style.width = "100vw";
canvas.style.height = "100vh";
canvas.style.display = "block";
document.body.appendChild(canvas);

new HexViewer(canvas, {
  fontPx: getFontPx(),
  scrollBarWidthPx: 20,
  minBytesPerRow: 4,
  theme: {
    selectionBg: "#FF0F3F",
    selectionFg: "#FFFF00",
    // dim: "#888888",
    // background: "#FFFFFF",
    // text: "#FF0F3F"
  }
});