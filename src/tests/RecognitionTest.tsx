import { useEffect, useMemo, useState } from 'react';
import { getActivationDelay, getTargetDrift, shouldDropIntent } from '../engines/interactionEngine';
import type { TestProps } from './TestTypes';

interface RecognitionPrompt {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

const PROMPTS: RecognitionPrompt[] = [
  {
    id: 'shape-blue-circle',
    question: 'Select: blue circle',
    options: ['blue circle', 'red triangle', 'green square', 'yellow star'],
    answer: 'blue circle',
  },
  {
    id: 'shape-red-triangle',
    question: 'Select: red triangle',
    options: ['blue square', 'red triangle', 'orange circle', 'green triangle'],
    answer: 'red triangle',
  },
  {
    id: 'symbol-break',
    question: 'Select symbol: break',
    options: ['water', 'thank you', 'break', 'school'],
    answer: 'break',
  },
];

function nextPrompt(currentId?: string): RecognitionPrompt {
  const options = currentId ? PROMPTS.filter((item) => item.id !== currentId) : PROMPTS;
  return options[Math.floor(Math.random() * options.length)];
}

function noisyIndex(index: number, total: number, vision: number): number {
  const jumpChance = vision / 220;
  if (Math.random() > jumpChance) return index;
  const offset = Math.random() > 0.5 ? 1 : -1;
  return (index + offset + total) % total;
}

export function RecognitionTest({ channels, paused, onEvent }: TestProps) {
  const [prompt, setPrompt] = useState<RecognitionPrompt>(() => nextPrompt());
  const [status, setStatus] = useState('Identify the requested item.');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(() => {
      setTick((value) => value + 90);
    }, 90);

    return () => {
      window.clearInterval(interval);
    };
  }, [paused]);

  const options = useMemo(() => prompt.options, [prompt.options]);

  const handleChoice = (index: number): void => {
    if (paused) return;

    onEvent({ type: 'attempt' });
    setStatus('Processing response...');

    window.setTimeout(() => {
      const shiftedIndex = noisyIndex(index, options.length, channels.vision + channels.synesthesia * 0.2);
      let resolved = options[shiftedIndex];

      if (shouldDropIntent(channels.apraxia)) {
        resolved = options[(shiftedIndex + 1) % options.length];
      }

      if (resolved === prompt.answer) {
        setStatus(`Response registered for "${prompt.answer}". Next prompt loaded.`);
        onEvent({ type: 'response', note: 'Recognition response matched prompt.' });
      } else {
        setStatus(`Interference changed output. Intended "${prompt.answer}", registered "${resolved}".`);
        onEvent({ type: 'disruption', note: 'Recognition mismatch due to layered interference.' });
      }

      setPrompt(nextPrompt(prompt.id));
    }, getActivationDelay(channels.apraxia));
  };

  return (
    <section className="test-card" aria-live="polite">
      <header className="test-header">
        <h3>Object/Color/Shape Recognition Test</h3>
        <p>Simple recognition prompts with sensory and interaction interference layers.</p>
      </header>

      <div className="target-callout">{prompt.question}</div>

      <div className="recognition-grid">
        {options.map((option, index) => {
          const drift = getTargetDrift(channels.apraxia + channels.vision * 0.2, tick, index + 10);
          return (
            <button
              key={option}
              type="button"
              className="recognition-option"
              onClick={() => handleChoice(index)}
              style={{ transform: `translate(${drift.x.toFixed(1)}px, ${drift.y.toFixed(1)}px)` }}
            >
              {option}
            </button>
          );
        })}
      </div>

      <p className="test-status">{status}</p>
    </section>
  );
}
