import { useState, useMemo, useCallback, useEffect } from 'react';
import { HexViewer, type ThemePreset, type HexViewerTheme } from '@imccc/hex-viewer-js/react';
import './App.css';
import bigData from '../comments.json';

// 示例数据
const samples = {
  hello: 'Hello, World! 你好,世界!\nWelcome to HexViewer Demo.\n这是一个高性能的十六进制查看器。',
  binary: new Uint8Array([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
    0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F,
    0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0x3E, 0x3F,
    0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8, 0xF7, 0xF6, 0xF5, 0xF4, 0xF3, 0xF2, 0xF1, 0xF0,
  ]),
  unicode: '🚀 Unicode 测试\n中文字符:你好世界\nEmoji: 😀😃😄😁😆😅🤣😂\n日本語:こんにちは\n한국어: 안녕하세요\nРусский: Привет',
  bigdata: bigData,
};

const lightTheme: Partial<HexViewerTheme> = {
  background: '#FFFFFF',
  text: '#000000',
  address: '#666666',
  dim: '#999999',
  selectionBg: '#0078D4',
  selectionFg: '#FFFFFF',
};

const darkTheme: Partial<HexViewerTheme> = {
  background: '#1E1E1E',
  text: '#FFFFFF',
  address: '#8EC0E4',
  dim: '#888888',
  selectionBg: '#0078D4',
  selectionFg: '#FFFFFF',
};

// 将数据转换为可显示的文本
function dataToDisplayText(value: unknown): string {
  if (value instanceof Uint8Array) {
    return Array.from(value).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function App() {
  const [sampleKey, setSampleKey] = useState<keyof typeof samples | 'custom'>('hello');
  const [customData, setCustomData] = useState('');
  const [editableData, setEditableData] = useState('');
  const [themePreset, setThemePreset] = useState<ThemePreset>('light');
  const [fontSize, setFontSize] = useState(32);
  const [addressGap, setAddressGap] = useState(0.4);
  const [hexGap, setHexGap] = useState(0.6);
  const [sectionGap, setSectionGap] = useState(1);
  const [colors, setColors] = useState(lightTheme);
  const [copySuccess, setCopySuccess] = useState(false);

  // 初始化可编辑数据
  useEffect(() => {
    if (sampleKey !== 'custom') {
      setEditableData(dataToDisplayText(samples[sampleKey]));
    }
  }, [sampleKey]);

  const data = useMemo(() => {
    if (sampleKey === 'custom') {
      return customData;
    }
    // 使用编辑后的数据
    return editableData;
  }, [sampleKey, customData, editableData]);

  const theme = useMemo(() => colors, [colors]);

  const handleThemeChange = useCallback((preset: ThemePreset) => {
    setThemePreset(preset);
    setColors(preset === 'light' ? lightTheme : darkTheme);
  }, []);

  const handleColorChange = useCallback((key: keyof HexViewerTheme, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  }, []);

  // 生成代码示例
  const exampleCode = useMemo(() => {
    const themeCode = themePreset === 'light' ? 'light' : 'dark';
    const customTheme = Object.entries(colors)
      .map(([key, value]) => `    ${key}: '${value}'`)
      .join(',\n');

    const dataPreview = sampleKey === 'custom' 
      ? customData.slice(0, 50) + '...' 
      : editableData.slice(0, 50) + '...';

    return `import { HexViewer } from '@imccc/hex-viewer-js/react';

function MyComponent() {
  const data = \`${dataPreview}\`;

  const customTheme = {
${customTheme}
  };

  return (
    <HexViewer
      data={data}
      themePreset="${themeCode}"
      theme={customTheme}
      fontPx={${fontSize}}
      addressGapChars={${addressGap}}
      hexGapChars={${hexGap}}
      sectionGapChars={${sectionGap}}
    />
  );
}`;
  }, [themePreset, colors, fontSize, addressGap, hexGap, sectionGap, sampleKey, customData, editableData]);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exampleCode);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [exampleCode]);

  return (
    <div className="container">
      <div className="header">
        <h1>🔍 HexViewer React 演示</h1>
        <p>高性能 WebGPU 十六进制查看器 - React 组件</p>
      </div>

      <div className="main-content">
        {/* 左侧控制面板 */}
        <div className="sidebar">
          {/* 示例数据选择 */}
          <div className="section">
            <div className="section-title">📄 示例数据</div>
            <div className="control-group">
              <label className="control-label">选择示例</label>
              <select
                className="control-input"
                value={sampleKey}
                onChange={(e) => setSampleKey(e.target.value as keyof typeof samples | 'custom')}
              >
                <option value="hello">Hello World</option>
                <option value="bigdata">JSON</option>
                <option value="binary">二进制数据</option>
                <option value="unicode">Unicode 字符</option>
                <option value="custom">自定义数据</option>
              </select>
            </div>
            {sampleKey === 'custom' ? (
              <div className="control-group">
                <label className="control-label">自定义数据</label>
                <textarea
                  className="control-input data-textarea"
                  placeholder="输入文本或十六进制数据..."
                  value={customData}
                  onChange={(e) => setCustomData(e.target.value)}
                />
              </div>
            ) : (
              <div className="control-group">
                <label className="control-label">原始数据 (可编辑)</label>
                <textarea
                  className="control-input data-textarea"
                  placeholder="编辑后会实时渲染..."
                  value={editableData}
                  onChange={(e) => setEditableData(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 主题设置 */}
          <div className="section">
            <div className="section-title">🎨 主题设置</div>
            <div className="control-group">
              <label className="control-label">主题预设</label>
              <div className="button-group">
                <button
                  className={`btn ${themePreset === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleThemeChange('light')}
                >
                  ☀️ Light
                </button>
                <button
                  className={`btn ${themePreset === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  🌙 Dark
                </button>
              </div>
            </div>
            <div className="color-grid">
              <div className="control-group">
                <label className="control-label">背景色</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">文本色</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.text}
                  onChange={(e) => handleColorChange('text', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">地址色</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.address}
                  onChange={(e) => handleColorChange('address', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">暗色</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.dim}
                  onChange={(e) => handleColorChange('dim', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">选中背景</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.selectionBg}
                  onChange={(e) => handleColorChange('selectionBg', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">选中前景</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.selectionFg}
                  onChange={(e) => handleColorChange('selectionFg', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 显示设置 */}
          <div className="section">
            <div className="section-title">⚙️ 显示设置</div>
            <div className="control-group">
              <label className="control-label">
                字体大小 <span className="range-value">{fontSize}px</span>
              </label>
              <input
                type="range"
                className="control-input"
                min="8"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>
            <div className="control-group">
              <label className="control-label">
                地址间隙 <span className="range-value">{addressGap}</span>
              </label>
              <input
                type="range"
                className="control-input"
                min="0"
                max="8"
                step="0.1"
                value={addressGap}
                onChange={(e) => setAddressGap(Number(e.target.value))}
              />
            </div>
            <div className="control-group">
              <label className="control-label">
                十六进制间隙 <span className="range-value">{hexGap}</span>
              </label>
              <input
                type="range"
                className="control-input"
                min="0"
                max="4"
                step="0.1"
                value={hexGap}
                onChange={(e) => setHexGap(Number(e.target.value))}
              />
            </div>
            <div className="control-group">
              <label className="control-label">
                列间隙 <span className="range-value">{sectionGap}</span>
              </label>
              <input
                type="range"
                className="control-input"
                min="0"
                max="8"
                step="0.1"
                value={sectionGap}
                onChange={(e) => setSectionGap(Number(e.target.value))}
              />
            </div>
          </div>

          {/* 代码示例 */}
          <div className="section">
            <div className="section-title">
              📝 使用示例
              <button 
                className={`copy-btn ${copySuccess ? 'copy-success' : ''}`} 
                onClick={copyCode}
              >
                {copySuccess ? '✓ 已复制' : '📋 复制代码'}
              </button>
            </div>
            <div className="code-preview">
              <pre><code>{exampleCode}</code></pre>
            </div>
          </div>
        </div>

        {/* 右侧预览区域 */}
        <div className="viewer-container">
          <HexViewer
            className="hex-viewer-wrapper"
            data={data}
            themePreset={themePreset}
            theme={theme}
            fontPx={fontSize}
            addressGapChars={addressGap}
            hexGapChars={hexGap}
            sectionGapChars={sectionGap}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
