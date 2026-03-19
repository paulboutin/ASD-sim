import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChannelReadout } from '../components/ChannelReadout';
import { SimulationControls } from '../components/SimulationControls';
import { SliderPanel } from '../components/SliderPanel';
import { VisualEffectsLayer } from '../components/VisualEffectsLayer';
import { useAudioEngine } from '../engines/audioEngine';
import { getTestById } from '../tests';
import type { SimulationEvent } from '../tests/TestTypes';
import { useSimulation } from '../state/SimulationContext';

interface SessionStats {
  attempts: number;
  responses: number;
  incorrectResponses: number;
  disruptions: number;
  prompts: number;
  notes: string[];
}

const INITIAL_STATS: SessionStats = {
  attempts: 0,
  responses: 0,
  incorrectResponses: 0,
  disruptions: 0,
  prompts: 0,
  notes: [],
};

function nextStats(stats: SessionStats, event: SimulationEvent): SessionStats {
  const notes = event.note ? [event.note, ...stats.notes].slice(0, 6) : stats.notes;

  switch (event.type) {
    case 'attempt':
      return { ...stats, attempts: stats.attempts + 1, notes };
    case 'response':
      return { ...stats, responses: stats.responses + 1, notes };
    case 'incorrect':
      return { ...stats, incorrectResponses: stats.incorrectResponses + 1, notes };
    case 'disruption':
      return { ...stats, disruptions: stats.disruptions + 1, notes };
    case 'prompt':
      return { ...stats, prompts: stats.prompts + 1, notes };
    default:
      return { ...stats, notes };
  }
}

export function SimulationPage() {
  const navigate = useNavigate();
  const {
    state: { channels, muted, paused, restartNonce, selectedTest, warningsAccepted },
    setChannel,
    setMuted,
    setPaused,
    resetChannels,
    restartSession,
    saveDebrief,
  } = useSimulation();
  const [stats, setStats] = useState<SessionStats>(INITIAL_STATS);
  const [tick, setTick] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const test = useMemo(() => getTestById(selectedTest), [selectedTest]);
  const sessionKey = `${selectedTest}-${restartNonce}`;
  const TestComponent = test.component;

  useEffect(() => {
    if (warningsAccepted) return;
    navigate('/');
  }, [navigate, warningsAccepted]);

  useEffect(() => {
    if (paused) return;

    const interval = window.setInterval(() => {
      setTick((value) => value + 90);
    }, 90);

    return () => {
      window.clearInterval(interval);
    };
  }, [paused]);

  const { triggerCrossSensoryTone } = useAudioEngine({
    enabled: true,
    muted,
    paused,
    hearingLevel: channels.hearing,
    synesthesiaLevel: channels.synesthesia,
  });

  const handleEvent = useCallback(
    (event: SimulationEvent): void => {
      setStats((current) => nextStats(current, event));
      if (channels.synesthesia >= 10) {
        triggerCrossSensoryTone();
      }
    },
    [channels.synesthesia, triggerCrossSensoryTone],
  );

  const openDebrief = (): void => {
    saveDebrief({
      testId: selectedTest,
      testTitle: test.label,
      channelLevels: channels,
      attempts: stats.attempts,
      responses: stats.responses,
      incorrectResponses: stats.incorrectResponses,
      disruptions: stats.disruptions,
      prompts: stats.prompts,
      notes: stats.notes,
    });
    navigate('/debrief');
  };

  const handleRestart = (): void => {
    setStats(INITIAL_STATS);
    restartSession();
  };

  return (
    <main className="page simulation-page">
      <section className="panel">
        <h1>Simulation View</h1>
        <p>
          {test.label} is active. Use pause/restart/mute controls anytime. This environment is for educational
          discussion, not performance scoring.
        </p>
      </section>

      <SimulationControls
        paused={paused}
        muted={muted}
        settingsOpen={settingsOpen}
        onTogglePause={() => setPaused(!paused)}
        onRestart={handleRestart}
        onToggleMute={() => setMuted(!muted)}
        onToggleSettings={() => setSettingsOpen((open) => !open)}
        onReturnToSetup={() => navigate('/setup')}
        onOpenDebrief={openDebrief}
      />

      {settingsOpen ? (
        <section className="panel settings-drawer">
          <SliderPanel levels={channels} onChange={setChannel} onReset={resetChannels} embedded />
        </section>
      ) : null}

      {muted ? (
        <section className="panel audio-note">
          <p>
            Audio output is currently muted. Use <strong>Unmute Audio</strong> to hear spoken prompts and
            layered hearing distortion.
          </p>
        </section>
      ) : null}

      <section className="simulation-layout">
        <ChannelReadout channels={channels} />

        <VisualEffectsLayer vision={channels.vision} synesthesia={channels.synesthesia} tick={tick}>
          <TestComponent
            key={sessionKey}
            channels={channels}
            paused={paused}
            audioEnabled={!muted}
            onEvent={handleEvent}
          />
        </VisualEffectsLayer>
      </section>

      <section className="panel stats-panel">
        <h2>Current Session Activity</h2>
        <ul>
          <li>Attempts: {stats.attempts}</li>
          <li>Incorrect responses: {stats.incorrectResponses}</li>
          <li>Disruptions observed: {stats.disruptions}</li>
          <li>Timed prompts shown: {stats.prompts}</li>
        </ul>
      </section>
    </main>
  );
}
