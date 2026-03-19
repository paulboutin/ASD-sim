import { useEffect, useRef, useState } from 'react';
import { usePromptVoice } from '../hooks/usePromptVoice';
import { getActivationDelay, getTargetDrift, shouldDropIntent } from '../engines/interactionEngine';
import { shuffleArray } from '../utils/shuffle';
import type { TestProps } from './TestTypes';

interface ColorOption {
  name: string;
  hex: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { name: 'blue', hex: '#1f6feb' },
  { name: 'red', hex: '#cf4b4b' },
  { name: 'green', hex: '#2d8752' },
  { name: 'yellow', hex: '#e0ba3c' },
  { name: 'orange', hex: '#df7a36' },
  { name: 'purple', hex: '#7a5fb5' },
];

function nextColor(excluding?: string): ColorOption {
  const pool = excluding ? COLOR_OPTIONS.filter((item) => item.name !== excluding) : COLOR_OPTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shiftedIndex(index: number, length: number, vision: number, synesthesia: number): number {
  const shiftChance = (vision + synesthesia * 0.45) / 180;
  if (Math.random() > shiftChance) return index;
  const shift = Math.random() > 0.5 ? 1 : -1;
  return (index + shift + length) % length;
}

export function ColorSelectionTest({ channels, paused, audioEnabled, promptVoiceVolume, onEvent }: TestProps) {
  const [target, setTarget] = useState<ColorOption>(() => nextColor());
  const [displayOptions, setDisplayOptions] = useState<ColorOption[]>(() => shuffleArray(COLOR_OPTIONS));
  const [status, setStatus] = useState('Listen for the spoken prompt and touch the matching color.');
  const [tick, setTick] = useState(0);
  const responseTimeoutRef = useRef<number | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);
  const { speakNo } = usePromptVoice(`Touch ${target.name}.`, {
    enabled: audioEnabled,
    paused,
    volume: promptVoiceVolume,
  });

  useEffect(() => {
    if (paused) return;

    const tickInterval = window.setInterval(() => {
      setTick((value) => value + 70);
    }, 70);
    const swapCadence = Math.max(780, 2700 - channels.vision * 10 - channels.stim * 8);
    const swapInterval = window.setInterval(() => {
      setDisplayOptions((current) => shuffleArray(current));
    }, swapCadence);

    return () => {
      window.clearInterval(tickInterval);
      window.clearInterval(swapInterval);
    };
  }, [channels.stim, channels.vision, paused]);

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        window.clearTimeout(responseTimeoutRef.current);
      }
      if (advanceTimeoutRef.current) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const handleColorChoice = (index: number): void => {
    if (paused) return;

    onEvent({ type: 'attempt' });
    setStatus('Processing response...');

    if (responseTimeoutRef.current) {
      window.clearTimeout(responseTimeoutRef.current);
    }

    responseTimeoutRef.current = window.setTimeout(() => {
      const driftedIndex = shiftedIndex(index, displayOptions.length, channels.vision, channels.synesthesia);
      let resolvedIndex = driftedIndex;

      if (shouldDropIntent(channels.apraxia)) {
        resolvedIndex = (resolvedIndex + 1) % displayOptions.length;
      }

      const registered = displayOptions[resolvedIndex];
      const intended = displayOptions[index];
      if (registered.name === target.name) {
        setStatus(`Response registered for ${target.name}. Next color loaded.`);
        onEvent({ type: 'response', note: `Color target matched: ${target.name}.` });
        setTarget(nextColor(target.name));
      } else {
        const directMiss = intended.name !== target.name;
        setStatus(`No. ${registered.name} was captured while ${target.name} was requested.`);
        onEvent({
          type: 'incorrect',
          note: directMiss
            ? `Incorrect color selected while ${target.name} was requested.`
            : `Color response resolved incorrectly while targeting ${target.name}.`,
        });
        if (!directMiss) {
          onEvent({ type: 'disruption', note: 'Color response shifted by visual/motor interference.' });
        }

        speakNo();
        if (advanceTimeoutRef.current) {
          window.clearTimeout(advanceTimeoutRef.current);
        }
        advanceTimeoutRef.current = window.setTimeout(() => {
          setTarget(nextColor(target.name));
        }, 720);
      }
    }, getActivationDelay(channels.apraxia));
  };

  return (
    <section className="test-card" aria-live="polite">
      <header className="test-header">
        <h3>Color Selection Test</h3>
        <p>
          Spoken prompts now pair with a color swatch so the task stays symbol-plus-word instead of text-only.
          This test focuses on targeting and sensory conflict rather than speed.
        </p>
      </header>

      <div className="target-callout prompt-callout">
        <span className="prompt-color-chip" style={{ backgroundColor: target.hex }} aria-hidden="true" />
        <div className="prompt-callout-copy">
          <span className="prompt-callout-label">Current prompt</span>
          <strong>Touch {target.name}</strong>
        </div>
      </div>

      <div className="color-grid">
        {displayOptions.map((option, index) => {
          const drift = getTargetDrift(channels.apraxia + channels.vision * 0.35, tick, index + 60);
          const hueShift = Math.sin((tick + index * 160) * 0.005) * channels.synesthesia * 0.7;
          const pulse = 1 + Math.sin((tick + index * 50) * 0.008) * channels.vision * 0.0018;

          return (
            <button
              key={option.name}
              type="button"
              className="color-swatch"
              aria-label={`Touch ${option.name}`}
              onClick={() => handleColorChoice(index)}
              style={{
                transform: `translate(${drift.x.toFixed(1)}px, ${drift.y.toFixed(1)}px) scale(${pulse.toFixed(3)})`,
              }}
            >
              <span
                className="color-chip"
                style={{ backgroundColor: option.hex, filter: `hue-rotate(${hueShift.toFixed(1)}deg)` }}
              />
              <span className="color-label">{option.name}</span>
            </button>
          );
        })}
      </div>

      <p className="test-status">{status}</p>
    </section>
  );
}
