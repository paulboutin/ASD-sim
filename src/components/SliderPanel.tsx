import { CHANNEL_CONFIG } from '../config/channels';
import type { AudioMixLevels, ChannelLevels } from '../types/simulation';

interface SliderPanelProps {
  levels: ChannelLevels;
  audioMix: AudioMixLevels;
  intrusiveThoughtsEnabled: boolean;
  onChange: (key: keyof ChannelLevels, value: number) => void;
  onAudioMixChange: (key: keyof AudioMixLevels, value: number) => void;
  onSetIntrusiveThoughtsEnabled: (enabled: boolean) => void;
  onReset: () => void;
  onResetAudioMix: () => void;
  embedded?: boolean;
}

export function SliderPanel({
  levels,
  audioMix,
  intrusiveThoughtsEnabled,
  onChange,
  onAudioMixChange,
  onSetIntrusiveThoughtsEnabled,
  onReset,
  onResetAudioMix,
  embedded = false,
}: SliderPanelProps) {
  return (
    <section className={embedded ? 'slider-panel-embedded' : 'panel'}>
      <div className="panel-header-row">
        <h2>Global Interference Channels</h2>
        <button type="button" className="ghost-button" onClick={onReset}>
          Reset to Defaults
        </button>
      </div>

      <p className="panel-subtitle">
        All tests consume this same channel state. Slider changes update active simulations in real time.
      </p>

      <div className="slider-stack">
        {CHANNEL_CONFIG.map((channel) => (
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
        ))}
      </div>

      <section className="audio-mix-card">
        <div className="panel-header-row">
          <div>
            <h3>Audio Mix</h3>
            <p className="panel-subtitle">Adjust spoken prompts, interference audio, and intrusive-thought audio separately.</p>
          </div>
          <button type="button" className="ghost-button" onClick={onResetAudioMix}>
            Reset Audio Mix
          </button>
        </div>

        <div className="slider-stack">
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

          <label className="slider-row">
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
              onChange={(event) => onAudioMixChange('intrusiveThoughts', Number(event.target.value))}
            />
            <small>Controls the volume of the optional whispered hostile-thought phrases only.</small>
          </label>
        </div>
      </section>

      <section className="content-toggle-card">
        <div className="content-toggle-header">
          <div>
            <h3>Optional Audio Content</h3>
            <p>
              Adds low-volume hostile internal-thought phrases to the hearing channel. This is off by default and
              should only be used deliberately.
            </p>
          </div>
          <label className="toggle-checkbox">
            <input
              type="checkbox"
              checked={intrusiveThoughtsEnabled}
              onChange={(event) => onSetIntrusiveThoughtsEnabled(event.target.checked)}
            />
            <span>Enable intrusive-thought audio</span>
          </label>
        </div>
        <p className="content-warning">
          Content warning: includes whispered phrases such as &quot;you are so stupid&quot;, &quot;you will never
          be free&quot;, and &quot;why can&apos;t you just point&quot;. Disable immediately if it becomes too intense.
        </p>
      </section>
    </section>
  );
}
