import React, { useRef, useState } from 'react';
import { BookOpen, Plus, RefreshCw, UploadCloud, Trash2, Play, X } from 'lucide-react';

export function LibraryView({ books, loading, onSelectBook, onDeleteBook, onImportBook, onOpenSync }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.epub')) {
      setErrorMessage('Vui lòng chọn file có định dạng .epub');
      return;
    }

    try {
      setErrorMessage('');
      setImporting(true);
      const bookId = await onImportBook(file);
      if (bookId) {
        onSelectBook(bookId);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi nhập file EPUB');
    } finally {
      setImporting(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              EPUB Audio Reader
            </h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Thư viện sách nói offline • Đọc văn bản bằng giọng nói trí tuệ nhân tạo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSync}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-sm font-medium transition cursor-pointer border border-neutral-700 active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Đồng bộ Tiến trình</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition cursor-pointer shadow-lg shadow-emerald-950/50 active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{importing ? 'Đang bóc tách file...' : 'Thêm sách EPUB'}</span>
          </button>
        </div>
      </header>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-6 p-4 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-sm flex justify-between items-center">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            className="text-red-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Import / Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-8 p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition ${
          isDragging
            ? 'border-emerald-500 bg-emerald-950/20'
            : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900'
        }`}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="p-3 bg-neutral-800/80 text-emerald-400 rounded-full mb-3">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-base font-semibold text-neutral-300">
            Kéo & thả file .epub vào đây hoặc bấm để chọn từ thiết bị
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Hỗ trợ tất cả file EPUB chuẩn. Tất cả dữ liệu được lưu hoàn toàn trên bộ nhớ trình duyệt offline của bạn.
          </p>
        </div>
      </div>

      {/* Book Grid */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <span>Tủ sách của bạn ({books.length})</span>
        </h2>

        {loading && books.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            Đang tải dữ liệu thư viện...
          </div>
        ) : books.length === 0 ? (
          <div className="py-16 text-center border border-neutral-900 rounded-xl bg-neutral-900/20">
            <p className="text-neutral-400 font-medium">Chưa có cuốn sách nào trong thư viện</p>
            <p className="text-sm text-neutral-600 mt-1">Hãy bấm vào nút Thêm sách EPUB để bắt đầu trải nghiệm nghe đọc sách.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 flex flex-col justify-between transition hover:shadow-xl hover:shadow-black/40 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-white text-base line-clamp-2 group-hover:text-emerald-400 transition">
                      {book.title}
                    </h3>
                  </div>

                  <p className="text-xs font-medium text-emerald-500 mt-1">
                    {book.author}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                    <span>Số chương: {book.toc?.length || book.chapters?.length || 0}</span>
                    <span>{new Date(book.lastReadAt || book.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Bạn có chắc muốn xóa cuốn sách "${book.title}" khỏi thiết bị?`)) {
                        onDeleteBook(book.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-950/40 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>

                  <button
                    onClick={() => onSelectBook(book.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mở đọc sách</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
