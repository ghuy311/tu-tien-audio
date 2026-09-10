import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Gauge,
  List,
  Sliders
} from 'lucide-react';
import { isJunkTitle } from '../services/epubParser';

export function AudioPlayerBar({
  isPlaying,
  isPaused,
  currentSentenceIndex,
  totalSentences,
  currentChapterTitle,
  rate,
  onPlay,
  onPause,
  onPrevSentence,
  onNextSentence,
  onRewind15s,
  onForward15s,
  onPrevChapter,
  onNextChapter,
  onChangeRate,
  onJumpToSentence,
  onOpenToc,
  onOpenSettings
}) {
  const rates = [0.8, 1.0, 1.25, 1.5, 2.0];

  const handleNextRate = () => {
    const currentIndex = rates.indexOf(rate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    onChangeRate(nextRate);
  };

  const sentencePercent = totalSentences > 0 ? ((currentSentenceIndex + 1) / totalSentences) * 100 : 0;

  const displayTitle = !isJunkTitle(currentChapterTitle) ? currentChapterTitle : '';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-neutral-900 border-t border-neutral-800 shadow-2xl px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Interactive Progress Slider Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-neutral-400 min-w-[50px] text-right">
            {totalSentences > 0 ? `${currentSentenceIndex + 1}/${totalSentences}` : '0/0'}
          </span>

          <input
            type="range"
            min="0"
            max={Math.max(0, totalSentences - 1)}
            value={currentSentenceIndex}
            onChange={(e) => onJumpToSentence(Number(e.target.value))}
            className="flex-1 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
          />

          <span className="text-xs font-mono text-emerald-400 min-w-[45px]">
            {Math.round(sentencePercent)}%
          </span>
        </div>

        {/* Player Controls Bar */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Quick Info & TOC */}
          <div className="hidden sm:flex items-center gap-2 max-w-[200px]">
            <button
              onClick={onOpenToc}
              className="flex items-center gap-1 px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs font-medium cursor-pointer border border-neutral-700"
            >
              <List className="w-3.5 h-3.5 text-emerald-400" />
              <span>Danh mục</span>
            </button>
            <span className="text-xs text-neutral-400 truncate">
              {displayTitle}
            </span>
          </div>

          {/* Core Playback Control Buttons (Large Touch Targets min 44px) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
            {/* Nút Chuyển Chương Trước */}
            <button
              onClick={onPrevChapter}
              title="Chương trước"
              className="min-h-[44px] min-w-[44px] px-2.5 bg-neutral-800/90 hover:bg-neutral-700 text-emerald-400 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-neutral-700 flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden md:inline">Chương</span>
            </button>

            {/* Tua lùi 15s */}
            <button
              onClick={onRewind15s}
              title="Lùi 15 giây"
              className="min-h-[44px] min-w-[44px] px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-neutral-700 flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">15s</span>
            </button>

            {/* Câu trước */}
            <button
              onClick={onPrevSentence}
              title="Câu trước"
              className="min-h-[44px] min-w-[44px] px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-neutral-700 flex items-center justify-center"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Main Play / Pause Button */}
            {isPlaying ? (
              <button
                onClick={onPause}
                className="min-h-[44px] px-5 sm:px-6 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer shadow-md shadow-amber-950/40 flex items-center gap-2 shrink-0"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>TẠM DỪNG</span>
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="min-h-[44px] px-5 sm:px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer shadow-md shadow-emerald-950/40 flex items-center gap-2 shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>PHÁT AUDIO</span>
              </button>
            )}

            {/* Câu sau */}
            <button
              onClick={onNextSentence}
              title="Câu tiếp theo"
              className="min-h-[44px] min-w-[44px] px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-neutral-700 flex items-center justify-center"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Tua tới 15s */}
            <button
              onClick={onForward15s}
              title="Tới 15 giây"
              className="min-h-[44px] min-w-[44px] px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-neutral-700 flex items-center justify-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">15s</span>
            </button>

            {/* Nút Chuyển Chương Tiêu */}
            <button
              onClick={onNextChapter}
              title="Chương tiếp theo"
              className="min-h-[44px] min-w-[44px] px-2.5 bg-neutral-800/90 hover:bg-neutral-700 text-emerald-400 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-neutral-700 flex items-center justify-center gap-1"
            >
              <span className="hidden md:inline">Chương</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Toggle & Settings Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNextRate}
              title="Đổi tốc độ đọc"
              className="min-h-[44px] px-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-lg text-xs font-mono font-bold transition active:scale-95 cursor-pointer border border-neutral-700 flex items-center gap-1"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{rate}x</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="min-h-[44px] min-w-[44px] px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-neutral-700 flex items-center justify-center"
              title="Cài đặt giọng đọc & font"
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
