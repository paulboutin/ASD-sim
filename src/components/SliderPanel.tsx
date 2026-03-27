import { CHANNEL_CONFIG } from '../config/channels';
import type { AudioMixLevels, ChannelKey, ChannelLevels, VisualMixLevels } from '../types/simulation';

interface SliderPanelProps {
  levels: ChannelLevels;
  audioMix: AudioMixLevels;
  visualMix: VisualMixLevels;
  intrusiveThoughtsEnabled: boolean;
  onChange: (key: keyof ChannelLevels, value: number) => void;
  onAudioMixChange: (key: keyof AudioMixLevels, value: number) => void;
  onVisualMixChange: (key: keyof VisualMixLevels, value: number) => void;
  onSetIntrusiveThoughtsEnabled: (enabled: boolean) => void;
  onReset: () => void;
  onResetAudioMix: () => void;
  onResetVisualMix: () => void;
  embedded?: boolean;
}

const CHANNEL_BY_KEY = Object.fromEntries(CHANNEL_CONFIG.map((channel) => [channel.key, channel])) as Record<
  ChannelKey,
  (typeof CHANNEL_CONFIG)[number]
>;

const INTERACTION_KEYS: ChannelKey[] = ['apraxia', 'stim', 'synesthesia'];

export function SliderPanel({
  levels,
  audioMix,
  visualMix,
  intrusiveThoughtsEnabled,
  onChange,
  onAudioMixChange,
  onVisualMixChange,
  onSetIntrusiveThoughtsEnabled,
  onReset,
  onResetAudioMix,
  onResetVisualMix,
  embedded = false,
}: SliderPanelProps) {
  const renderChannelRow = (key: ChannelKey) => {
    const channel = CHANNEL_BY_KEY[key];

    return (
      <label key={channel.key} className="slider-row">
        <div className="slider-row-header">
          <span>{channel.label}</span>
          <output>{levels[channel.key]}</output>
        </div>
        <input
          type="range"
          min={0}
          max={channel.max}
          step={1}
          value={levels[channel.key]}
          onChange={(event) => onChange(channel.key, Number(event.target.value))}
        />
        <small>{channel.description}</small>
      </label>
    );
  };

  return (
    <section className={embedded ? 'slider-panel-embedded' : 'panel'}>
      <div className="panel-header-row">
        <div>
          <h2>Simulation Settings</h2>
          <p className="panel-subtitle">
            Channel levels shape the simulation itself. Audio and visual mix controls let you tune how each effect
            presents inside that channel.
          </p>
        </div>
        <button type="button" className="ghost-button" onClick={onReset}>
          Reset Channel Levels
        </button>
      </div>

      <div className="settings-group-grid">
        <section className="settings-group-card">
          <div className="settings-group-header">
            <div>
              <h3>Interaction Channels</h3>
              <p>Core movement and attention layers that affect how the tests behave.</p>
            </div>
          </div>
          <div className="slider-stack">{INTERACTION_KEYS.map(renderChannelRow)}</div>
        </section>

        <section className="settings-group-card settings-group-card-wide">
          <div className="settings-group-header">
            <div>
              <h3>Audio Settings</h3>
              <p>Keep the audio distortions and their playback volumes together so they can be balanced quickly.</p>
            </div>
            <button type="button" className="ghost-button" onClick={onResetAudioMix}>
              Reset Audio Settings
            </button>
          </div>

          <div className="settings-inline-grid">
            <label className="slider-row">
              <div className="slider-row-header">
                <span>{CHANNEL_BY_KEY.hearing.label}</span>
                <output>{levels.hearing}</output>
              </div>
              <input
                type="range"
                min={0}
                max={CHANNEL_BY_KEY.hearing.max}
                step={1}
                value={levels.hearing}
                onChange={(event) => onChange('hearing', Number(event.target.value))}
              />
              <small>{CHANNEL_BY_KEY.hearing.description}</small>
            </label>

            <label className="slider-row">
              <div className="slider-row-header">
                <span>Distraction Audio Volume</span>
                <output>{audioMix.distortion}</output>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={audioMix.distortion}
                onChange={(event) => onAudioMixChange('distortion', Number(event.target.value))}
              />
              <small>Controls buzzing, fluorescent hum, crackle, and cross-sensory interference tones.</small>
            </label>
          </div>

          <div className="settings-inline-grid">
            <label className="slider-row">
              <div className="slider-row-header">
                <span>Prompt Voice Volume</span>
                <output>{audioMix.promptVoice}</output>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={audioMix.promptVoice}
                onChange={(event) => onAudioMixChange('promptVoice', Number(event.target.value))}
              />
              <small>Controls the spoken prompt voice and the spoken “No.” feedback.</small>
            </label>

            <section className="content-toggle-card content-toggle-inline">
              <div className="content-toggle-header">
                <div>
                  <h3>Intrusive Thoughts</h3>
                  <p>Optional hostile internal-thought phrases layered into the hearing channel.</p>
                </div>
                <label className="toggle-checkbox">
                  <input
                    type="checkbox"
                    checked={intrusiveThoughtsEnabled}
                    onChange={(event) => onSetIntrusiveThoughtsEnabled(event.target.checked)}
                  />
                  <span>Enable</span>
                </label>
              </div>

              <label className="slider-row slider-row-muted">
                <div className="slider-row-header">
                  <span>Intrusive-Thought Volume</span>
                  <output>{audioMix.intrusiveThoughts}</output>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={audioMix.intrusiveThoughts}
                  disabled={!intrusiveThoughtsEnabled}
                  onChange={(event) => onAudioMixChange('intrusiveThoughts', Number(event.target.value))}
                />
                <small>
                  Content warning: includes whispered phrases such as &quot;you are so stupid&quot;, &quot;you will
                  never be free&quot;, and &quot;why can&apos;t you just point&quot;.
                </small>
              </label>
            </section>
          </div>
        </section>

        <section className="settings-group-card settings-group-card-wide">
          <div className="settings-group-header">
            <div>
              <h3>Visual Settings</h3>
              <p>Tune each visual distortion directly without a separate master visual slider.</p>
            </div>
            <button type="button" className="ghost-button" onClick={onResetVisualMix}>
              Reset Visual Mix
            </button>
          </div>

          <div className="visual-mix-grid">
            <label className="slider-row">
              <div className="slider-row-header">
                <span>Blur</span>
                <output>{visualMix.blur}</output>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={visualMix.blur}
                onChange={(event) => onVisualMixChange('blur', Number(event.target.value))}
              />
              <small>Controls softness and loss of visual sharpness.</small>
            </label>

            <label className="slider-row">
              <div className="slider-row-header">
                <span>Ghosting</span>
                <output>{visualMix.ghosting}</output>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={visualMix.ghosting}
                onChange={(event) => onVisualMixChange('ghosting', Number(event.target.value))}
              />
              <small>Controls doubled edges and trailing image effects.</small>
            </label>

            <label className="slider-row">
              <div className="slider-row-header">
                <span>Visual Noise</span>
                <output>{visualMix.noise}</output>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={visualMix.noise}
                onChange={(event) => onVisualMixChange('noise', Number(event.target.value))}
              />
              <small>Controls grain and noisy overlay interference.</small>
            </label>

            <label className="slider-row">
              <div className="slider-row-header">
                <span>Lens Distortion</span>
                <output>{visualMix.convex}</output>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={visualMix.convex}
                onChange={(event) => onVisualMixChange('convex', Number(event.target.value))}
              />
              <div className="slider-range-hints" aria-hidden="true">
                <span>Concave</span>
                <span>0</span>
                <span>Convex</span>
              </div>
              <small>Negative values reverse the fisheye into a concave lens. Positive values bow the display outward.</small>
            </label>

            <label className="slider-row">
              <div className="slider-row-header">
                <span>Fluorescent Flicker</span>
                <output>{visualMix.flicker}</output>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={visualMix.flicker}
                onChange={(event) => onVisualMixChange('flicker', Number(event.target.value))}
              />
              <small>Controls unstable brightness flicker from fluorescent-light simulation.</small>
            </label>
          </div>
        </section>
      </div>
    </section>
  );
}
