import React, { useRef, useState } from 'react';
import { Download, Upload, X, RefreshCw } from 'lucide-react';
import { db } from '../db/database';

export function SyncModal({ isOpen, onClose, onRefreshProgress }) {
  const jsonInputRef = useRef(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [errorStatus, setErrorStatus] = useState('');

  if (!isOpen) return null;

  const handleExportProgress = async () => {
    try {
      setErrorStatus('');
      const allProgress = await db.progress.toArray();
      const allBooksMeta = await db.books.toArray();

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        progressList: allProgress.map((p) => ({
          bookId: p.bookId,
          chapterIndex: p.chapterIndex,
          sentenceIndex: p.sentenceIndex,
          scrollOffset: p.scrollOffset,
          updatedAt: p.updatedAt
        })),
        booksMeta: allBooksMeta.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `epub-audio-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setSyncStatus('Đã xuất file tiến trình JSON thành công!');
    } catch (err) {
      console.error('Lỗi xuất tiến trình:', err);
      setErrorStatus('Không thể xuất dữ liệu tiến trình đọc');
    }
  };

  const handleImportProgress = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorStatus('');
      setSyncStatus('Đang nạp file tiến trình...');
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.progressList || !Array.isArray(data.progressList)) {
        throw new Error('Định dạng file tiến trình JSON không hợp lệ.');
      }

      for (const item of data.progressList) {
        if (item.bookId) {
          await db.progress.put({
            bookId: item.bookId,
            chapterIndex: item.chapterIndex || 0,
            sentenceIndex: item.sentenceIndex || 0,
            scrollOffset: item.scrollOffset || 0,
            updatedAt: item.updatedAt || Date.now()
          });
        }
      }

      setSyncStatus(`Đã nhập thành công tiến trình đọc (${data.progressList.length} cuốn sách)!`);
      if (onRefreshProgress) onRefreshProgress();
    } catch (err) {
      console.error('Lỗi nhập tiến trình:', err);
      setErrorStatus(err.message || 'Không thể đọc file tiến trình JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Đồng bộ Tiến trình Offline</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-neutral-400 leading-relaxed">
            Bạn có thể xuất lịch sử & vị trí đang đọc ra file JSON nhỏ gọn để truyền sang thiết bị khác (điện thoại, máy tính) mà không cần kết nối internet hay máy chủ.
          </p>

          {syncStatus && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-medium">
              {syncStatus}
            </div>
          )}

          {errorStatus && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-medium">
              {errorStatus}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 pt-2">
            <button
              onClick={handleExportProgress}
              className="w-full p-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500 rounded-xl text-left transition cursor-pointer group flex items-start gap-3"
            >
              <div className="p-2.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg group-hover:bg-emerald-900 transition shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-emerald-400 text-sm group-hover:text-emerald-300">
                  Tải về file Tiến trình (.json)
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Xuất dấu trang & vị trí câu đang đọc hiện tại
                </div>
              </div>
            </button>

            <button
              onClick={() => jsonInputRef.current?.click()}
              className="w-full p-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500 rounded-xl text-left transition cursor-pointer group flex items-start gap-3"
            >
              <div className="p-2.5 bg-neutral-900 text-neutral-300 border border-neutral-700 rounded-lg group-hover:bg-neutral-800 transition shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-neutral-200 text-sm group-hover:text-white">
                  Nhập file Tiến trình (.json)
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Tải lên file JSON để khôi phục bookmark từ máy khác
                </div>
              </div>
            </button>
          </div>

          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            onChange={handleImportProgress}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold cursor-pointer"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
