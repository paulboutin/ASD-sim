import { useEffect, useMemo, useRef, useState } from 'react';
import { SYMBOL_ITEMS, iconUrl } from '../config/symbols';
import {
  getActivationDelay,
  getTargetDrift,
  getViewportRock,
  shouldDropIntent,
  shouldRequireIntentConfirm,
} from '../engines/interactionEngine';
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

export function SymbolSelectionTest({ channels, paused, onEvent }: TestProps) {
  const [target, setTarget] = useState<string>(() => randomSymbol());
  const [status, setStatus] = useState('Select the target symbol named above.');
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

    window.setTimeout(() => {
      const labels = SYMBOL_ITEMS.map((item) => item.label);
      const selected = resolveRegistration(label, labels, channels.apraxia, channels.vision);

      if (selected === target) {
        setStatus(`Input registered for "${target}". A new target is loaded.`);
        setTarget(randomSymbol(target));
        onEvent({ type: 'response', note: 'Target symbol selected.' });
      } else {
        setStatus(`Interference occurred. Intended "${target}", registered "${selected}".`);
        onEvent({ type: 'disruption', note: 'Symbol mismatch under movement/vision interference.' });
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
          selection depends on prompt interpretation under interference.
        </p>
      </header>

      <div className="target-callout">Target symbol: {target}</div>

      <div
        className="aac-grid"
        style={{ transform: `translate(${rock.x.toFixed(1)}px, ${rock.y.toFixed(1)}px)` }}
      >
        {SYMBOL_ITEMS.map((item, index) => {
          const drift = getTargetDrift(channels.apraxia + channels.synesthesia * 0.35, tick, index + 1);

          return (
            <button
              key={item.label}
              type="button"
              className="symbol-tile"
              onClick={() => handleSymbolSelect(item.label)}
              style={{ transform: `translate(${drift.x.toFixed(1)}px, ${drift.y.toFixed(1)}px)` }}
            >
              <img src={iconUrl(item.icon)} alt="" aria-hidden="true" className="symbol-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <p className="test-status">{status}</p>
    </section>
  );
}
