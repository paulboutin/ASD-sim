import { useEffect, useMemo, useRef, useState } from 'react';
import { SymbolIcon } from '../components/SymbolIcon';
import { SYMBOL_ITEMS } from '../config/symbols';
import { usePromptVoice } from '../hooks/usePromptVoice';
import {
  getActivationDelay,
  getTargetDrift,
  getViewportRock,
  shouldDropIntent,
  shouldRequireIntentConfirm,
} from '../engines/interactionEngine';
import { shuffleArray } from '../utils/shuffle';
import type { TestProps } from './TestTypes';

function randomSymbol(excluding?: string): string {
  const filtered = excluding ? SYMBOL_ITEMS.filter((item) => item.label !== excluding) : SYMBOL_ITEMS;
  return filtered[Math.floor(Math.random() * filtered.length)].label;
}

function resolveRegistration(
  intendedLabel: string,
  allLabels: string[],
  apraxia: number,
  vision: number,
): string {
  const initialIndex = allLabels.indexOf(intendedLabel);
  if (initialIndex === -1) return intendedLabel;

  const bump = shouldDropIntent(apraxia) || Math.random() < vision / 200 ? 1 : 0;
  return allLabels[(initialIndex + bump) % allLabels.length];
}

export function SymbolSelectionTest({ channels, paused, audioEnabled, promptVoiceVolume, onEvent }: TestProps) {
  const [target, setTarget] = useState<string>(() => randomSymbol());
  const [status, setStatus] = useState('Listen for the spoken prompt and touch the matching symbol.');
  const [gridItems, setGridItems] = useState(() => shuffleArray(SYMBOL_ITEMS));
  const [tick, setTick] = useState(0);
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const responseTimeoutRef = useRef<number | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);
  const targetItem = SYMBOL_ITEMS.find((item) => item.label === target) ?? SYMBOL_ITEMS[0];
  const { speakNo } = usePromptVoice(`Touch ${target}.`, {
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
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
      }
      if (responseTimeoutRef.current) {
        window.clearTimeout(responseTimeoutRef.current);
      }
      if (advanceTimeoutRef.current) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const rock = useMemo(() => getViewportRock(channels.stim, tick), [channels.stim, tick]);

  const handleSymbolSelect = (label: string): void => {
    if (paused) return;

    onEvent({ type: 'attempt' });

    if (shouldRequireIntentConfirm(channels.apraxia) && pendingIntent !== label) {
      setPendingIntent(label);
      setStatus('Motor-planning load is high. Select the same symbol again to confirm intent.');
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
      }
      pendingTimeoutRef.current = window.setTimeout(() => {
        setPendingIntent(null);
      }, 1650);
      return;
    }

    if (pendingTimeoutRef.current) {
      window.clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    setStatus('Processing selection...');

    if (responseTimeoutRef.current) {
      window.clearTimeout(responseTimeoutRef.current);
    }

    responseTimeoutRef.current = window.setTimeout(() => {
      const labels = gridItems.map((item) => item.label);
      const selected = resolveRegistration(label, labels, channels.apraxia, channels.vision);

      if (selected === target) {
        setStatus(`Input registered for "${target}". A new target is loaded.`);
        setTarget(randomSymbol(target));
        onEvent({ type: 'response', note: 'Target symbol selected.' });
      } else {
        const directMiss = label !== target;
        setStatus(`No. ${selected} was registered while ${target} was requested.`);
        onEvent({
          type: 'incorrect',
          note: directMiss
            ? `Incorrect symbol selected while ${target} was requested.`
            : `Symbol response resolved incorrectly while targeting ${target}.`,
        });
        if (!directMiss) {
          onEvent({ type: 'disruption', note: 'Symbol mismatch under movement/vision interference.' });
        }

        speakNo();
        if (advanceTimeoutRef.current) {
          window.clearTimeout(advanceTimeoutRef.current);
        }
        advanceTimeoutRef.current = window.setTimeout(() => {
          setTarget(randomSymbol(target));
        }, 720);
      }

      setPendingIntent(null);
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
