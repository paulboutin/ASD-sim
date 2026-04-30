import { useEffect, useMemo, useState } from 'react';
import { feedbackAudio, feedbackAudioDelayMs, getFocusPromptAudio } from '../config/promptAudio';
import {
  getInterruptionOpacity,
  getTargetDrift,
  shouldRegisterAccurateResponse,
} from '../engines/interactionEngine';
import { usePromptAudio } from '../hooks/usePromptAudio';
import { shuffleArray } from '../utils/shuffle';
import type { TestProps } from './TestTypes';

interface FocusPrompt {
  id: string;
  label: string;
  expectedResponse: string;
}

const PROMPTS: FocusPrompt[] = [
  { id: 'ready-attention', label: 'Touch Ready Attention.', expectedResponse: 'Ready Attention' },
  { id: 'need-break', label: 'Choose Need Break.', expectedResponse: 'Need Break' },
  { id: 'continue', label: 'Press Continue.', expectedResponse: 'Continue' },
  { id: 'pause', label: 'Choose Pause.', expectedResponse: 'Pause' },
];

const RESPONSES = ['Ready Attention', 'Need Break', 'Continue', 'Pause'];

function pickPrompt(previousId?: string): FocusPrompt {
  const items = previousId ? PROMPTS.filter((item) => item.id !== previousId) : PROMPTS;
  return items[Math.floor(Math.random() * items.length)];
}

export function TimedFocusTest({ channels, paused, audioEnabled, promptVoiceVolume, onEvent }: TestProps) {
  const [currentPrompt, setCurrentPrompt] = useState<FocusPrompt>(() => pickPrompt());
  const [responseOrder, setResponseOrder] = useState<string[]>(() => shuffleArray(RESPONSES));
  const [awaitingResponse, setAwaitingResponse] = useState(true);
  const [status, setStatus] = useState('Respond to each prompt while distractions are active.');
  const [tick, setTick] = useState(0);
  const { delayNextPrompt, playOneShotClip, stopClip } = usePromptAudio(getFocusPromptAudio(currentPrompt.id), {
    enabled: audioEnabled,
    paused,
    volume: promptVoiceVolume,
  });

  useEffect(() => {
    if (paused) return;

    const cadence = Math.max(2200, 5600 - channels.stim * 18 - channels.hearing * 9);

    const promptTimer = window.setInterval(() => {
      if (awaitingResponse) {
        setStatus('A prompt passed before response due to competing load.');
        onEvent({ type: 'disruption', note: 'Prompt timed out under interference.' });
      }

      const next = pickPrompt(currentPrompt.id);
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
  }, [awaitingResponse, channels.apraxia, channels.hearing, channels.stim, currentPrompt.id, onEvent, paused]);

  const interruptionOpacity = useMemo(
    () => getInterruptionOpacity(channels.stim + channels.synesthesia * 0.25, tick),
    [channels.stim, channels.synesthesia, tick],
  );

  const handleResponse = (response: string, index: number): void => {
    if (paused) return;

    const prompt = currentPrompt;
    onEvent({ type: 'attempt' });
    stopClip();

    const drift = getTargetDrift(channels.apraxia + channels.stim * 0.2, tick, index + 30);
    const correctSelection = response === prompt.expectedResponse;
    const accuratelyRegistered =
      correctSelection && shouldRegisterAccurateResponse(channels.apraxia, channels.stim, channels.synesthesia);

    if (Math.abs(drift.x) + Math.abs(drift.y) > 18 || (correctSelection && !accuratelyRegistered)) {
      delayNextPrompt(feedbackAudioDelayMs.incorrect);
      setStatus('Response was disrupted by movement interference. Try again.');
      onEvent({ type: 'incorrect', note: `Timed focus response misregistered for ${prompt.expectedResponse}.` });
      onEvent({ type: 'disruption', note: 'Timed focus response interrupted during motion surge.' });
      playOneShotClip(feedbackAudio.incorrect, {
        volume: 0.92,
      });
      return;
    }

    if (!correctSelection) {
      delayNextPrompt(feedbackAudioDelayMs.incorrect);
      setStatus(`No. ${response} was registered while ${prompt.expectedResponse} was requested.`);
      onEvent({ type: 'incorrect', note: `Incorrect timed focus response selected for ${prompt.expectedResponse}.` });
      playOneShotClip(feedbackAudio.incorrect, {
        volume: 0.92,
      });
      return;
    }

    delayNextPrompt(feedbackAudioDelayMs.correct);
    playOneShotClip(feedbackAudio.correct, {
      volume: 0.92,
    });
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

      <div className="target-callout">{currentPrompt.label}</div>

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
