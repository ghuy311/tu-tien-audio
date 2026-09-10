import React from 'react';
import { X, BookOpen, Check } from 'lucide-react';

export function TocDrawer({ isOpen, onClose, chapters = [], currentChapterIndex, onSelectChapter }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-neutral-900 h-full border-l border-neutral-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">Danh mục chương</h3>
              <p className="text-xs text-neutral-400">Tổng số: {chapters.length} chương</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chapters.map((chap, idx) => {
            const isCurrent = idx === currentChapterIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectChapter(idx);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border text-sm transition cursor-pointer flex items-center justify-between ${
                  isCurrent
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 font-semibold shadow-sm'
                    : 'bg-neutral-950/40 border-neutral-800 hover:bg-neutral-800/80 text-neutral-300'
                }`}
              >
                <span className="truncate mr-3">
                  {idx + 1}. {chap.title}
                </span>
                {isCurrent && (
                  <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 shrink-0">
                    <Check className="w-3 h-3" />
                    <span>Đang đọc</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
