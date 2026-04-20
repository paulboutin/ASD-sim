import { useCallback, useEffect, useRef } from 'react';

interface PlayClipOptions {
  playbackRate?: number;
  volume?: number;
}

interface PromptAudioOptions {
  enabled: boolean;
  paused: boolean;
  volume: number;
}

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function usePromptAudio(promptSrc: string | null, { enabled, paused, volume }: PromptAudioOptions) {
  const promptDelayRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdPromptUntilRef = useRef(0);
  const normalizedVolume = clampVolume(volume / 100);

  const clearPendingPrompt = useCallback(() => {
    if (promptDelayRef.current) {
      window.clearTimeout(promptDelayRef.current);
      promptDelayRef.current = null;
    }
  }, []);

  const stopClip = useCallback(() => {
    clearPendingPrompt();

    const currentAudio = audioRef.current;
    if (!currentAudio) return;

    currentAudio.pause();
    currentAudio.currentTime = 0;
    audioRef.current = null;
  }, [clearPendingPrompt]);

  const playClip = useCallback(
    (src: string | null, options?: PlayClipOptions) => {
      if (!enabled || paused || normalizedVolume <= 0 || typeof window === 'undefined' || !src) {
        return;
      }

      clearPendingPrompt();
      stopClip();

      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = clampVolume((options?.volume ?? 1) * normalizedVolume);
      audio.playbackRate = options?.playbackRate ?? 1;
      audioRef.current = audio;
      audio.addEventListener(
        'ended',
        () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
        },
        { once: true },
      );

      void audio.play().catch(() => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      });
    },
    [clearPendingPrompt, enabled, normalizedVolume, paused, stopClip],
  );

  const playOneShotClip = useCallback(
    (src: string | null, options?: PlayClipOptions) => {
      if (!enabled || paused || normalizedVolume <= 0 || typeof window === 'undefined' || !src) {
        return;
      }

      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = clampVolume((options?.volume ?? 1) * normalizedVolume);
      audio.playbackRate = options?.playbackRate ?? 1;
      void audio.play().catch(() => undefined);
    },
    [enabled, normalizedVolume, paused],
  );

  const delayNextPrompt = useCallback(
    (durationMs: number) => {
      holdPromptUntilRef.current = Math.max(holdPromptUntilRef.current, Date.now() + Math.max(0, durationMs));
      clearPendingPrompt();
    },
    [clearPendingPrompt],
  );

  useEffect(() => {
    if (enabled && !paused && promptSrc && normalizedVolume > 0) {
      clearPendingPrompt();
      const waitMs = Math.max(180, holdPromptUntilRef.current - Date.now());

      promptDelayRef.current = window.setTimeout(() => {
        playClip(promptSrc);
      }, waitMs);

      return () => {
        clearPendingPrompt();
      };
    }

    stopClip();
  }, [clearPendingPrompt, enabled, normalizedVolume, paused, playClip, promptSrc, stopClip]);

  useEffect(() => {
    return () => {
      stopClip();
    };
  }, [stopClip]);

  return {
    delayNextPrompt,
    playClip,
    playOneShotClip,
    stopClip,
  };
}
