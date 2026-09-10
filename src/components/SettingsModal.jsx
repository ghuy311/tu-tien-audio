import React, { useState, useMemo } from 'react';
import { X, Mic, Gauge, Type, Info, Check, Palette, Clock, MoveHorizontal, AlignJustify, Search } from 'lucide-react';
import { isVietnameseVoice } from '../hooks/useTTS';

export function SettingsModal({
  isOpen,
  onClose,
  voices = [],
  selectedVoiceURI,
  rate,
  pitch,
  sentencePause = 300,
  fontSize,
  fontFamily,
  lineHeight = 2.0,
  letterSpacing = 0,
  paragraphSpacing = 0.6,
  theme = 'dark',
  onChangeVoice,
  onChangeRate,
  onChangePitch,
  onChangeSentencePause,
  onChangeFontSize,
  onChangeFontFamily,
  onChangeLineHeight,
  onChangeLetterSpacing,
  onChangeParagraphSpacing,
  onChangeTheme
}) {
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');

  const viVoicesCount = useMemo(() => {
    return voices.filter(isVietnameseVoice).length;
  }, [voices]);

  const filteredVoices = useMemo(() => {
    if (!voiceSearchQuery.trim()) return voices;
    const q = voiceSearchQuery.toLowerCase().trim();
    return voices.filter(
      (v) => (v.name || '').toLowerCase().includes(q) || (v.lang || '').toLowerCase().includes(q)
    );
  }, [voices, voiceSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Cài đặt Giọng đọc & Trình xem sách</h3>
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
                { id: 'sepia', name: 'Giấy vàng', bg: '#fbf0d9', text: '#3d2f1d', border: '#e4d0a7' },
                { id: 'paper', name: 'Trắng giấy', bg: '#fafafa', text: '#18181b', border: '#ccc' },
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

          {/* Voice Selector with Real-time Search Box */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Giọng đọc hệ thống (Lưu tự động vào DB)</span>
              </label>
              <span className="text-xs font-mono text-emerald-400">
                {viVoicesCount > 0 ? `[ Có ${viVoicesCount} giọng TV ]` : '[ Thiếu giọng TV ]'}
              </span>
            </div>

            {/* Voice Search Box */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm giọng đọc (VD: vi, HoaiMy, Google, English)..."
                value={voiceSearchQuery}
                onChange={(e) => setVoiceSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 pl-8 pr-8 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none placeholder:text-neutral-500"
              />
              {voiceSearchQuery && (
                <button
                  onClick={() => setVoiceSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {voices.length === 0 ? (
              <p className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-lg border border-amber-900">
                Đang nạp danh sách giọng đọc từ hệ thống...
              </p>
            ) : filteredVoices.length === 0 ? (
              <p className="text-xs text-neutral-400 bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-center">
                Không tìm thấy giọng đọc nào khớp với "{voiceSearchQuery}"
              </p>
            ) : (
              <select
                value={selectedVoiceURI}
                onChange={(e) => onChangeVoice(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
              >
                {filteredVoices.map((v) => {
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

          {/* Sentence Pause Config */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Thời gian ngắt nghỉ giữa các câu</span>
              </label>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {sentencePause === 0 ? 'Không nghỉ (0s)' : `${sentencePause / 1000}s`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: '0s', val: 0 },
                { label: '0.3s', val: 300 },
                { label: '0.5s', val: 500 },
                { label: '1.0s', val: 1000 },
                { label: '1.5s', val: 1500 }
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => onChangeSentencePause(p.val)}
                  className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    sentencePause === p.val
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line Height Config */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlignJustify className="w-4 h-4 text-emerald-400" />
                <span>Khoảng cách dòng (Line Height)</span>
              </label>
              <span className="text-xs font-mono text-emerald-400 font-bold">{lineHeight}x</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1.6, 1.8, 2.0, 2.2, 2.5].map((lh) => (
                <button
                  key={lh}
                  onClick={() => onChangeLineHeight(lh)}
                  className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    lineHeight === lh
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {lh}x
                </button>
              ))}
            </div>
          </div>

          {/* Paragraph Spacing Config */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlignJustify className="w-4 h-4 text-emerald-400" />
                <span>Khoảng cách giữa các đoạn văn</span>
              </label>
              <span className="text-xs font-mono text-emerald-400 font-bold">{paragraphSpacing ?? 0.6}em</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Hẹp (0.3em)', val: 0.3 },
                { label: 'Gần (0.5em)', val: 0.5 },
                { label: 'Vừa (0.75em)', val: 0.75 },
                { label: 'Chuẩn (1.0em)', val: 1.0 },
                { label: 'Xa (1.5em)', val: 1.5 }
              ].map((ps) => (
                <button
                  key={ps.val}
                  onClick={() => onChangeParagraphSpacing && onChangeParagraphSpacing(ps.val)}
                  className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    (paragraphSpacing ?? 0.6) === ps.val
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {ps.label}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Spacing Config */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <MoveHorizontal className="w-4 h-4 text-emerald-400" />
                <span>Khoảng cách chữ (Letter Spacing)</span>
              </label>
              <span className="text-xs font-mono text-emerald-400 font-bold">{letterSpacing}px</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Chuẩn (0px)', val: 0 },
                { label: 'Thưa (+0.5px)', val: 0.5 },
                { label: 'Thưa (+1px)', val: 1 },
                { label: 'Rộng (+2px)', val: 2 }
              ].map((ls) => (
                <button
                  key={ls.val}
                  onClick={() => onChangeLetterSpacing(ls.val)}
                  className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    letterSpacing === ls.val
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {ls.label}
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
