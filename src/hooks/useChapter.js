import { useState, useEffect, useRef } from 'react';
import { extractSingleChapter, isJunkTitle } from '../services/epubParser';

export function useChapter(book, currentChapterIndex) {
  const [chapterContent, setChapterContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bộ nhớ đệm (RAM Cache) lưu các chương đã giải nén
  const cacheRef = useRef(new Map());

  // Hàm hỗ trợ nạp 1 chương vào cache
  const loadChapterToCache = async (bookObj, index) => {
    if (!bookObj || !bookObj.toc || index < 0 || index >= bookObj.toc.length) return null;
    const cacheKey = `${bookObj.id}_ch_${index}`;

    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }

    const tocItem = bookObj.toc[index];
    const rawTitle = tocItem.title;
    const defaultTitle = !isJunkTitle(rawTitle) ? rawTitle : `Chương ${index + 1}`;
    const extracted = await extractSingleChapter(
      bookObj.epubBlob,
      bookObj.opfDir || '',
      tocItem.href,
      defaultTitle,
      index
    );

    cacheRef.current.set(cacheKey, extracted);

    // Giới hạn Cache 30 chương gần nhất trong RAM
    if (cacheRef.current.size > 30) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    return extracted;
  };

  useEffect(() => {
    if (!book || !book.toc || currentChapterIndex < 0 || currentChapterIndex >= book.toc.length) {
      setChapterContent(null);
      return;
    }

    const cacheKey = `${book.id}_ch_${currentChapterIndex}`;

    // 1. Nếu đã có trong Cache -> Đọc tức thì 0ms!
    if (cacheRef.current.has(cacheKey)) {
      setChapterContent(cacheRef.current.get(cacheKey));
      setLoading(false);

      // Nạp ngầm chương tiếp theo (N+1 và N+2) vào Cache trước để sẵn sàng
      loadChapterToCache(book, currentChapterIndex + 1);
      loadChapterToCache(book, currentChapterIndex + 2);
      return;
    }

    let isSubscribed = true;

    // 2. Nếu chưa có -> Bóc tách siêu tốc (chỉ tốn ~2ms nhờ Zip Entries Cache)
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const extracted = await loadChapterToCache(book, currentChapterIndex);

        if (isSubscribed) {
          setChapterContent(extracted);
          setLoading(false);

          // Nạp ngầm 2 chương tiếp theo vào cache trong background
          setTimeout(() => {
            loadChapterToCache(book, currentChapterIndex + 1);
            loadChapterToCache(book, currentChapterIndex + 2);
          }, 50);
        }
      } catch (err) {
        console.error('Lỗi tải chương:', err);
        if (isSubscribed) {
          setError('Không thể bóc tách nội dung chương');
          setLoading(false);
        }
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [book, currentChapterIndex]);

  return {
    chapterContent,
    loading,
    error
  };
}
