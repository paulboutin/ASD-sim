import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getActivationDelay,
  getTargetDrift,
  getViewportRock,
  shouldDropIntent,
  shouldRequireIntentConfirm,
} from '../engines/interactionEngine';
import type { TestProps } from './TestTypes';

const SYMBOLS = [
  'yes',
  'no',
  'help',
  'more',
  'water',
  'break',
  'food',
  'home',
  'school',
  'thank you',
  'all done',
  'friend',
];

function randomSymbol(excluding?: string): string {
  const filtered = excluding ? SYMBOLS.filter((label) => label !== excluding) : SYMBOLS;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function SymbolSelectionTest({ channels, paused, onEvent }: TestProps) {
  const [target, setTarget] = useState<string>(() => randomSymbol());
  const [status, setStatus] = useState('Select the target symbol when you are ready.');
  const [tick, setTick] = useState(0);
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(() => {
      setTick((value) => value + 80);
    }, 80);

    return () => {
      window.clearInterval(interval);
    };
  }, [paused]);

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
      }
    };
  }, []);

  const rock = useMemo(() => getViewportRock(channels.stim, tick), [channels.stim, tick]);

  const handleSymbolSelect = (label: string): void => {
    if (paused) return;

    onEvent({ type: 'attempt' });

    if (shouldRequireIntentConfirm(channels.apraxia) && pendingIntent !== label) {
      setPendingIntent(label);
      setStatus('High motor-planning load: click the same symbol again to confirm intent.');
      if (pendingTimeoutRef.current) {
        window.clearTimeout(pendingTimeoutRef.current);
      }
      pendingTimeoutRef.current = window.setTimeout(() => {
        setPendingIntent(null);
      }, 1800);
      return;
    }

    if (pendingTimeoutRef.current) {
      window.clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    const delay = getActivationDelay(channels.apraxia);
    setStatus('Processing selection...');

    window.setTimeout(() => {
      const dropped = shouldDropIntent(channels.apraxia);
      const selected = dropped ? randomSymbol(label) : label;

      if (selected === target) {
        setStatus(`Input registered: "${target}" selected. Next target loaded.`);
        setTarget(randomSymbol(target));
        onEvent({ type: 'response', note: 'Target symbol selected.' });
      } else {
        setStatus(`Interference occurred. Intended "${target}", registered "${selected}".`);
        onEvent({ type: 'disruption', note: 'Symbol mismatch due to interaction instability.' });
      }

      setPendingIntent(null);
    }, delay);
  };

  return (
    <section className="test-card" aria-live="polite">
      <header className="test-header">
        <h3>Symbol Selection Test</h3>
        <p>
          Select the highlighted target from a generic AAC-inspired board. This illustrates how layered
          interference can affect communication attempts.
        </p>
      </header>

      <div className="target-callout">Target symbol: {target}</div>

      <div
        className="aac-grid"
        style={{ transform: `translate(${rock.x.toFixed(1)}px, ${rock.y.toFixed(1)}px)` }}
      >
        {SYMBOLS.map((label, index) => {
          const drift = getTargetDrift(channels.apraxia + channels.synesthesia * 0.25, tick, index + 1);
          const isTarget = label === target;

          return (
            <button
              key={label}
              type="button"
              className={`symbol-tile ${isTarget ? 'target' : ''}`}
              onClick={() => handleSymbolSelect(label)}
              style={{ transform: `translate(${drift.x.toFixed(1)}px, ${drift.y.toFixed(1)}px)` }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className="test-status">{status}</p>
    </section>
  );
}
