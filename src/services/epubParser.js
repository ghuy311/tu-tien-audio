import { ZipReader, BlobReader, TextWriter, BlobWriter } from '@zip.js/zip.js';

export function isJunkTitle(title) {
  if (!title || typeof title !== 'string') return true;
  const t = title.trim().toLowerCase();
  if (
    t === '' ||
    t === 'unknown' ||
    t === 'unknow' ||
    t === 'untitled' ||
    t === 'no title' ||
    t === 'chương không xác định' ||
    t === 'chương không tìm thấy' ||
    t === 'sách không tiêu đề' ||
    t === 'tác giả chưa rõ' ||
    t === 'toc' ||
    t === 'table of contents'
  ) {
    return true;
  }
  if (/\.(xhtml|html|htm|xml|php|txt)$/i.test(t)) {
    return true;
  }
  return false;
}

let activeZipSession = {
  blob: null,
  entriesMap: null
};

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
 * Đọc toàn bộ Tên chương thật từ NCX/NAV trong 15ms khi nhập file.
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
  const rawBookTitle = titleEl ? titleEl.textContent.trim() : '';
  const title = !isJunkTitle(rawBookTitle) ? rawBookTitle : 'Sách không tiêu đề';

  const creatorEl = opfDoc.querySelector('creator') || opfDoc.querySelector('dc\\:creator');
  const author = creatorEl ? creatorEl.textContent.trim() : 'Tác giả chưa rõ';

  const manifestItems = new Map();
  let ncxItem = null;
  let navItem = null;

  const itemEls = opfDoc.querySelectorAll('manifest > item');
  itemEls.forEach(item => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type');
    const properties = item.getAttribute('properties') || '';

    manifestItems.set(id, { href, mediaType, properties });

    if (mediaType === 'application/x-dtbncx+xml' || id === 'ncx' || href.endsWith('.ncx')) {
      ncxItem = { href, mediaType };
    }
    if (properties.includes('nav') || href.includes('nav.')) {
      navItem = { href, mediaType };
    }
  });

  const realChapterTitlesMap = new Map();

  if (ncxItem) {
    try {
      const ncxPath = normalizePath(opfDir + ncxItem.href);
      const ncxEntry = entryMap.get(ncxPath);
      if (ncxEntry) {
        const ncxText = await ncxEntry.getData(new TextWriter());
        const ncxDoc = domParser.parseFromString(ncxText, 'text/xml');
        const navPoints = ncxDoc.querySelectorAll('navPoint');
        navPoints.forEach(np => {
          const textEl = np.querySelector('navLabel > text');
          const contentEl = np.querySelector('content');
          if (textEl && contentEl) {
            const rawTitle = textEl.textContent.trim();
            const src = contentEl.getAttribute('src');
            if (rawTitle && src && !isJunkTitle(rawTitle)) {
              const cleanSrc = src.split('#')[0];
              realChapterTitlesMap.set(cleanSrc, rawTitle);
              realChapterTitlesMap.set(normalizePath(cleanSrc), rawTitle);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Không thể parse NCX TOC:', e);
    }
  }

  if (realChapterTitlesMap.size === 0 && navItem) {
    try {
      const navPath = normalizePath(opfDir + navItem.href);
      const navEntry = entryMap.get(navPath);
      if (navEntry) {
        const navText = await navEntry.getData(new TextWriter());
        const navDoc = domParser.parseFromString(navText, 'text/html');
        const aElements = navDoc.querySelectorAll('nav a, a[href]');
        aElements.forEach(a => {
          const href = a.getAttribute('href');
          const text = a.textContent.trim();
          if (href && text && !isJunkTitle(text)) {
            const cleanSrc = href.split('#')[0];
            realChapterTitlesMap.set(cleanSrc, text);
            realChapterTitlesMap.set(normalizePath(cleanSrc), text);
          }
        });
      }
    } catch (e) {
      console.warn('Không thể parse NAV TOC:', e);
    }
  }

  // Cover Image
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

    const rawTitle =
      realChapterTitlesMap.get(chapterHref) ||
      realChapterTitlesMap.get(normalizePath(chapterHref));

    let chapterTitle = (!isJunkTitle(rawTitle))
      ? rawTitle.trim()
      : `Chương ${index + 1}`;

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
 * Bóc tách siêu tốc văn bản 1 chương (Lazy load 2ms)
 * CHUẨN HÓA:
 * 1. Tên chương được đặt làm CÂU 0 (sentences[0]) để TTS ĐỌC XƯỚNG TÊN CHƯƠNG ĐẦU TIÊN KHI MỞ/CHUYỂN CHƯƠNG.
 * 2. Nội dung thân bài phía dưới sẽ bắt đầu từ câu 1 (sentences[1]) để trình bày đẹp mắt không lặp lại tiêu đề.
 */
export async function extractSingleChapter(epubBlob, opfDir = '', chapterHref, defaultTitle = '', chapterIndex = null) {
  const fallbackTitle = (typeof chapterIndex === 'number' && chapterIndex >= 0)
    ? `Chương ${chapterIndex + 1}`
    : 'Chương không xác định';

  if (!epubBlob || !chapterHref) {
    return { title: fallbackTitle, sentences: [], rawText: '' };
  }

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
    return { title: fallbackTitle, sentences: ['Nội dung chương không tồn tại trong file EPUB.'], rawText: '' };
  }

  const htmlContent = await chapterEntry.getData(new TextWriter());
  const domParser = new DOMParser();
  const chapterDoc = domParser.parseFromString(htmlContent, 'text/html');

  // 1. Ưu tiên defaultTitle nếu không phải rác
  let chapterTitle = !isJunkTitle(defaultTitle) ? defaultTitle.trim() : '';

  // 2. Tìm heading trong <body> (chỉ h1, h2, h3 - TUYỆT ĐỐI KHÔNG DÙNG <title> TRONG <head>)
  const headingEl = chapterDoc.body ? chapterDoc.body.querySelector('h1, h2, h3') : null;
  const headingText = headingEl ? headingEl.textContent.trim() : '';

  if (!isJunkTitle(headingText)) {
    // Nếu chưa có chapterTitle hoặc chapterTitle có dạng mặc định "Chương X", nhưng trong body có tiêu đề h1/h2/h3 cụ thể hơn
    if (!chapterTitle || /^Chương\s+\d+$/i.test(chapterTitle)) {
      chapterTitle = headingText;
    }
  }

  // 3. Nếu vẫn là rác hoặc rỗng, dùng fallbackTitle theo chỉ số chương
  if (!chapterTitle || isJunkTitle(chapterTitle)) {
    chapterTitle = fallbackTitle;
  }

  // Trích xuất danh sách hình ảnh (Cover, Minh họa, Bản đồ...) trong chương trước khi xóa thẻ
  const imageElements = chapterDoc.querySelectorAll('img, image');
  const images = [];
  const chapterDir = fullPath.includes('/') ? fullPath.substring(0, fullPath.lastIndexOf('/') + 1) : '';

  for (const imgEl of imageElements) {
    const rawSrc = imgEl.getAttribute('src') || imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href');
    if (!rawSrc) continue;

    const cleanSrc = rawSrc.split('#')[0];
    const fullImgPath = normalizePath(chapterDir ? chapterDir + cleanSrc : cleanSrc);

    let imgEntry = entryMap.get(fullImgPath);
    if (!imgEntry) {
      const imgFileName = cleanSrc.substring(cleanSrc.lastIndexOf('/') + 1);
      for (const [filename, entry] of entryMap.entries()) {
        if (filename.endsWith(imgFileName)) {
          imgEntry = entry;
          break;
        }
      }
    }

    if (imgEntry) {
      try {
        const ext = fullImgPath.split('.').pop().toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
        const blob = await imgEntry.getData(new BlobWriter(mimeType));
        const imgUrl = URL.createObjectURL(blob);
        images.push(imgUrl);
      } catch (e) {
        console.warn('Lỗi bóc tách ảnh chương:', e);
      }
    }
  }

  // 1. Bóc tách các thẻ đoạn văn (<p>, <div>...) trước khi loại bỏ bớt thẻ tiêu đề
  const pElements = chapterDoc.body ? chapterDoc.body.querySelectorAll('p, div.paragraph, section > p') : [];
  const paragraphTexts = [];

  if (pElements.length > 0) {
    pElements.forEach(p => {
      const text = p.textContent.replace(/\s+/g, ' ').trim();
      if (text && text !== chapterTitle) {
        paragraphTexts.push(text);
      }
    });
  }

  // Loại bỏ các thẻ tiêu đề (H1, H2, H3, Title) và thẻ phụ khỏi DOM body để không lặp văn bản khi đọc
  const selectorsToRemove = ['script', 'style', 'head', 'nav', 'svg', 'iframe', 'h1', 'h2', 'h3', 'title'];
  selectorsToRemove.forEach(sel => {
    chapterDoc.querySelectorAll(sel).forEach(el => el.remove());
  });

  let bodyText = chapterDoc.body ? chapterDoc.body.textContent : chapterDoc.textContent;
  let cleanText = bodyText.replace(/\s+/g, ' ').trim();

  if (chapterTitle && cleanText.startsWith(chapterTitle)) {
    cleanText = cleanText.substring(chapterTitle.length).trim();
  }

  // Fallback nếu không có thẻ <p> hoặc <div>
  if (paragraphTexts.length === 0 && cleanText) {
    const rawParagraphs = cleanText.split(/\n\s*\n/);
    for (const rawP of rawParagraphs) {
      const cleaned = rawP.replace(/\s+/g, ' ').trim();
      if (cleaned && cleaned !== chapterTitle) {
        paragraphTexts.push(cleaned);
      }
    }
    if (paragraphTexts.length === 0) {
      paragraphTexts.push(cleanText);
    }
  }

  // ĐẶT TÊN CHƯƠNG LÀM CÂU ĐẦU TIÊN (SENTENCE 0) ĐỂ TTS ĐỌC XƯỚNG TÊN CHƯƠNG
  const sentences = [chapterTitle];
  const paragraphs = [];

  for (const pText of paragraphTexts) {
    const pSentences = chunkTextIntoSentences(pText);
    if (pSentences.length > 0) {
      const pIndices = [];
      for (const s of pSentences) {
        if (s === chapterTitle && sentences.length === 1) continue;
        const currentIdx = sentences.length;
        sentences.push(s);
        pIndices.push(currentIdx);
      }
      if (pIndices.length > 0) {
        paragraphs.push(pIndices);
      }
    }
  }

  return {
    title: chapterTitle,
    sentences,
    paragraphs,
    rawText: cleanText,
    images
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
