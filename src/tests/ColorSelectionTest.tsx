import { useEffect, useState } from 'react';
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

export function ColorSelectionTest({ channels, paused, onEvent }: TestProps) {
  const [target, setTarget] = useState<ColorOption>(() => nextColor());
  const [displayOptions, setDisplayOptions] = useState<ColorOption[]>(() => shuffleArray(COLOR_OPTIONS));
  const [status, setStatus] = useState('Select the requested color swatch.');
  const [tick, setTick] = useState(0);

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

  const handleColorChoice = (index: number): void => {
    if (paused) return;

    onEvent({ type: 'attempt' });
    setStatus('Processing response...');

    window.setTimeout(() => {
      const driftedIndex = shiftedIndex(index, displayOptions.length, channels.vision, channels.synesthesia);
      let resolvedIndex = driftedIndex;

      if (shouldDropIntent(channels.apraxia)) {
        resolvedIndex = (resolvedIndex + 1) % displayOptions.length;
      }

      const registered = displayOptions[resolvedIndex];
      if (registered.name === target.name) {
        setStatus(`Response registered for ${target.name}. Next color loaded.`);
        onEvent({ type: 'response', note: `Color target matched: ${target.name}.` });
      } else {
        setStatus(`Interference registered ${registered.name} while target was ${target.name}.`);
        onEvent({ type: 'disruption', note: 'Color response shifted by visual/motor interference.' });
      }

      setTarget(nextColor(target.name));
    }, getActivationDelay(channels.apraxia));
  };

  return (
    <section className="test-card" aria-live="polite">
      <header className="test-header">
        <h3>Color Selection Test</h3>
        <p>
          Select a named color while swatches drift and color perception shifts. This test focuses on targeting
          and sensory conflict rather than speed.
        </p>
      </header>

      <div className="target-callout">Select color: {target.name}</div>

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
