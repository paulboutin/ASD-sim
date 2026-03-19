import type { ChannelLevels } from '../types/simulation';

export type SimulationEventType = 'attempt' | 'response' | 'incorrect' | 'disruption' | 'prompt';

export interface SimulationEvent {
  type: SimulationEventType;
  note?: string;
}

export interface TestProps {
  channels: ChannelLevels;
  paused: boolean;
  audioEnabled: boolean;
  onEvent: (event: SimulationEvent) => void;
}
