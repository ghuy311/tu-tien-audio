import { useState, useEffect, useRef, useCallback } from 'react';

export function isVietnameseVoice(voice) {
  if (!voice) return false;
  const lang = (voice.lang || '').toLowerCase();
  const name = (voice.name || '').toLowerCase();
  return (
    lang.includes('vi') ||
    lang.includes('vie') ||
    name.includes('viet') ||
    name.includes('tiếng việt') ||
    name.includes('tieng viet') ||
    name.includes('hoaimy') ||
    name.includes('namminh')
  );
}

export function useTTS(sentences = [], onSentenceChange, onChapterEnd, initialSentencePause = 0, initialVoiceURI = '') {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(initialVoiceURI);
  const [hasVietnameseVoice, setHasVietnameseVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [sentencePause, setSentencePause] = useState(initialSentencePause);

  const currentSentenceRef = useRef(currentSentenceIndex);
  const isPlayingRef = useRef(isPlaying);
  const rateRef = useRef(rate);
  const pitchRef = useRef(pitch);
  const selectedVoiceURIRef = useRef(selectedVoiceURI);
  const sentencesRef = useRef(sentences);
  const sentenceRangesRef = useRef([]);

  currentSentenceRef.current = currentSentenceIndex;
  isPlayingRef.current = isPlaying;
  rateRef.current = rate;
  pitchRef.current = pitch;
  selectedVoiceURIRef.current = selectedVoiceURI;
  sentencesRef.current = sentences;

  useEffect(() => {
    const updateVoices = () => {
      if (!('speechSynthesis' in window)) return;
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      const viVoice = availableVoices.find(isVietnameseVoice);
      setHasVietnameseVoice(!!viVoice);

      if (availableVoices.length > 0) {
        const savedVoice = initialVoiceURI && availableVoices.find(v => v.voiceURI === initialVoiceURI);
        if (savedVoice) {
          setSelectedVoiceURI(savedVoice.voiceURI);
          selectedVoiceURIRef.current = savedVoice.voiceURI;
        } else if (!selectedVoiceURIRef.current || !availableVoices.some(v => v.voiceURI === selectedVoiceURIRef.current)) {
          if (viVoice) {
            setSelectedVoiceURI(viVoice.voiceURI);
            selectedVoiceURIRef.current = viVoice.voiceURI;
          } else {
            const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
            if (defaultVoice) {
              setSelectedVoiceURI(defaultVoice.voiceURI);
              selectedVoiceURIRef.current = defaultVoice.voiceURI;
            }
          }
        }
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
      setTimeout(updateVoices, 300);
      setTimeout(updateVoices, 1000);
    }
  }, [initialVoiceURI]);

  useEffect(() => {
    if (initialVoiceURI && voices.some(v => v.voiceURI === initialVoiceURI)) {
      setSelectedVoiceURI(initialVoiceURI);
      selectedVoiceURIRef.current = initialVoiceURI;
    }
  }, [initialVoiceURI, voices]);

  // Tính toán phạm vi chỉ số ký tự (Character Ranges) cho từng câu trong chương
  const calculateRanges = (sentencesArr) => {
    let fullText = '';
    const ranges = [];

    for (let i = 0; i < sentencesArr.length; i++) {
      const s = sentencesArr[i];
      const start = fullText.length;
      fullText += s + ' ';
      const end = fullText.length;
      ranges.push({ index: i, start, end, text: s });
    }

    return { fullText, ranges };
  };

  // Khởi chạy phát luồng âm thanh liên tục (Single Continuous Stream) từ câu `startIndex`
  const startPlaybackFrom = useCallback((startIndex) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const targetSentences = sentencesRef.current;
    if (!targetSentences || startIndex < 0 || startIndex >= targetSentences.length) {
      setIsPlaying(false);
      setIsPaused(false);
      if (startIndex >= targetSentences.length && targetSentences.length > 0) {
        if (onChapterEnd) onChapterEnd();
      }
      return;
    }

    const { fullText, ranges } = calculateRanges(targetSentences);
    sentenceRangesRef.current = ranges;

    const startCharOffset = ranges[startIndex] ? ranges[startIndex].start : 0;
    const textToSpeak = fullText.substring(startCharOffset);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = rateRef.current;
    utterance.pitch = pitchRef.current;

    const currentVoiceURI = selectedVoiceURIRef.current;
    if (currentVoiceURI) {
      const voiceObj = window.speechSynthesis.getVoices().find(v => v.voiceURI === currentVoiceURI);
      if (voiceObj) utterance.voice = voiceObj;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentSentenceIndex(startIndex);
      currentSentenceRef.current = startIndex;
      if (onSentenceChange) onSentenceChange(startIndex);
    };

    // Theo dõi mốc vị trí đọc theo thời gian thực (Real-time Word/Sentence Boundary Tracking)
    utterance.onboundary = (e) => {
      if (!isPlayingRef.current) return;
      const currentCharIdx = startCharOffset + e.charIndex;

      const matchedRange = ranges.find(r => currentCharIdx >= r.start && currentCharIdx < r.end);
      if (matchedRange && matchedRange.index !== currentSentenceRef.current) {
        setCurrentSentenceIndex(matchedRange.index);
        currentSentenceRef.current = matchedRange.index;
        if (onSentenceChange) onSentenceChange(matchedRange.index);
      }
    };

    utterance.onend = () => {
      if (isPlayingRef.current) {
        setIsPlaying(false);
        setIsPaused(false);
        if (onChapterEnd) onChapterEnd();
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.error('Lỗi TTS:', e);
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [onSentenceChange, onChapterEnd]);

  const play = useCallback((index = currentSentenceRef.current) => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      startPlaybackFrom(index);
    }
  }, [startPlaybackFrom]);

  const pause = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const stop = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const jumpToSentence = useCallback((index) => {
    startPlaybackFrom(index);
  }, [startPlaybackFrom]);

  const nextSentence = useCallback(() => {
    jumpToSentence(currentSentenceRef.current + 1);
  }, [jumpToSentence]);

  const prevSentence = useCallback(() => {
    jumpToSentence(Math.max(0, currentSentenceRef.current - 1));
  }, [jumpToSentence]);

  const rewind15s = useCallback(() => {
    jumpToSentence(Math.max(0, currentSentenceRef.current - 3));
  }, [jumpToSentence]);

  const forward15s = useCallback(() => {
    jumpToSentence(Math.min(sentencesRef.current.length - 1, currentSentenceRef.current + 3));
  }, [jumpToSentence]);

  const changeRate = useCallback((newRate) => {
    setRate(newRate);
    rateRef.current = newRate;
    if (isPlayingRef.current) {
      startPlaybackFrom(currentSentenceRef.current);
    }
  }, [startPlaybackFrom]);

  const changePitch = useCallback((newPitch) => {
    setPitch(newPitch);
    pitchRef.current = newPitch;
    if (isPlayingRef.current) {
      startPlaybackFrom(currentSentenceRef.current);
    }
  }, [startPlaybackFrom]);

  const changeVoice = useCallback((voiceURI) => {
    setSelectedVoiceURI(voiceURI);
    selectedVoiceURIRef.current = voiceURI;
    if (isPlayingRef.current) {
      startPlaybackFrom(currentSentenceRef.current);
    }
  }, [startPlaybackFrom]);

  const changeSentencePause = useCallback((pauseMs) => {
    setSentencePause(pauseMs);
  }, []);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    voices,
    selectedVoiceURI,
    hasVietnameseVoice,
    isPlaying,
    isPaused,
    currentSentenceIndex,
    setCurrentSentenceIndex,
    rate,
    pitch,
    sentencePause,
    play,
    pause,
    stop,
    jumpToSentence,
    nextSentence,
    prevSentence,
    rewind15s,
    forward15s,
    changeRate,
    changePitch,
    changeVoice,
    changeSentencePause
  };
}
