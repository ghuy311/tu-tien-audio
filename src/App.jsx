import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBooks } from './hooks/useBooks';
import { useChapter } from './hooks/useChapter';
import { useTTS } from './hooks/useTTS';
import { useMediaSession } from './hooks/useMediaSession';
import { useWakeLock } from './hooks/useWakeLock';
import { getSettings, saveSettings, getReadingProgress, saveReadingProgress } from './db/database';

import { LibraryView } from './components/LibraryView';
import { ReaderView } from './components/ReaderView';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { TocDrawer } from './components/TocDrawer';
import { SettingsModal } from './components/SettingsModal';
import { SyncModal } from './components/SyncModal';

export default function App() {
  const { books, loading, error, importBook, deleteBook, getBook, refreshBooks } = useBooks();

  const [view, setView] = useState('library');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  const [settings, setSettingsState] = useState({
    voiceURI: '',
    rate: 1.0,
    pitch: 1.0,
    fontSize: 19,
    fontFamily: 'lora',
    theme: 'dark'
  });

  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);

  useEffect(() => {
    getSettings().then((res) => {
      if (res) setSettingsState(res);
    });
  }, []);

  const updateSettings = async (newPartial) => {
    const updated = { ...settings, ...newPartial };
    setSettingsState(updated);
    await saveSettings(updated);
  };

  useEffect(() => {
    if (!selectedBookId) {
      setCurrentBook(null);
      return;
    }

    let isMounted = true;
    (async () => {
      const bookObj = await getBook(selectedBookId);
      if (bookObj && isMounted) {
        setCurrentBook(bookObj);
        const progress = await getReadingProgress(selectedBookId);
        if (progress) {
          setCurrentChapterIndex(progress.chapterIndex || 0);
          setCurrentSentenceIndex(progress.sentenceIndex || 0);
        } else {
          setCurrentChapterIndex(0);
          setCurrentSentenceIndex(0);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedBookId, getBook]);

  const { chapterContent, loading: chapterLoading } = useChapter(currentBook, currentChapterIndex);

  const currentChapterSentences = useMemo(() => {
    return chapterContent?.sentences || [];
  }, [chapterContent]);

  const totalChapters = currentBook?.toc?.length || currentBook?.chapters?.length || 0;

  const handleChapterEnd = useCallback(() => {
    if (!currentBook) return;
    const maxChaps = currentBook.toc?.length || currentBook.chapters?.length || 0;
    if (currentChapterIndex < maxChaps - 1) {
      const nextChapIdx = currentChapterIndex + 1;
      setCurrentChapterIndex(nextChapIdx);
      setCurrentSentenceIndex(0);
      saveReadingProgress(selectedBookId, nextChapIdx, 0);
    }
  }, [currentBook, currentChapterIndex, selectedBookId]);

  const handleSentenceChange = useCallback((newSentenceIdx) => {
    setCurrentSentenceIndex(newSentenceIdx);
    if (selectedBookId) {
      saveReadingProgress(selectedBookId, currentChapterIndex, newSentenceIdx);
    }
  }, [selectedBookId, currentChapterIndex]);

  const tts = useTTS(
    currentChapterSentences,
    handleSentenceChange,
    handleChapterEnd
  );

  useWakeLock(tts.isPlaying);

  useMediaSession({
    bookTitle: currentBook?.title,
    chapterTitle: chapterContent?.title || currentBook?.toc?.[currentChapterIndex]?.title,
    coverUrl: currentBook?.coverUrl,
    isPlaying: tts.isPlaying,
    onPlay: () => tts.play(currentSentenceIndex),
    onPause: tts.pause,
    onNext: tts.nextSentence,
    onPrev: tts.prevSentence
  });

  const handleSelectBook = (bookId) => {
    setSelectedBookId(bookId);
    setView('reader');
  };

  const handleBackToLibrary = () => {
    tts.stop();
    setView('library');
  };

  const handleSelectChapter = (chapIdx) => {
    tts.stop();
    setCurrentChapterIndex(chapIdx);
    setCurrentSentenceIndex(0);
    saveReadingProgress(selectedBookId, chapIdx, 0);
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      handleSelectChapter(currentChapterIndex - 1);
    }
  };

  const handleNextChapter = () => {
    if (currentBook && currentChapterIndex < totalChapters - 1) {
      handleSelectChapter(currentChapterIndex + 1);
    }
  };

  const handleSentenceClick = (sentenceIdx) => {
    setCurrentSentenceIndex(sentenceIdx);
    saveReadingProgress(selectedBookId, currentChapterIndex, sentenceIdx);
    tts.jumpToSentence(sentenceIdx);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {view === 'library' ? (
        <LibraryView
          books={books}
          loading={loading}
          onSelectBook={handleSelectBook}
          onDeleteBook={deleteBook}
          onImportBook={importBook}
          onOpenSync={() => setIsSyncOpen(true)}
        />
      ) : (
        <>
          <ReaderView
            book={currentBook}
            currentChapterIndex={currentChapterIndex}
            currentSentenceIndex={currentSentenceIndex}
            chapterContent={chapterContent}
            chapterLoading={chapterLoading}
            isPlaying={tts.isPlaying}
            hasVietnameseVoice={tts.hasVietnameseVoice}
            fontSize={settings.fontSize}
            fontFamily={settings.fontFamily}
            theme={settings.theme || 'dark'}
            onChangeTheme={(newTheme) => updateSettings({ theme: newTheme })}
            onSentenceClick={handleSentenceClick}
            onPrevChapter={handlePrevChapter}
            onNextChapter={handleNextChapter}
            onBackToLibrary={handleBackToLibrary}
            onOpenToc={() => setIsTocOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          <AudioPlayerBar
            isPlaying={tts.isPlaying}
            isPaused={tts.isPaused}
            currentSentenceIndex={currentSentenceIndex}
            totalSentences={currentChapterSentences.length}
            currentChapterTitle={chapterContent?.title || currentBook?.toc?.[currentChapterIndex]?.title || ''}
            rate={tts.rate}
            onPlay={() => tts.play(currentSentenceIndex)}
            onPause={tts.pause}
            onPrevSentence={tts.prevSentence}
            onNextSentence={tts.nextSentence}
            onRewind15s={tts.rewind15s}
            onForward15s={tts.forward15s}
            onPrevChapter={handlePrevChapter}
            onNextChapter={handleNextChapter}
            onChangeRate={(newRate) => {
              tts.changeRate(newRate);
              updateSettings({ rate: newRate });
            }}
            onJumpToSentence={handleSentenceClick}
            onOpenToc={() => setIsTocOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </>
      )}

      {/* Modals & Drawers */}
      <TocDrawer
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        chapters={currentBook?.toc || currentBook?.chapters || []}
        currentChapterIndex={currentChapterIndex}
        onSelectChapter={handleSelectChapter}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voices={tts.voices}
        selectedVoiceURI={tts.selectedVoiceURI}
        rate={tts.rate}
        pitch={tts.pitch}
        fontSize={settings.fontSize}
        fontFamily={settings.fontFamily}
        theme={settings.theme || 'dark'}
        onChangeVoice={tts.changeVoice}
        onChangeRate={(val) => {
          tts.changeRate(val);
          updateSettings({ rate: val });
        }}
        onChangePitch={(val) => {
          tts.changePitch(val);
          updateSettings({ pitch: val });
        }}
        onChangeFontSize={(val) => updateSettings({ fontSize: val })}
        onChangeFontFamily={(val) => updateSettings({ fontFamily: val })}
        onChangeTheme={(val) => updateSettings({ theme: val })}
      />

      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onRefreshProgress={refreshBooks}
      />
    </div>
  );
}
