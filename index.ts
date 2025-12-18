import { HexViewer } from "./hex-viewer.ts";

function getFontPx(): number | undefined {
  const q = new URLSearchParams(window.location.search);
  const raw = q.get("font");
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(8, Math.min(48, Math.floor(n)));
}

const el = document.querySelector('#container')
if (!el) throw new Error("Container element not found");

const hv = new HexViewer(el, {
  fontPx: getFontPx(),
  scrollBarWidthPx: 20,
  minBytesPerRow: 4,
  theme: {
    // selectionBg: "#FF0F3F",
    // selectionFg: "#FFFF00",
    // dim: "#888888",
    // background: "#FFFFFF",
    // text: "#FF0F3F"
  },
  /** 地址列和十六进制列之间的字符间隙（以等宽字符个数为单位）。 */
  addressGapChars: 1,

  /** 十六进制字节之间的字符间隙（每个字节 2 个 hex 字符后追加的空格数）。 */
  hexGapChars: 0.2,

  /** 十六进制列和 ASCII 列之间的字符间隙。 */
  sectionGapChars: 1,
});
hv.setData(`
<!doctype html>
<html>

<head>
  <link rel="stylesheet" href="./index.css" />
  <script src="./index.ts" type="module"></script>
</head>

<body style="display: flex; justify-content: center; align-items: center;">

  <div style="height: 300px; width: 600px; background: #000000" id="container">

  </div>

</body>

</html>
  `)