import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SliderPanel } from '../components/SliderPanel';
import { TestSelector } from '../components/TestSelector';
import { WarningPanel } from '../components/WarningPanel';
import { useSimulation } from '../state/SimulationContext';
import { buildPresetQuery, loadPresetFromLocation } from '../utils/presets';

export function SetupPage() {
  const navigate = useNavigate();
  const {
    state: { channels, audioMix, intrusiveThoughtsEnabled, selectedTest },
    applyLevels,
    resetChannels,
    resetAudioMix,
    setChannel,
    setAudioMix,
    setIntrusiveThoughtsEnabled,
    setTest,
  } = useSimulation();
  const loadedPreset = useMemo(
    () => loadPresetFromLocation(window.location.search, window.location.hash),
    [],
  );

  useEffect(() => {
    if (!loadedPreset) return;
    applyLevels(loadedPreset.levels);
  }, [applyLevels, loadedPreset]);

  const shareLink = useMemo(() => {
    const query = buildPresetQuery(channels);
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#/setup?${query}`;
  }, [channels]);

  return (
    <main className="page">
      <section className="panel">
        <h1>Simulator Setup</h1>
        <p>
          Choose a simulation test and adjust global channel intensity. These settings carry directly into the
          simulation environment.
        </p>
        {loadedPreset ? <p className="preset-message">{loadedPreset.sourceLabel}</p> : null}
      </section>

      <TestSelector selectedTest={selectedTest} onSelect={setTest} />

      <SliderPanel
        levels={channels}
        audioMix={audioMix}
        intrusiveThoughtsEnabled={intrusiveThoughtsEnabled}
        onChange={setChannel}
        onAudioMixChange={setAudioMix}
        onSetIntrusiveThoughtsEnabled={setIntrusiveThoughtsEnabled}
        onReset={resetChannels}
        onResetAudioMix={resetAudioMix}
      />

      <section className="panel">
        <h2>Preset Link (Query-string Ready)</h2>
        <p>
          Share this URL to load current slider levels. Supports forms like
          <code>?preset=lucas</code> and explicit channel values.
        </p>
        <input type="text" value={shareLink} readOnly />
      </section>

      <WarningPanel compact />

      <div className="page-footer-actions">
        <button type="button" onClick={() => navigate('/')}>
          Back to Intro
        </button>
        <button type="button" className="primary-button" onClick={() => navigate('/simulate')}>
          Open Simulation
        </button>
      </div>
    </main>
  );
}
