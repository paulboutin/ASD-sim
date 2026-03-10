import { useEffect, useState } from 'react';
import { getActivationDelay, getTargetDrift, shouldDropIntent } from '../engines/interactionEngine';
import { shuffleArray } from '../utils/shuffle';
import type { TestProps } from './TestTypes';

type ShapeKind = 'square' | 'triangle' | 'circle' | 'diamond';

interface ShapeOption {
  id: string;
  shape: ShapeKind;
  colorName: string;
  colorHex: string;
}

interface RecognitionPrompt {
  id: string;
  question: string;
  options: ShapeOption[];
  answerId: string;
}

const PROMPTS: RecognitionPrompt[] = [
  {
    id: 'blue-square',
    question: 'Select: blue square',
    answerId: 'blue-square',
    options: [
      { id: 'blue-square', shape: 'square', colorName: 'blue', colorHex: '#2d69c7' },
      { id: 'red-triangle', shape: 'triangle', colorName: 'red', colorHex: '#c54343' },
      { id: 'orange-circle', shape: 'circle', colorName: 'orange', colorHex: '#cf7d31' },
      { id: 'green-triangle', shape: 'triangle', colorName: 'green', colorHex: '#2f8750' },
    ],
  },
  {
    id: 'green-circle',
    question: 'Select: green circle',
    answerId: 'green-circle',
    options: [
      { id: 'purple-diamond', shape: 'diamond', colorName: 'purple', colorHex: '#7d57ad' },
      { id: 'green-circle', shape: 'circle', colorName: 'green', colorHex: '#2f8750' },
      { id: 'yellow-square', shape: 'square', colorName: 'yellow', colorHex: '#cbad2e' },
      { id: 'blue-triangle', shape: 'triangle', colorName: 'blue', colorHex: '#2d69c7' },
    ],
  },
  {
    id: 'red-diamond',
    question: 'Select: red diamond',
    answerId: 'red-diamond',
    options: [
      { id: 'orange-square', shape: 'square', colorName: 'orange', colorHex: '#cf7d31' },
      { id: 'red-diamond', shape: 'diamond', colorName: 'red', colorHex: '#c54343' },
      { id: 'green-triangle-2', shape: 'triangle', colorName: 'green', colorHex: '#2f8750' },
      { id: 'blue-circle', shape: 'circle', colorName: 'blue', colorHex: '#2d69c7' },
    ],
  },
];

function nextPrompt(currentId?: string): RecognitionPrompt {
  const options = currentId ? PROMPTS.filter((item) => item.id !== currentId) : PROMPTS;
  return options[Math.floor(Math.random() * options.length)];
}

function noisyIndex(index: number, total: number, vision: number): number {
  const jumpChance = vision / 180;
  if (Math.random() > jumpChance) return index;
  const offset = Math.random() > 0.5 ? 1 : -1;
  return (index + offset + total) % total;
}

export function RecognitionTest({ channels, paused, onEvent }: TestProps) {
  const [prompt, setPrompt] = useState<RecognitionPrompt>(() => nextPrompt());
  const [displayOptions, setDisplayOptions] = useState<ShapeOption[]>(() => shuffleArray(prompt.options));
  const [status, setStatus] = useState('Identify the requested shape and color.');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) return;

    const tickInterval = window.setInterval(() => {
      setTick((value) => value + 90);
    }, 90);

    const swapCadence = Math.max(780, 2800 - channels.stim * 12 - channels.vision * 9);
    const swapInterval = window.setInterval(() => {
      setDisplayOptions((current) => shuffleArray(current));
    }, swapCadence);

    return () => {
      window.clearInterval(tickInterval);
      window.clearInterval(swapInterval);
    };
  }, [channels.stim, channels.vision, paused]);

  const handleChoice = (index: number): void => {
    if (paused) return;

    onEvent({ type: 'attempt' });
    setStatus('Processing response...');

    window.setTimeout(() => {
      const shiftedIndex = noisyIndex(index, displayOptions.length, channels.vision + channels.synesthesia * 0.25);
      let resolvedIndex = shiftedIndex;

      if (shouldDropIntent(channels.apraxia)) {
        resolvedIndex = (shiftedIndex + 1) % displayOptions.length;
      }

      const resolved = displayOptions[resolvedIndex];

      if (resolved.id === prompt.answerId) {
        setStatus(`Response registered for "${prompt.question.toLowerCase().replace('select: ', '')}".`);
        onEvent({ type: 'response', note: 'Recognition response matched prompt.' });
      } else {
        setStatus('Interference shifted the registered selection away from the intended target.');
        onEvent({ type: 'disruption', note: 'Recognition mismatch due to layered interference.' });
      }

      const next = nextPrompt(prompt.id);
      setPrompt(next);
      setDisplayOptions(shuffleArray(next.options));
    }, getActivationDelay(channels.apraxia));
  };

  return (
    <section className="test-card" aria-live="polite">
      <header className="test-header">
        <h3>Object/Color/Shape Recognition Test</h3>
        <p>Choose the requested shape-color target while options swap positions in motion.</p>
      </header>

      <div className="target-callout">{prompt.question}</div>

      <div className="recognition-grid">
        {displayOptions.map((option, index) => {
          const drift = getTargetDrift(channels.apraxia + channels.vision * 0.25, tick, index + 10);
          return (
            <button
              key={option.id}
              type="button"
              className="recognition-option shape-card"
              aria-label={`${option.colorName} ${option.shape}`}
              onClick={() => handleChoice(index)}
              style={{ transform: `translate(${drift.x.toFixed(1)}px, ${drift.y.toFixed(1)}px)` }}
            >
              <span
                className={`shape-visual ${option.shape}`}
                style={option.shape === 'triangle' ? { color: option.colorHex } : { backgroundColor: option.colorHex }}
              />
            </button>
          );
        })}
      </div>

      <p className="test-status">{status}</p>
    </section>
  );
}
