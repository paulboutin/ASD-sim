import type { ChannelLevels } from '../types/simulation';

export type SimulationEventType = 'attempt' | 'response' | 'disruption' | 'prompt';

export interface SimulationEvent {
  type: SimulationEventType;
  note?: string;
}

export interface TestProps {
  channels: ChannelLevels;
  paused: boolean;
  onEvent: (event: SimulationEvent) => void;
}
