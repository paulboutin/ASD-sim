import type { ChannelLevels } from '../types/simulation';

interface ChannelReadoutProps {
  channels: ChannelLevels;
}

export function ChannelReadout({ channels }: ChannelReadoutProps) {
  return (
    <aside className="channel-readout">
      <h3>Active Channel Levels</h3>
      <ul>
        <li>Apraxia: {channels.apraxia}</li>
        <li>Stim: {channels.stim}</li>
        <li>Hearing: {channels.hearing}</li>
        <li>Vision: {channels.vision}</li>
        <li>Synesthesia: {channels.synesthesia}</li>
      </ul>
    </aside>
  );
}
