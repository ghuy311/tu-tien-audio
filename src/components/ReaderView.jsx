import React, { useEffect, useRef } from 'react';
import { ArrowLeft, List, Sliders, ChevronLeft, ChevronRight, AlertCircle, Loader2, Sun, Moon, BookOpen } from 'lucide-react';

export function ReaderView({
  book,
  currentChapterIndex,
  currentSentenceIndex,
  chapterContent,
  chapterLoading,
  isPlaying,
  hasVietnameseVoice,
  fontSize,
  fontFamily,
  theme = 'dark',
  onChangeTheme,
  onSentenceClick,
  onPrevChapter,
  onNextChapter,
  onBackToLibrary,
  onOpenToc,
  onOpenSettings
}) {
  const sentenceRefs = useRef([]);
  const totalChapters = book?.toc?.length || 0;

  useEffect(() => {
    if (currentSentenceIndex >= 0 && sentenceRefs.current[currentSentenceIndex]) {
      sentenceRefs.current[currentSentenceIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentSentenceIndex, currentChapterIndex, chapterContent]);

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-neutral-400">
        <p>Không tìm thấy sách.</p>
        <button
          onClick={onBackToLibrary}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trở về thư viện</span>
        </button>
      </div>
    );
  }

  // Theme wrapper class
  const themeClass = `theme-${theme}`;

  // Font family class
  const fontFamilyClass =
    fontFamily === 'lora'
      ? 'font-lora'
      : fontFamily === 'merriweather'
      ? 'font-merriweather'
      : fontFamily === 'mono-reader'
      ? 'font-mono-reader'
      : 'font-inter';

  const chapterTitle = chapterContent?.title || book.toc?.[currentChapterIndex]?.title || `Chương ${currentChapterIndex + 1}`;

  return (
    <div className={`min-h-screen pb-36 transition-colors duration-300 ${themeClass}`}>
      {/* Sticky Reader Header Bar (E-Reader Style) */}
      <header className="sticky top-0 z-20 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition active:scale-95 border border-black/10 dark:border-white/10 opacity-80 hover:opacity-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Thư viện</span>
          </button>

          <div className="text-center overflow-hidden px-2">
            <h2 className="text-[11px] font-medium opacity-60 truncate max-w-[160px] sm:max-w-xs">
              {book.title}
            </h2>
            <p className="text-xs sm:text-sm font-bold truncate max-w-[220px] sm:max-w-md">
              {chapterTitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Theme Switcher Pills */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
              {[
                { id: 'dark', label: 'Tối', icon: Moon },
                { id: 'sepia', label: 'Giấy vàng', icon: BookOpen },
                { id: 'paper', label: 'Sáng', icon: Sun },
                { id: 'slate', label: 'Xanh', icon: Moon }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChangeTheme(t.id)}
                  title={`Chuyển giao diện ${t.label}`}
                  className={`px-2 py-1 text-[10px] font-semibold rounded cursor-pointer transition ${
                    theme === t.id ? 'bg-emerald-600 text-white shadow-xs' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={onOpenToc}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition border border-black/10 dark:border-white/10 opacity-80 hover:opacity-100"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Danh mục</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition border border-black/10 dark:border-white/10 opacity-80 hover:opacity-100"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cài đặt</span>
            </button>
          </div>
        </div>
      </header>

      {/* Reader Page Area (Thiết kế khổ trang sách Kindle/Kobo) */}
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
        {!hasVietnameseVoice && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Chưa phát hiện giọng đọc Tiếng Việt trên máy tính!</p>
              <p className="mt-1 leading-relaxed opacity-90">
                Hãy mở trình duyệt <strong>Microsoft Edge</strong> để có giọng đọc tự nhiên "Microsoft HoaiMy" hoặc vào Settings Windows -&gt; Speech để tải giọng Tiếng Việt.
              </p>
            </div>
          </div>
        )}

        {/* Chapter Header in Book */}
        <div className="mb-8 text-center border-b border-black/10 dark:border-white/10 pb-6">
          <span className="text-[11px] font-bold tracking-widest uppercase opacity-50 block mb-1">
            Chương {currentChapterIndex + 1} / {totalChapters}
          </span>
          <h1 className={`${fontFamilyClass} text-2xl sm:text-3xl font-bold tracking-tight leading-snug`}>
            {chapterTitle}
          </h1>
        </div>

        {chapterLoading ? (
          <div className="py-20 text-center opacity-60 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm font-medium">Đang giải nén văn bản...</p>
          </div>
        ) : (
          <article
            className={`${fontFamilyClass} leading-[2.1] tracking-normal space-y-5 text-justify`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {chapterContent?.sentences && chapterContent.sentences.length > 0 ? (
              chapterContent.sentences.map((sentence, idx) => {
                const isActive = idx === currentSentenceIndex;
                return (
                  <span
                    key={idx}
                    ref={(el) => (sentenceRefs.current[idx] = el)}
                    onClick={() => onSentenceClick(idx)}
                    className={`inline cursor-pointer rounded py-0.5 px-1 transition-all duration-150 ${
                      isActive
                        ? 'reader-sentence-active shadow-xs'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {sentence}{' '}
                  </span>
                );
              })
            ) : (
              <p className="opacity-50 italic py-10 text-center">Chương này không có văn bản đọc.</p>
            )}
          </article>
        )}

        {/* Bottom Page Navigation Controls */}
        <div className="mt-14 pt-8 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
          <button
            onClick={onPrevChapter}
            disabled={currentChapterIndex === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-30 text-xs font-bold cursor-pointer transition active:scale-95 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Chương trước</span>
          </button>

          <span className="text-xs opacity-50 font-mono">
            {currentChapterIndex + 1} / {totalChapters}
          </span>

          <button
            onClick={onNextChapter}
            disabled={currentChapterIndex >= totalChapters - 1}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95 shadow-md shadow-emerald-950/20"
          >
            <span>Chương tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
