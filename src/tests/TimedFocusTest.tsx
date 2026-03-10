import { useEffect, useMemo, useState } from 'react';
import { getInterruptionOpacity, getTargetDrift } from '../engines/interactionEngine';
import { shuffleArray } from '../utils/shuffle';
import type { TestProps } from './TestTypes';

const PROMPTS = [
  'Tap Ready when you can re-center attention.',
  'Select Need Break if the environment feels too intense.',
  'Tap Continue if you can stay with this prompt.',
  'Choose Pause Request if you want less input right now.',
];

const RESPONSES = ['Ready', 'Need Break', 'Continue', 'Pause Request'];

function pickPrompt(previous?: string): string {
  const items = previous ? PROMPTS.filter((item) => item !== previous) : PROMPTS;
  return items[Math.floor(Math.random() * items.length)];
}

export function TimedFocusTest({ channels, paused, onEvent }: TestProps) {
  const [currentPrompt, setCurrentPrompt] = useState<string>(() => pickPrompt());
  const [responseOrder, setResponseOrder] = useState<string[]>(() => shuffleArray(RESPONSES));
  const [awaitingResponse, setAwaitingResponse] = useState(true);
  const [status, setStatus] = useState('Respond to each prompt while distractions are active.');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) return;

    const cadence = Math.max(2200, 5600 - channels.stim * 18 - channels.hearing * 9);

    const promptTimer = window.setInterval(() => {
      if (awaitingResponse) {
        setStatus('A prompt passed before response due to competing load.');
        onEvent({ type: 'disruption', note: 'Prompt timed out under interference.' });
      }

      const next = pickPrompt(currentPrompt);
      setCurrentPrompt(next);
      setAwaitingResponse(true);
      onEvent({ type: 'prompt', note: 'New timed focus prompt shown.' });
    }, cadence);

    const tickTimer = window.setInterval(() => {
      setTick((value) => value + 100);
    }, 100);
    const swapCadence = Math.max(900, 3100 - channels.stim * 11 - channels.apraxia * 8);
    const swapTimer = window.setInterval(() => {
      setResponseOrder((current) => shuffleArray(current));
    }, swapCadence);

    return () => {
      window.clearInterval(promptTimer);
      window.clearInterval(tickTimer);
      window.clearInterval(swapTimer);
    };
  }, [awaitingResponse, channels.apraxia, channels.hearing, channels.stim, currentPrompt, onEvent, paused]);

  const interruptionOpacity = useMemo(
    () => getInterruptionOpacity(channels.stim + channels.synesthesia * 0.25, tick),
    [channels.stim, channels.synesthesia, tick],
  );

  const handleResponse = (response: string, index: number): void => {
    if (paused) return;

    const drift = getTargetDrift(channels.apraxia + channels.stim * 0.2, tick, index + 30);

    if (Math.abs(drift.x) + Math.abs(drift.y) > 18) {
      setStatus('Response was disrupted by movement interference. Try again.');
      onEvent({ type: 'disruption', note: 'Timed focus response interrupted during motion surge.' });
      return;
    }

    setAwaitingResponse(false);
    setStatus(`Response noted: ${response}. Awaiting next prompt.`);
    onEvent({ type: 'response', note: `Timed response captured: ${response}.` });
  };

  return (
    <section className="test-card" aria-live="polite">
      <header className="test-header">
        <h3>Timed Focus / Response Test</h3>
        <p>
          A rolling prompt sequence demonstrates how interruptions and competing input can make sustained
          response difficult.
        </p>
      </header>

      <div className="target-callout">{currentPrompt}</div>

      <div className="focus-response-grid">
        {responseOrder.map((response, index) => {
          const drift = getTargetDrift(channels.apraxia, tick, index + 40);
          return (
            <button
              key={response}
              type="button"
              className="focus-response-option"
              onClick={() => handleResponse(response, index)}
              style={{ transform: `translate(${drift.x.toFixed(1)}px, ${drift.y.toFixed(1)}px)` }}
            >
              {response}
            </button>
          );
        })}
      </div>

      <div className="interrupt-overlay" style={{ opacity: interruptionOpacity }}>
        Competing movement / interruption layer active
      </div>

      <p className="test-status">{status}</p>
    </section>
  );
}
