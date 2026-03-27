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
    state: { channels, audioMix, visualMix, intrusiveThoughtsEnabled, selectedTest },
    applyLevels,
    resetChannels,
    resetAudioMix,
    resetVisualMix,
    setChannel,
    setAudioMix,
    setVisualMix,
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
    setAudioMix('promptVoice', loadedPreset.audioMix.promptVoice);
    setAudioMix('distortion', loadedPreset.audioMix.distortion);
    setAudioMix('intrusiveThoughts', loadedPreset.audioMix.intrusiveThoughts);
    setVisualMix('blur', loadedPreset.visualMix.blur);
    setVisualMix('ghosting', loadedPreset.visualMix.ghosting);
    setVisualMix('noise', loadedPreset.visualMix.noise);
    setVisualMix('convex', loadedPreset.visualMix.convex);
    setVisualMix('flicker', loadedPreset.visualMix.flicker);
    setIntrusiveThoughtsEnabled(loadedPreset.intrusiveThoughtsEnabled);
    if (loadedPreset.selectedTest) {
      setTest(loadedPreset.selectedTest);
    }
  }, [applyLevels, loadedPreset, setAudioMix, setIntrusiveThoughtsEnabled, setTest, setVisualMix]);

  const shareLink = useMemo(() => {
    const query = buildPresetQuery(channels, audioMix, visualMix, intrusiveThoughtsEnabled, selectedTest);
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#/setup?${query}`;
  }, [audioMix, channels, intrusiveThoughtsEnabled, selectedTest, visualMix]);

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
        visualMix={visualMix}
        intrusiveThoughtsEnabled={intrusiveThoughtsEnabled}
        onChange={setChannel}
        onAudioMixChange={setAudioMix}
        onVisualMixChange={setVisualMix}
        onSetIntrusiveThoughtsEnabled={setIntrusiveThoughtsEnabled}
        onReset={resetChannels}
        onResetAudioMix={resetAudioMix}
        onResetVisualMix={resetVisualMix}
      />

      <section className="panel">
        <h2>Preset Link (Query-string Ready)</h2>
        <p>
          Share this URL to load current slider levels. Supports forms like
          <code>?preset=lucas</code> and explicit channel, mix, and test values.
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
