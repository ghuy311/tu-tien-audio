import Dexie from 'dexie';

export const db = new Dexie('EpubAudioReaderDB');

db.version(1).stores({
  books: '++id, title, author, createdAt, lastReadAt',
  progress: 'bookId, updatedAt',
  settings: 'id'
});

export const DEFAULT_SETTINGS = {
  id: 'user_settings',
  voiceURI: '',
  rate: 1.0,
  pitch: 1.0,
  fontSize: 19, // px
  fontFamily: 'lora', // 'lora' | 'merriweather' | 'inter' | 'mono-reader'
  theme: 'dark' // 'dark' | 'sepia' | 'paper' | 'slate'
};

export async function getSettings() {
  const current = await db.settings.get('user_settings');
  return current ? { ...DEFAULT_SETTINGS, ...current } : DEFAULT_SETTINGS;
}

export async function saveSettings(newSettings) {
  const updated = { ...DEFAULT_SETTINGS, ...newSettings, id: 'user_settings' };
  await db.settings.put(updated);
  return updated;
}

export async function saveReadingProgress(bookId, chapterIndex, sentenceIndex, scrollOffset = 0) {
  if (!bookId) return;
  const progressData = {
    bookId,
    chapterIndex,
    sentenceIndex,
    scrollOffset,
    updatedAt: Date.now()
  };
  await db.progress.put(progressData);
  await db.books.update(bookId, { lastReadAt: Date.now() });
}

export async function getReadingProgress(bookId) {
  if (!bookId) return null;
  return await db.progress.get(bookId);
}
