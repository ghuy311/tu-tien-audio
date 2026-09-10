import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/database';
import { parseEpubMetadata } from '../services/epubParser';

export function useBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      // Chỉ tải thông tin cơ bản của sách (không tải toàn bộ blob hay dung lượng lớn vào danh sách)
      const allBooks = await db.books.orderBy('lastReadAt').reverse().toArray();
      setBooks(allBooks);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sách:', err);
      setError('Không thể tải thư viện sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const importBook = async (file) => {
    try {
      setLoading(true);
      // Chỉ bóc tách Metadata & Danh mục chương (Siêu nhanh, chỉ tốn vài trăm ms cho 3000+ chương)
      const parsedData = await parseEpubMetadata(file);

      const bookRecord = {
        title: parsedData.title,
        author: parsedData.author,
        coverUrl: parsedData.coverUrl,
        opfDir: parsedData.opfDir || '',
        toc: parsedData.toc || [],
        epubBlob: file, // Lưu file blob nguyên bản vào IndexedDB để giải nén chương theo nhu cầu
        createdAt: Date.now(),
        lastReadAt: Date.now()
      };

      const id = await db.books.add(bookRecord);

      await db.progress.put({
        bookId: id,
        chapterIndex: 0,
        sentenceIndex: 0,
        scrollOffset: 0,
        updatedAt: Date.now()
      });

      await loadBooks();
      return id;
    } catch (err) {
      console.error('Lỗi khi nhập file EPUB:', err);
      throw new Error(err.message || 'Lỗi khi nhập file EPUB');
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (id) => {
    try {
      await db.books.delete(id);
      await db.progress.delete(id);
      await loadBooks();
    } catch (err) {
      console.error('Lỗi khi xóa sách:', err);
      throw err;
    }
  };

  const getBook = async (id) => {
    return await db.books.get(id);
  };

  return {
    books,
    loading,
    error,
    importBook,
    deleteBook,
    getBook,
    refreshBooks: loadBooks
  };
}
