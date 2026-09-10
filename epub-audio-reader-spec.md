# Project Specification: EPUB Audio Reader PWA (Offline-First)

## 1. Overview & Objective
Build a lightweight, clean, offline-first Progressive Web Application (PWA) tailored for personal use to read and listen to EPUB novels on both Desktop (PC) and Mobile (Android / iOS).

- **Core interaction:** Load local `.epub` files, parse contents locally, and read text aloud sentence-by-sentence using client-side Text-To-Speech (Web Speech API).
- **Network requirement:** 100% functional offline (zero external API calls required during runtime).
- **Platform support:** Desktop browsers + Mobile browsers installed as PWA (Add to Home Screen).

---

## 2. Tech Stack
- **Framework:** React 19 / Vite + TypeScript
- **Styling:** Tailwind CSS (Clean Dark Mode by default, mobile-friendly touch targets)
- **Icons:** `lucide-react`
- **EPUB Parser:** `epubjs` or `@zip.js/zip.js` + DOMParser (client-side unpack and XML parsing)
- **Local Database:** `idb` or `dexie` (IndexedDB for storing `.epub` blobs, parsed chapters, settings, and playback state)
- **PWA Service Worker:** `vite-plugin-pwa` (offline caching of application bundle)

---

## 3. Core Features & Specifications

### A. File Management & Local Library
1. **Import EPUB:**
   - Drag & drop or file picker for `.epub`.
   - Store book blob directly into IndexedDB (`books` store: `id`, `title`, `author`, `coverUrl`, `blob`, `lastReadAt`).
   - Extract Table of Contents (TOC) and chapter list.
2. **Book Library:**
   - Simple list/card view of imported books.
   - Delete book button with confirmation.
   - Continue reading shortcut on recent book.

### B. Reader & Text-to-Speech (TTS) Engine
1. **Content Extraction:**
   - Parse chapter HTML/XHTML to plain text, stripping non-content tags (scripts, styles, nav).
   - Chunk text into individual sentences/phrases using regex (splits on `.`, `!`, `?`, `\n`, `...`).
2. **Web Speech Synthesis (`window.speechSynthesis`):**
   - Sequential sentence reading queue: when `utterance.onend` fires, advance to next sentence index.
   - Voice selector: filter and highlight Vietnamese voices (`vi-VN`, `vi_VN`) available on host OS. Fallback to default voice if not found.
   - Playback Controls: Play / Pause, Next / Previous Sentence, Rewind / Forward 15s (approx. 3-4 sentences), Speed modifier slider (`0.8x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`), Pitch adjustment.
3. **Reading Sync & Auto-scroll:**
   - Highlight current sentence in reader view.
   - Automatically scroll view smoothly (`scrollIntoView({ behavior: 'smooth', block: 'center' })`) as voice progresses.
   - Clicking any sentence jumps playback to that specific sentence immediately.

### C. Mobile & Background Audio Optimization
1. **Screen Wake Lock API:**
   - Request `navigator.wakeLock.request('screen')` during playback to prevent mobile screen from sleeping.
   - Re-acquire wake lock on visibility change if playback is active.
2. **Media Session API (`navigator.mediaSession`):**
   - Populate metadata: title = book name, artist = chapter title.
   - Setup action handlers: `play`, `pause`, `previoustrack` (previous chapter/sentence), `nexttrack` (next chapter/sentence).
3. **Keep-Alive Loop (Workaround for mobile tab freezing):**
   - Optional: short looping silent HTML5 Audio element played concurrently so browser treats playback as background media.

### D. Progress Persistence & Cross-Device Sync
1. **Auto-save State:**
   - Save current state after every sentence played: `{ bookId, chapterIndex, sentenceIndex, scrollOffset, updatedAt }`.
   - On app reload / reopen, automatically restore the exact reading position.
2. **Offline Manual Sync (JSON Export / Import):**
   - **Export Progress:** Download small `.json` file containing reading bookmarks & progress metrics.
   - **Import Progress:** Upload JSON on another device to synchronize reading state without needing cloud servers.

---

## 4. UI / UX Design Requirements
- **Theme:** Dark mode first (`bg-neutral-950`, text `text-neutral-200`, accent `emerald-500` or `indigo-500`).
- **Layout:**
  - *Mobile:* Sticky bottom audio player bar with big touch targets (min 44px) for Play/Pause, speed toggle, and drawer for Chapter TOC.
  - *Desktop:* Two-column or collapsible sidebar layout (Sidebar: TOC & Library; Main: Reading pane with top/bottom floating player bar).
- **Typography:** Configurable font sizes (`16px` to `24px`), font family switcher (Sans / Serif), line height `leading-relaxed`.

---

## 5. Implementation Roadmap (Phases for Agent)

- **Phase 1: Project Setup & PWA Configuration**
  - Scaffold Vite + React + TypeScript + Tailwind.
  - Configure `vite-plugin-pwa` with manifest (name: "EPUB Audio Reader", standalone display, icons, offline caching).
  - Setup IndexedDB schema.

- **Phase 2: EPUB Parser & Reader UI**
  - Implement EPUB unpacker/parser and TOC navigation.
  - Render chapter text with sentence segmentation.

- **Phase 3: TTS Engine & Player Controls**
  - Build custom hook `useTTS(sentences, onSentenceChange)` handling pause, resume, speed, and OS voice listing.
  - Implement UI player bar with interactive progress slider.

- **Phase 4: Mobile Background Controls & Sync**
  - Integrate `MediaSession` & `WakeLock`.
  - Add Export / Import JSON progress buttons.
