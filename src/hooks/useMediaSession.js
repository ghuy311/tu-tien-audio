import { useEffect } from 'react';

export function useMediaSession({ bookTitle, chapterTitle, coverUrl, isPlaying, onPlay, onPause, onNext, onPrev }) {
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Cập nhật thông tin trên màn hình khóa / trung tâm thông báo
    navigator.mediaSession.metadata = new MediaMetadata({
      title: chapterTitle || 'EPUB Audio Reader',
      artist: bookTitle || 'Audiobook',
      album: 'EPUB Reader',
      artwork: coverUrl ? [{ src: coverUrl, sizes: '512x512', type: 'image/png' }] : []
    });

    // Đăng ký các sự kiện điều khiển từ tai nghe / màn hình khóa
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (onPlay) onPlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (onPause) onPause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (onPrev) onPrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (onNext) onNext();
      });
    } catch (e) {
      console.warn('MediaSession handler không được hỗ trợ đầy đủ trên trình duyệt này:', e);
    }
  }, [bookTitle, chapterTitle, coverUrl, onPlay, onPause, onNext, onPrev]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);
}
