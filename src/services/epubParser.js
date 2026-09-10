import { ZipReader, BlobReader, TextWriter, BlobWriter } from '@zip.js/zip.js';

// Session Cache giữ danh sách Zip Entries của cuốn sách đang mở trong bộ nhớ
// Giúp tránh việc phải đọc lại toàn bộ cấu trúc file Zip (5000+ file) mỗi lần chuyển chương
let activeZipSession = {
  blob: null,
  entriesMap: null
};

/**
 * Nạp danh sách file trong Zip 1 LẦN DUY NHẤT cho cuốn sách đang mở.
 * Các lần chuyển chương tiếp theo sẽ dùng lại entriesMap này (tốn 0ms).
 */
export async function getZipEntriesMap(epubBlob) {
  if (activeZipSession.blob === epubBlob && activeZipSession.entriesMap) {
    return activeZipSession.entriesMap;
  }

  const reader = new ZipReader(new BlobReader(epubBlob));
  const entries = await reader.getEntries();
  const entriesMap = new Map();
  for (const entry of entries) {
    entriesMap.set(entry.filename, entry);
  }

  activeZipSession = {
    blob: epubBlob,
    entriesMap
  };

  return entriesMap;
}

/**
 * Tách đoạn văn bản thành danh sách câu hoàn chỉnh để đọc qua TTS
 */
export function chunkTextIntoSentences(text) {
  if (!text) return [];

  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();

  if (!cleanedText) return [];

  const rawSentences = cleanedText.split(/(?<=[.!?…\n])\s+|(?<=\n)/g);
  const sentences = [];
  let buffer = '';

  for (let s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    if (trimmed.length < 3 && buffer) {
      buffer += ' ' + trimmed;
    } else {
      if (buffer) {
        sentences.push(buffer);
        buffer = '';
      }
      if (trimmed.length < 3) {
        buffer = trimmed;
      } else {
        sentences.push(trimmed);
      }
    }
  }

  if (buffer) {
    sentences.push(buffer);
  }

  return sentences.length > 0 ? sentences : [cleanedText];
}

/**
 * Bóc tách siêu tốc Metadata & Danh mục chương (TOC)
 */
export async function parseEpubMetadata(epubBlob) {
  const entryMap = await getZipEntriesMap(epubBlob);

  const containerEntry = entryMap.get('META-INF/container.xml');
  if (!containerEntry) {
    throw new Error('File EPUB không hợp lệ: Thiếu META-INF/container.xml');
  }

  const containerXmlText = await containerEntry.getData(new TextWriter());
  const domParser = new DOMParser();
  const containerDoc = domParser.parseFromString(containerXmlText, 'text/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  if (!rootfileEl) {
    throw new Error('File EPUB không hợp lệ: Không tìm thấy rootfile');
  }

  const opfPath = rootfileEl.getAttribute('full-path');
  const opfEntry = entryMap.get(opfPath);
  if (!opfEntry) {
    throw new Error(`Không tìm thấy file OPF tại đường dẫn: ${opfPath}`);
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  const opfText = await opfEntry.getData(new TextWriter());
  const opfDoc = domParser.parseFromString(opfText, 'text/xml');

  const titleEl = opfDoc.querySelector('title') || opfDoc.querySelector('dc\\:title');
  const title = titleEl ? titleEl.textContent.trim() : 'Sách không tiêu đề';

  const creatorEl = opfDoc.querySelector('creator') || opfDoc.querySelector('dc\\:creator');
  const author = creatorEl ? creatorEl.textContent.trim() : 'Tác giả chưa rõ';

  const manifestItems = new Map();
  const itemEls = opfDoc.querySelectorAll('manifest > item');
  itemEls.forEach(item => {
    manifestItems.set(item.getAttribute('id'), {
      href: item.getAttribute('href'),
      mediaType: item.getAttribute('media-type'),
      properties: item.getAttribute('properties') || ''
    });
  });

  let coverUrl = null;
  let coverItem = null;

  const coverMeta = opfDoc.querySelector('meta[name="cover"]');
  if (coverMeta) {
    const coverId = coverMeta.getAttribute('content');
    coverItem = manifestItems.get(coverId);
  }
  if (!coverItem) {
    for (const item of manifestItems.values()) {
      if (item.properties.includes('cover-image') || item.href.toLowerCase().includes('cover')) {
        coverItem = item;
        break;
      }
    }
  }

  if (coverItem) {
    const fullCoverPath = normalizePath(opfDir + coverItem.href);
    const coverEntry = entryMap.get(fullCoverPath);
    if (coverEntry) {
      const coverBlob = await coverEntry.getData(new BlobWriter(coverItem.mediaType || 'image/jpeg'));
      coverUrl = URL.createObjectURL(coverBlob);
    }
  }

  const spineItemRefs = opfDoc.querySelectorAll('spine > itemref');
  const toc = [];

  let index = 0;
  for (const ref of spineItemRefs) {
    const idref = ref.getAttribute('idref');
    const manifestItem = manifestItems.get(idref);
    if (!manifestItem) continue;

    const chapterHref = manifestItem.href;
    const chapterTitle = `Chương ${index + 1}`;
    toc.push({
      index,
      href: chapterHref,
      title: chapterTitle
    });
    index++;
  }

  return {
    title,
    author,
    coverUrl,
    opfDir,
    toc
  };
}

/**
 * [SIÊU TỐC 2MS] Bóc tách duy nhất 1 chương bằng cách dùng lại Zip Entries Map đã cached.
 */
export async function extractSingleChapter(epubBlob, opfDir = '', chapterHref, defaultTitle = '') {
  if (!epubBlob || !chapterHref) {
    return { title: defaultTitle || 'Chương không xác định', sentences: [], rawText: '' };
  }

  // Dùng lại entriesMap đã nạp sẵn trong RAM (Tốn 0ms)
  const entryMap = await getZipEntriesMap(epubBlob);

  const fullPath = normalizePath(opfDir + chapterHref);
  let chapterEntry = entryMap.get(fullPath);

  if (!chapterEntry) {
    for (const [filename, entry] of entryMap.entries()) {
      if (filename.endsWith(chapterHref) || filename.includes(chapterHref)) {
        chapterEntry = entry;
        break;
      }
    }
  }

  if (!chapterEntry) {
    return { title: defaultTitle || 'Chương không tìm thấy', sentences: ['Nội dung chương không tồn tại trong file EPUB.'], rawText: '' };
  }

  // Đọc nội dung HTML chương (chỉ tốn khoảng 2-5ms)
  const htmlContent = await chapterEntry.getData(new TextWriter());
  const domParser = new DOMParser();
  const chapterDoc = domParser.parseFromString(htmlContent, 'text/html');

  const selectorsToRemove = ['script', 'style', 'head', 'nav', 'svg', 'iframe'];
  selectorsToRemove.forEach(sel => {
    chapterDoc.querySelectorAll(sel).forEach(el => el.remove());
  });

  let chapterTitle = defaultTitle;
  const headingEl = chapterDoc.querySelector('h1, h2, h3, title');
  if (headingEl && headingEl.textContent.trim()) {
    chapterTitle = headingEl.textContent.trim();
  }

  const bodyText = chapterDoc.body ? chapterDoc.body.textContent : chapterDoc.textContent;
  const cleanText = bodyText.replace(/\s+/g, ' ').trim();
  const sentences = chunkTextIntoSentences(cleanText);

  return {
    title: chapterTitle,
    sentences,
    rawText: cleanText
  };
}

function normalizePath(path) {
  const parts = path.split('/');
  const stack = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}
