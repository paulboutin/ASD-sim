import { CHANNEL_CONFIG } from '../config/channels';
import type { ChannelLevels } from '../types/simulation';

interface SliderPanelProps {
  levels: ChannelLevels;
  onChange: (key: keyof ChannelLevels, value: number) => void;
  onReset: () => void;
}

export function SliderPanel({ levels, onChange, onReset }: SliderPanelProps) {
  return (
    <section className="panel">
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
    </section>
  );
}
