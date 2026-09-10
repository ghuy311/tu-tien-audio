import React from 'react';
import { X, Mic, Gauge, Type, Info, Check, Palette } from 'lucide-react';
import { isVietnameseVoice } from '../hooks/useTTS';

export function SettingsModal({
  isOpen,
  onClose,
  voices = [],
  selectedVoiceURI,
  rate,
  pitch,
  fontSize,
  fontFamily,
  theme = 'dark',
  onChangeVoice,
  onChangeRate,
  onChangePitch,
  onChangeFontSize,
  onChangeFontFamily,
  onChangeTheme
}) {
  if (!isOpen) return null;

  const viVoicesCount = voices.filter(isVietnameseVoice).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Cài đặt Máy đọc sách & Giọng đọc</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Reader Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>Chủ đề màu trang sách (E-Reader Themes)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'dark', name: 'Tối (AMOLED)', bg: '#121212', text: '#ffffff', border: '#333' },
                { id: 'sepia', name: 'Giấy vàng (Sepia)', bg: '#fbf0d9', text: '#3d2f1d', border: '#e4d0a7' },
                { id: 'paper', name: 'Trắng giấy (Paper)', bg: '#fafafa', text: '#18181b', border: '#ccc' },
                { id: 'slate', name: 'Xanh Slate', bg: '#0f172a', text: '#e2e8f0', border: '#334155' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChangeTheme(t.id)}
                  style={{ backgroundColor: t.bg, color: t.text, borderColor: t.border }}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition flex flex-col items-center justify-center gap-1 shadow-xs ${
                    theme === t.id ? 'ring-2 ring-emerald-500 scale-105' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <span>{t.name}</span>
                  {theme === t.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family Switcher */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-emerald-400" />
              <span>Phông chữ chuẩn E-Book</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'lora', name: 'Lora (Serif chuẩn sách)', fontClass: 'font-lora' },
                { id: 'merriweather', name: 'Merriweather (Ấm áp)', fontClass: 'font-merriweather' },
                { id: 'inter', name: 'Inter (Sans hiện đại)', fontClass: 'font-inter' },
                { id: 'mono-reader', name: 'Monospace (Đều nét)', fontClass: 'font-mono-reader' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onChangeFontFamily(f.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${f.fontClass} ${
                    fontFamily === f.id
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-sm">{f.name}</span>
                  {fontFamily === f.id && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Selector */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Kích thước chữ đọc
              </label>
              <span className="text-xs font-mono text-emerald-400 font-bold">{fontSize}px</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onChangeFontSize(Math.max(14, fontSize - 2))}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-bold text-neutral-300 cursor-pointer"
              >
                - Thấp
              </button>
              <input
                type="range"
                min="14"
                max="28"
                step="1"
                value={fontSize}
                onChange={(e) => onChangeFontSize(parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <button
                onClick={() => onChangeFontSize(Math.min(28, fontSize + 2))}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-bold text-neutral-300 cursor-pointer"
              >
                + Cao
              </button>
            </div>
          </div>

          {/* Voice Selector */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Giọng đọc hệ thống (Text-To-Speech Voice)</span>
              </label>
              <span className="text-xs font-mono text-emerald-400">
                {viVoicesCount > 0 ? `[ Có ${viVoicesCount} giọng TV ]` : '[ Thiếu giọng TV ]'}
              </span>
            </div>

            {voices.length === 0 ? (
              <p className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-lg border border-amber-900">
                Đang nạp danh sách giọng đọc từ hệ thống...
              </p>
            ) : (
              <select
                value={selectedVoiceURI}
                onChange={(e) => onChangeVoice(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
              >
                {voices.map((v) => {
                  const isVi = isVietnameseVoice(v);
                  return (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {isVi ? '🇻🇳 [Tiếng Việt] ' : ''}{v.name} ({v.lang})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Reading Speed Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>Tốc độ đọc giọng nói</span>
              </label>
              <span className="text-xs font-mono text-emerald-400 font-bold">{rate}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.1"
              value={rate}
              onChange={(e) => onChangeRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
