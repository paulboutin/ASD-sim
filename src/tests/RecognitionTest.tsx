import { useEffect, useRef, useState } from 'react';
import { feedbackAudio, feedbackAudioDelayMs, getRecognitionPromptAudio } from '../config/promptAudio';
import { usePromptAudio } from '../hooks/usePromptAudio';
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

export function RecognitionTest({ channels, paused, audioEnabled, promptVoiceVolume, onEvent }: TestProps) {
  const [prompt, setPrompt] = useState<RecognitionPrompt>(() => nextPrompt());
  const [displayOptions, setDisplayOptions] = useState<ShapeOption[]>(() => shuffleArray(prompt.options));
  const [status, setStatus] = useState('Listen for the spoken prompt and touch the matching shape-color card.');
  const [tick, setTick] = useState(0);
  const responseTimeoutRef = useRef<number | null>(null);
  const answerOption = prompt.options.find((option) => option.id === prompt.answerId) ?? prompt.options[0];
  const { delayNextPrompt, playOneShotClip, stopClip } = usePromptAudio(getRecognitionPromptAudio(prompt.id), {
    enabled: audioEnabled,
    paused,
    volume: promptVoiceVolume,
  });

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

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        window.clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  const handleChoice = (index: number): void => {
    if (paused) return;

    const currentPrompt = prompt;
    const currentAnswer = answerOption;
    onEvent({ type: 'attempt' });
    stopClip();
    setStatus('Processing response...');

    if (responseTimeoutRef.current) {
      window.clearTimeout(responseTimeoutRef.current);
    }

    responseTimeoutRef.current = window.setTimeout(() => {
      const shiftedIndex = noisyIndex(index, displayOptions.length, channels.vision + channels.synesthesia * 0.25);
      let resolvedIndex = shiftedIndex;

      if (shouldDropIntent(channels.apraxia)) {
        resolvedIndex = (shiftedIndex + 1) % displayOptions.length;
      }

      const resolved = displayOptions[resolvedIndex];
      const intended = displayOptions[index];

      if (resolved.id === currentPrompt.answerId) {
        const next = nextPrompt(currentPrompt.id);
        delayNextPrompt(feedbackAudioDelayMs.correct);
        playOneShotClip(feedbackAudio.correct, {
          volume: 0.92,
        });
        setStatus(`Response registered for "${currentAnswer.colorName} ${currentAnswer.shape}". Loading the next prompt.`);
        onEvent({ type: 'response', note: 'Recognition response matched prompt.' });
        setPrompt(next);
        setDisplayOptions(shuffleArray(next.options));
      } else {
        const directMiss = intended.id !== currentPrompt.answerId;
        const next = nextPrompt(currentPrompt.id);
        delayNextPrompt(feedbackAudioDelayMs.incorrect);
        setStatus(`No. ${resolved.colorName} ${resolved.shape} was registered instead.`);
        onEvent({
          type: 'incorrect',
          note: directMiss
            ? 'Incorrect recognition choice selected.'
            : 'Recognition response resolved incorrectly under layered interference.',
        });
        if (!directMiss) {
          onEvent({ type: 'disruption', note: 'Recognition mismatch due to layered interference.' });
        }

        playOneShotClip(feedbackAudio.incorrect, {
          volume: 0.92,
        });
        setPrompt(next);
        setDisplayOptions(shuffleArray(next.options));
      }
    }, getActivationDelay(channels.apraxia));
  };

  return (
    <section className="test-card" aria-live="polite">
      <header className="test-header">
        <h3>Object/Color/Shape Recognition Test</h3>
        <p>Choose the requested shape-color target using paired spoken and visual prompts while options swap.</p>
      </header>

      <div className="target-callout prompt-callout">
        <span className="prompt-shape-chip" aria-hidden="true">
          <span
            className={`shape-visual prompt-shape ${answerOption.shape}`}
            style={
              answerOption.shape === 'triangle'
                ? { color: answerOption.colorHex }
                : { backgroundColor: answerOption.colorHex }
            }
          />
        </span>
        <div className="prompt-callout-copy">
          <span className="prompt-callout-label">Current prompt</span>
          <strong>
            Touch {answerOption.colorName} {answerOption.shape}
          </strong>
        </div>
      </div>

      <div className="recognition-grid">
        {displayOptions.map((option, index) => {
          const drift = getTargetDrift(channels.apraxia + channels.vision * 0.25, tick, index + 10);
          return (
            <button
              key={option.id}
              type="button"
              className="recognition-option shape-card"
              aria-label={`Touch ${option.colorName} ${option.shape}`}
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
