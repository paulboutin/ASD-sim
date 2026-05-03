import { useEffect, useRef, useState } from 'react';
import { feedbackAudio, feedbackAudioDelayMs, getColorPromptAudio } from '../config/promptAudio';
import { usePromptAudio } from '../hooks/usePromptAudio';
import { getActivationDelay, getTargetDrift, shouldRegisterAccurateResponse } from '../engines/interactionEngine';
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

function misregisteredColor(targetName: string): ColorOption {
  return nextColor(targetName);
}

export function ColorSelectionTest({ channels, paused, audioEnabled, promptVoiceVolume, onEvent }: TestProps) {
  const [target, setTarget] = useState<ColorOption>(() => nextColor());
  const [displayOptions, setDisplayOptions] = useState<ColorOption[]>(() => shuffleArray(COLOR_OPTIONS));
  const [status, setStatus] = useState('Listen for the spoken prompt and touch the matching color.');
  const [tick, setTick] = useState(0);
  const responseTimeoutRef = useRef<number | null>(null);
  const { delayNextPrompt, playOneShotClip, promptEnded, stopClip } = usePromptAudio(getColorPromptAudio(target.name), {
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
    };
  }, []);

  const handleColorChoice = (option: ColorOption): void => {
    if (paused) return;

    const currentTarget = target;
    onEvent({ type: 'attempt' });
    stopClip();
    setStatus('Processing response...');

    if (responseTimeoutRef.current) {
      window.clearTimeout(responseTimeoutRef.current);
    }

    responseTimeoutRef.current = window.setTimeout(() => {
      const correctSelection = option.name === currentTarget.name;
      const accuratelyRegistered =
        correctSelection && shouldRegisterAccurateResponse(channels.apraxia, channels.stim, channels.synesthesia);

      if (accuratelyRegistered) {
        const nextTarget = nextColor(currentTarget.name);
        delayNextPrompt(feedbackAudioDelayMs.correct);
        playOneShotClip(feedbackAudio.correct, {
          volume: 0.92,
        });
        setStatus(`Response registered for ${currentTarget.name}. Loading the next prompt.`);
        onEvent({ type: 'response', note: `Color target matched: ${currentTarget.name}.` });
        setTarget(nextTarget);
      } else {
        const nextTarget = nextColor(currentTarget.name);
        const registered = correctSelection ? misregisteredColor(currentTarget.name) : option;
        delayNextPrompt(feedbackAudioDelayMs.incorrect);
        setStatus(`No. ${registered.name} was captured while ${currentTarget.name} was requested.`);
        onEvent({
          type: 'incorrect',
          note: correctSelection
            ? `Color response misregistered while targeting ${currentTarget.name}.`
            : `Incorrect color selected while ${currentTarget.name} was requested.`,
        });
        if (correctSelection) {
          onEvent({ type: 'disruption', note: 'Color accuracy disrupted by interaction interference.' });
        }

        playOneShotClip(feedbackAudio.incorrect, {
          volume: 0.92,
        });
        setTarget(nextTarget);
      }
    }, getActivationDelay(channels.apraxia));
  };

  return (
    <section className="test-card" aria-live="polite">
      <header className="test-header">
        <h3>Color Selection Test</h3>
        <p>This test focuses on color identification and sensory conflict rather than speed.</p>
      </header>

      <div className="target-callout prompt-callout">
        <div className="prompt-callout-copy">
          <span className="prompt-callout-label">Current prompt</span>
          <strong>{promptEnded ? `Touch ${target.name}` : ''}</strong>
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
              onClick={() => handleColorChoice(option)}
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
