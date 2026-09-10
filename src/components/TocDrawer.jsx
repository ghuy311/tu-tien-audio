import React, { useState, useMemo } from 'react';
import { X, BookOpen, Check, Search, Hash, ArrowRight } from 'lucide-react';
import { isJunkTitle } from '../services/epubParser';

export function TocDrawer({ isOpen, onClose, chapters = [], currentChapterIndex, onSelectChapter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpInput, setJumpInput] = useState('');

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const query = searchQuery.toLowerCase().trim();
    return chapters.filter((chap, idx) => {
      const chapterNum = String(idx + 1);
      const title = (!isJunkTitle(chap.title) ? chap.title : `Chương ${idx + 1}`).toLowerCase();
      return chapterNum.includes(query) || title.includes(query);
    });
  }, [chapters, searchQuery]);

  if (!isOpen) return null;

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(jumpInput, 10);
    if (!isNaN(num) && num >= 1 && num <= chapters.length) {
      onSelectChapter(num - 1);
      setJumpInput('');
      onClose();
    }
  };

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

        {/* Search & Quick Jump Inputs */}
        <div className="p-4 border-b border-neutral-800 space-y-3 bg-neutral-950/60">
          {/* Real-time Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm tên hoặc số chương..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-8 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none placeholder:text-neutral-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Seek to Chapter Number */}
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Hash className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                max={chapters.length}
                placeholder={`Nhập số chương (1 - ${chapters.length})...`}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none placeholder:text-neutral-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!jumpInput}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 flex items-center gap-1 shrink-0"
            >
              <span>Đi tới</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredChapters.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              Không tìm thấy chương nào khớp với "{searchQuery}"
            </div>
          ) : (
            filteredChapters.map((chap) => {
              const idx = chap.index !== undefined ? chap.index : chapters.indexOf(chap);
              const isCurrent = idx === currentChapterIndex;
              const titleText = !isJunkTitle(chap.title) ? chap.title : `Chương ${idx + 1}`;
              const displayLabel = titleText.toLowerCase().startsWith('chương')
                ? titleText
                : `${idx + 1}. ${titleText}`;

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
                    {displayLabel}
                  </span>
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 shrink-0">
                      <Check className="w-3 h-3" />
                      <span>Đang đọc</span>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
