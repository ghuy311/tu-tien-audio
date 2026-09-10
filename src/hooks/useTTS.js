import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Kiểm tra xem voice có phải là giọng đọc tiếng Việt hay không
 */
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

export function useTTS(sentences = [], onSentenceChange, onChapterEnd) {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [hasVietnameseVoice, setHasVietnameseVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  const currentSentenceRef = useRef(currentSentenceIndex);
  const isPlayingRef = useRef(isPlaying);
  const rateRef = useRef(rate);
  const pitchRef = useRef(pitch);
  const selectedVoiceURIRef = useRef(selectedVoiceURI);
  const sentencesRef = useRef(sentences);

  currentSentenceRef.current = currentSentenceIndex;
  isPlayingRef.current = isPlaying;
  rateRef.current = rate;
  pitchRef.current = pitch;
  selectedVoiceURIRef.current = selectedVoiceURI;
  sentencesRef.current = sentences;

  // 1. Tải danh sách các giọng đọc (Voices) từ trình duyệt
  useEffect(() => {
    const updateVoices = () => {
      if (!('speechSynthesis' in window)) return;
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      const viVoice = availableVoices.find(isVietnameseVoice);
      setHasVietnameseVoice(!!viVoice);

      if (availableVoices.length > 0 && (!selectedVoiceURIRef.current || !availableVoices.some(v => v.voiceURI === selectedVoiceURIRef.current))) {
        if (viVoice) {
          setSelectedVoiceURI(viVoice.voiceURI);
        } else {
          const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
          if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
        }
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
      // Một số trình duyệt Chrome/Windows cần gọi nhiều lần để nạp voice
      setTimeout(updateVoices, 500);
      setTimeout(updateVoices, 1500);
    }
  }, []);

  // 2. Phát câu theo chỉ số (index)
  const speakSentence = useCallback((index) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const targetSentences = sentencesRef.current;
    if (!targetSentences || index < 0 || index >= targetSentences.length) {
      setIsPlaying(false);
      setIsPaused(false);
      if (index >= targetSentences.length && targetSentences.length > 0) {
        if (onChapterEnd) onChapterEnd();
      }
      return;
    }

    const textToSpeak = targetSentences[index];
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
      setCurrentSentenceIndex(index);
      if (onSentenceChange) onSentenceChange(index);
    };

    utterance.onend = () => {
      if (isPlayingRef.current) {
        const nextIdx = index + 1;
        if (nextIdx < targetSentences.length) {
          speakSentence(nextIdx);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          if (onChapterEnd) onChapterEnd();
        }
      }
    };

    utterance.onerror = (e) => {
      console.error('Lỗi TTS:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [onSentenceChange, onChapterEnd]);

  const play = useCallback((index = currentSentenceRef.current) => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      speakSentence(index);
    }
  }, [speakSentence]);

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
    speakSentence(index);
  }, [speakSentence]);

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
      speakSentence(currentSentenceRef.current);
    }
  }, [speakSentence]);

  const changePitch = useCallback((newPitch) => {
    setPitch(newPitch);
    pitchRef.current = newPitch;
    if (isPlayingRef.current) {
      speakSentence(currentSentenceRef.current);
    }
  }, [speakSentence]);

  const changeVoice = useCallback((voiceURI) => {
    setSelectedVoiceURI(voiceURI);
    selectedVoiceURIRef.current = voiceURI;
    if (isPlayingRef.current) {
      speakSentence(currentSentenceRef.current);
    }
  }, [speakSentence]);

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
    changeVoice
  };
}
