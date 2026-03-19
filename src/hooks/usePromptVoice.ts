import { useCallback, useEffect, useRef } from 'react';

interface SpeakOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
}

interface PromptVoiceOptions {
  enabled: boolean;
  paused: boolean;
  volume: number;
}

const FEMALE_VOICE_HINTS = ['samantha', 'ava', 'victoria', 'zira', 'karen', 'allison', 'susan', 'female'];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const preferredPool = englishVoices.length ? englishVoices : voices;

  return (
    preferredPool.find((voice) =>
      FEMALE_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint)),
    ) ??
    preferredPool.find((voice) => voice.lang.toLowerCase().startsWith('en-us')) ??
    preferredPool[0]
  );
}

export function usePromptVoice(promptText: string, { enabled, paused, volume }: PromptVoiceOptions) {
  const promptDelayRef = useRef<number | null>(null);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const normalizedVolume = Math.max(0, Math.min(1, volume / 100));

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (
        !enabled ||
        paused ||
        normalizedVolume <= 0 ||
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        !text
      ) {
        return;
      }

      const synthesis = window.speechSynthesis;
      const voices = synthesis.getVoices();
      preferredVoiceRef.current = pickVoice(voices);

      synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = preferredVoiceRef.current;
      utterance.lang = preferredVoiceRef.current?.lang ?? 'en-US';
      utterance.pitch = options?.pitch ?? 1.55;
      utterance.rate = options?.rate ?? 0.8;
      utterance.volume = Math.min(1, (options?.volume ?? 0.96) * normalizedVolume);

      synthesis.speak(utterance);
    },
    [enabled, normalizedVolume, paused],
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const synthesis = window.speechSynthesis;
    const updateVoices = (): void => {
      preferredVoiceRef.current = pickVoice(synthesis.getVoices());
    };

    updateVoices();
    synthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      synthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, [enabled]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (enabled && !paused && promptText && normalizedVolume > 0) {
      if (promptDelayRef.current) {
        window.clearTimeout(promptDelayRef.current);
      }

      promptDelayRef.current = window.setTimeout(() => {
        speak(promptText);
      }, 180);

      return () => {
        if (promptDelayRef.current) {
          window.clearTimeout(promptDelayRef.current);
          promptDelayRef.current = null;
        }
      };
    }

    window.speechSynthesis.cancel();
  }, [enabled, normalizedVolume, paused, promptText, speak]);

  useEffect(() => {
    return () => {
      if (promptDelayRef.current) {
        window.clearTimeout(promptDelayRef.current);
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speakNo: () =>
      speak('No.', {
        pitch: 1.48,
        rate: 0.88,
        volume: 0.92,
      }),
  };
}
