import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimulationControls } from '../components/SimulationControls';
import { SliderPanel } from '../components/SliderPanel';
import { VisualEffectsLayer } from '../components/VisualEffectsLayer';
import { useAudioEngine } from '../engines/audioEngine';
import { getVisualInterferenceLevel } from '../engines/visualEffectsEngine';
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

function getPercentCorrect(stats: SessionStats): number {
  const scoredResponses = stats.responses + stats.incorrectResponses;
  if (scoredResponses === 0) return 0;
  return Math.round((stats.responses / scoredResponses) * 100);
}

export function SimulationPage() {
  const navigate = useNavigate();
  const simulationRef = useRef<HTMLElement | null>(null);
  const {
    state: {
      channels,
      audioMix,
      visualMix,
      muted,
      paused,
      intrusiveThoughtsEnabled,
      restartNonce,
      selectedTest,
      warningsAccepted,
    },
    setChannel,
    setAudioMix,
    setVisualMix,
    setIntrusiveThoughtsEnabled,
    setMuted,
    setPaused,
    resetChannels,
    resetAudioMix,
    resetVisualMix,
    restartSession,
    saveDebrief,
  } = useSimulation();
  const [stats, setStats] = useState<SessionStats>(INITIAL_STATS);
  const [tick, setTick] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const test = useMemo(() => getTestById(selectedTest), [selectedTest]);
  const sessionKey = `${selectedTest}-${restartNonce}`;
  const TestComponent = test.component;
  const effectiveVision = useMemo(() => getVisualInterferenceLevel(visualMix), [visualMix]);
  const effectiveChannels = useMemo(
    () => ({
      ...channels,
      vision: effectiveVision,
    }),
    [channels, effectiveVision],
  );
  const percentCorrect = getPercentCorrect(stats);

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

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = (): void => {
      setIsFullscreen(document.fullscreenElement === simulationRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const { triggerCrossSensoryTone } = useAudioEngine({
    enabled: true,
    muted,
    paused,
    hearingLevel: channels.hearing,
    synesthesiaLevel: channels.synesthesia,
    intrusiveThoughtsEnabled,
    distortionVolume: audioMix.distortion,
    intrusiveThoughtsVolume: audioMix.intrusiveThoughts,
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

  const openDebrief = useCallback((): void => {
    saveDebrief({
      testId: selectedTest,
      testTitle: test.label,
      channelLevels: effectiveChannels,
      audioMixLevels: audioMix,
      visualMixLevels: visualMix,
      intrusiveThoughtsEnabled,
      attempts: stats.attempts,
      responses: stats.responses,
      incorrectResponses: stats.incorrectResponses,
      disruptions: stats.disruptions,
      prompts: stats.prompts,
      notes: stats.notes,
    });
    navigate('/debrief');
  }, [audioMix, effectiveChannels, intrusiveThoughtsEnabled, navigate, saveDebrief, selectedTest, stats, test.label, visualMix]);

  const handleRestart = (): void => {
    setStats(INITIAL_STATS);
    restartSession();
  };

  const handleToggleFullscreen = useCallback((): void => {
    const container = simulationRef.current;
    if (!container || typeof document === 'undefined') return;

    if (document.fullscreenElement === container) {
      void document.exitFullscreen();
      return;
    }

    void container.requestFullscreen();
  }, []);

  const handleReturnToSetup = useCallback((): void => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      void document.exitFullscreen();
    }
    navigate('/setup');
  }, [navigate]);

  const handleOpenDebrief = useCallback((): void => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      void document.exitFullscreen();
    }
    openDebrief();
  }, [openDebrief]);

  return (
    <main ref={simulationRef} className={`page simulation-page ${isFullscreen ? 'is-fullscreen' : ''}`}>
      <section className={`panel simulation-intro ${isFullscreen ? 'fullscreen-hidden' : ''}`}>
        <h1>Simulation View</h1>
        <p>
          {test.label} is active. Use pause/restart/mute controls anytime. This environment is for educational
          discussion, not performance scoring.
        </p>
      </section>

      {!isFullscreen ? (
        <SimulationControls
          paused={paused}
          muted={muted}
          settingsOpen={settingsOpen}
          fullscreenActive={isFullscreen}
          onTogglePause={() => setPaused(!paused)}
          onRestart={handleRestart}
          onToggleMute={() => setMuted(!muted)}
          onToggleSettings={() => setSettingsOpen((open) => !open)}
          onToggleFullscreen={handleToggleFullscreen}
          onReturnToSetup={handleReturnToSetup}
          onOpenDebrief={handleOpenDebrief}
        />
      ) : null}

      <section className={`simulation-stage ${isFullscreen ? 'simulation-stage-fullscreen' : ''}`}>
        {isFullscreen ? (
          <div className="fullscreen-toolbar">
            <div className="fullscreen-toolbar-header">
              <div>
                <strong>{test.label}</strong>
                <span>Fullscreen simulation mode</span>
              </div>
              <p>Press Esc or use Exit Fullscreen to close this view.</p>
            </div>
            <SimulationControls
              paused={paused}
              muted={muted}
              settingsOpen={settingsOpen}
              fullscreenActive={isFullscreen}
              variant="fullscreen"
              onTogglePause={() => setPaused(!paused)}
              onRestart={handleRestart}
              onToggleMute={() => setMuted(!muted)}
              onToggleSettings={() => setSettingsOpen((open) => !open)}
              onToggleFullscreen={handleToggleFullscreen}
              onReturnToSetup={handleReturnToSetup}
              onOpenDebrief={handleOpenDebrief}
            />
          </div>
        ) : null}

        {muted ? (
          <section className={`panel audio-note ${isFullscreen ? 'audio-note-floating' : ''}`}>
            <p>
              Audio output is currently muted. Use <strong>Unmute Audio</strong> to hear spoken prompts and
              layered hearing distortion.
            </p>
          </section>
        ) : null}

        <section className={`simulation-layout ${isFullscreen ? 'simulation-layout-fullscreen' : ''}`}>
          {!isFullscreen ? (
            <section className="panel stats-panel stats-panel-inline">
              <h2>Current Session Activity</h2>
              <ul>
                <li>Attempts: {stats.attempts}</li>
                <li>Incorrect responses: {stats.incorrectResponses}</li>
                <li>Disruptions observed: {stats.disruptions}</li>
                <li>Percent correct: {percentCorrect}%</li>
              </ul>
            </section>
          ) : null}

          <VisualEffectsLayer
            vision={effectiveVision}
            synesthesia={channels.synesthesia}
            visualMix={visualMix}
            tick={tick}
          >
            <TestComponent
              key={sessionKey}
              channels={effectiveChannels}
              paused={paused}
              audioEnabled={!muted}
              promptVoiceVolume={audioMix.promptVoice}
              onEvent={handleEvent}
            />
          </VisualEffectsLayer>
        </section>

        {settingsOpen ? (
          <section className={`panel settings-drawer ${isFullscreen ? 'settings-drawer-floating' : ''}`}>
            <SliderPanel
              levels={channels}
              audioMix={audioMix}
              visualMix={visualMix}
              intrusiveThoughtsEnabled={intrusiveThoughtsEnabled}
              onChange={setChannel}
              onAudioMixChange={setAudioMix}
              onVisualMixChange={setVisualMix}
              onSetIntrusiveThoughtsEnabled={setIntrusiveThoughtsEnabled}
              onReset={resetChannels}
              onResetAudioMix={resetAudioMix}
              onResetVisualMix={resetVisualMix}
              embedded
            />
          </section>
        ) : null}

        {isFullscreen ? (
          <div className="fullscreen-hud">
            <div className="fullscreen-hud-card">
              <h2>Session</h2>
              <ul>
                <li>Status: {paused ? 'Paused' : 'Running'}</li>
                <li>Audio: {muted ? 'Muted' : 'On'}</li>
                <li>Attempts: {stats.attempts}</li>
                <li>Incorrect: {stats.incorrectResponses}</li>
                <li>Percent correct: {percentCorrect}%</li>
              </ul>
            </div>
            <div className="fullscreen-hud-card">
              <h2>Channels</h2>
              <ul>
                <li>Apraxia: {channels.apraxia}</li>
                <li>Stim: {channels.stim}</li>
                <li>Hearing: {channels.hearing}</li>
                <li>Vision: {effectiveVision}</li>
                <li>Synesthesia: {channels.synesthesia}</li>
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
