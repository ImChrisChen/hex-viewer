import { useState, useMemo, useCallback, useEffect } from 'react';
import { HexViewer, type ThemePreset, type HexViewerTheme } from '@imccc/hex-viewer-js/react';
import './App.css';
import bigData from '../comments.json';

// Sample Data
const samples = {
  hello: 'Hello, World! Greetings from HexViewer React Demo.\nThis is a high-performance hex viewer.',
  bigdata: bigData,
  binary: new Uint8Array([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
    0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F,
    0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0x3E, 0x3F,
    0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8, 0xF7, 0xF6, 0xF5, 0xF4, 0xF3, 0xF2, 0xF1, 0xF0,
  ]),
  unicode: '🚀 Unicode Test\nChinese: 你好世界\nEmoji: 😀😃😄😁😆😅🤣😂\nJapanese: こんにちは\nKorean: 안녕하세요\nRussian: Привет',
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

// Convert to display text
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

  // Initialize editable data
  useEffect(() => {
    if (sampleKey !== 'custom') {
      setEditableData(dataToDisplayText(samples[sampleKey]));
    }
  }, [sampleKey]);

  const data = useMemo(() => {
    if (sampleKey === 'custom') {
      return customData;
    }
    // Use editable data
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

  // Generate code example
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
      console.error('Copy failed:', err);
    }
  }, [exampleCode]);

  return (
    <div className="container">
      <div className="header">
        <h1>🔍 HexViewer React Demo</h1>
        <p>High Performance WebGPU Hex Viewer - React Component - <a href="https://github.com/ImChrisChen/hex-viewer" target="_blank" style={{color: 'inherit', textDecoration: 'underline'}}>View on GitHub</a></p>
      </div>

      <div className="main-content">
        {/* Sidebar */}
        <div className="sidebar">
          {/* Sample Data */}
          <div className="section">
            <div className="section-title">📄 Sample Data</div>
            <div className="control-group">
              <label className="control-label">Select Sample</label>
              <select
                className="control-input"
                value={sampleKey}
                onChange={(e) => setSampleKey(e.target.value as keyof typeof samples | 'custom')}
              >
                <option value="hello">Hello World</option>
                <option value="bigdata">JSON</option>
                <option value="binary">Binary Data</option>
                <option value="unicode">Unicode Characters</option>
                <option value="custom">Custom Data</option>
              </select>
            </div>
            {sampleKey === 'custom' ? (
              <div className="control-group">
                <label className="control-label">Custom Data</label>
                <textarea
                  className="control-input data-textarea"
                  placeholder="Enter text or hex data..."
                  value={customData}
                  onChange={(e) => setCustomData(e.target.value)}
                />
              </div>
            ) : (
              <div className="control-group">
                <label className="control-label">Raw Data (Editable)</label>
                <textarea
                  className="control-input data-textarea"
                  placeholder="Edit to preview..."
                  value={editableData}
                  onChange={(e) => setEditableData(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Theme Settings */}
          <div className="section">
            <div className="section-title">🎨 Theme Settings</div>
            <div className="control-group">
              <label className="control-label">Preset</label>
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
                <label className="control-label">Background</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Text</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.text}
                  onChange={(e) => handleColorChange('text', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Address</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.address}
                  onChange={(e) => handleColorChange('address', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Dim</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.dim}
                  onChange={(e) => handleColorChange('dim', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Selection Bg</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.selectionBg}
                  onChange={(e) => handleColorChange('selectionBg', e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Selection Fg</label>
                <input
                  type="color"
                  className="control-input"
                  value={colors.selectionFg}
                  onChange={(e) => handleColorChange('selectionFg', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="section">
            <div className="section-title">⚙️ Display Settings</div>
            <div className="control-group">
              <label className="control-label">
                Font Size <span className="range-value">{fontSize}px</span>
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
                Address Gap <span className="range-value">{addressGap}</span>
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
                Hex Gap <span className="range-value">{hexGap}</span>
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
                Section Gap <span className="range-value">{sectionGap}</span>
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

          {/* Code Example */}
          <div className="section">
            <div className="section-title">
              📝 Usage Example
              <button 
                className={`copy-btn ${copySuccess ? 'copy-success' : ''}`} 
                onClick={copyCode}
              >
                {copySuccess ? '✓ Copied' : '📋 Copy Code'}
              </button>
            </div>
            <div className="code-preview">
              <pre><code>{exampleCode}</code></pre>
            </div>
          </div>
        </div>

        {/* Viewer Container */}
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
