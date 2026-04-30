import { useEffect, useMemo, useRef, useState } from 'react';
import { SymbolIcon } from '../components/SymbolIcon';
import { feedbackAudio, feedbackAudioDelayMs, getSymbolPromptAudio } from '../config/promptAudio';
import { SYMBOL_ITEMS } from '../config/symbols';
import { usePromptAudio } from '../hooks/usePromptAudio';
import {
  getActivationDelay,
  getTargetDrift,
  getViewportRock,
  shouldRegisterAccurateResponse,
} from '../engines/interactionEngine';
import { shuffleArray } from '../utils/shuffle';
import type { TestProps } from './TestTypes';

function randomSymbol(excluding?: string): string {
  const filtered = excluding ? SYMBOL_ITEMS.filter((item) => item.label !== excluding) : SYMBOL_ITEMS;
  return filtered[Math.floor(Math.random() * filtered.length)].label;
}

export function SymbolSelectionTest({ channels, paused, audioEnabled, promptVoiceVolume, onEvent }: TestProps) {
  const [target, setTarget] = useState<string>(() => randomSymbol());
  const [status, setStatus] = useState('Listen for the spoken prompt and touch the matching symbol.');
  const [gridItems, setGridItems] = useState(() => shuffleArray(SYMBOL_ITEMS));
  const [tick, setTick] = useState(0);
  const responseTimeoutRef = useRef<number | null>(null);
  const targetItem = SYMBOL_ITEMS.find((item) => item.label === target) ?? SYMBOL_ITEMS[0];
  const { delayNextPrompt, playOneShotClip, stopClip } = usePromptAudio(getSymbolPromptAudio(target), {
    enabled: audioEnabled,
    paused,
    volume: promptVoiceVolume,
  });

  useEffect(() => {
    if (paused) return;
    const tickInterval = window.setInterval(() => {
      setTick((value) => value + 80);
    }, 80);
    const swapCadence = Math.max(820, 3200 - channels.apraxia * 11 - channels.stim * 10);
    const swapInterval = window.setInterval(() => {
      setGridItems((current) => shuffleArray(current));
    }, swapCadence);

    return () => {
      window.clearInterval(tickInterval);
      window.clearInterval(swapInterval);
    };
  }, [channels.apraxia, channels.stim, paused]);

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        window.clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  const rock = useMemo(() => getViewportRock(channels.stim, tick), [channels.stim, tick]);

  const handleSymbolSelect = (label: string): void => {
    if (paused) return;

    const currentTarget = target;
    onEvent({ type: 'attempt' });
    stopClip();
    setStatus('Processing selection...');

    if (responseTimeoutRef.current) {
      window.clearTimeout(responseTimeoutRef.current);
    }

    responseTimeoutRef.current = window.setTimeout(() => {
      const correctSelection = label === currentTarget;
      const accuratelyRegistered =
        correctSelection && shouldRegisterAccurateResponse(channels.apraxia, channels.stim, channels.synesthesia);

      if (accuratelyRegistered) {
        const nextTarget = randomSymbol(currentTarget);
        delayNextPrompt(feedbackAudioDelayMs.correct);
        playOneShotClip(feedbackAudio.correct, {
          volume: 0.92,
        });
        setStatus(`Input registered for "${currentTarget}". Loading the next prompt.`);
        setTarget(nextTarget);
        onEvent({ type: 'response', note: 'Target symbol selected.' });
      } else {
        const nextTarget = randomSymbol(currentTarget);
        const registered = correctSelection ? randomSymbol(currentTarget) : label;
        delayNextPrompt(feedbackAudioDelayMs.incorrect);
        setStatus(`No. ${registered} was registered while ${currentTarget} was requested.`);
        onEvent({
          type: 'incorrect',
          note: correctSelection
            ? `Symbol response misregistered while targeting ${currentTarget}.`
            : `Incorrect symbol selected while ${currentTarget} was requested.`,
        });
        if (correctSelection) {
          onEvent({ type: 'disruption', note: 'Symbol accuracy disrupted by interaction interference.' });
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
        <h3>Symbol Selection Test</h3>
        <p>
          Select the requested item from a generic AAC-inspired grid. Targets are not visually pre-marked, so
          selection depends on prompt interpretation under interference rather than reading-only cues.
        </p>
      </header>

      <div className="target-callout prompt-callout">
        <span className="prompt-symbol-chip" aria-hidden="true">
          <SymbolIcon icon={targetItem.icon} className="symbol-icon" />
        </span>
        <div className="prompt-callout-copy">
          <span className="prompt-callout-label">Current prompt</span>
          <strong>Touch {target}</strong>
        </div>
      </div>

      <div
        className="aac-grid"
        style={{ transform: `translate(${rock.x.toFixed(1)}px, ${rock.y.toFixed(1)}px)` }}
      >
        {gridItems.map((item, index) => {
          const drift = getTargetDrift(channels.apraxia + channels.synesthesia * 0.35, tick, index + 1);

          return (
            <button
              key={item.label}
              type="button"
              className="symbol-tile"
              aria-label={`Touch ${item.label}`}
              onClick={() => handleSymbolSelect(item.label)}
              style={{ transform: `translate(${drift.x.toFixed(1)}px, ${drift.y.toFixed(1)}px)` }}
            >
              <SymbolIcon icon={item.icon} className="symbol-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <p className="test-status">{status}</p>
    </section>
  );
}
