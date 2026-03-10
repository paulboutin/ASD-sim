import type { ChannelKey, ChannelLevels } from '../types/simulation';

export interface ChannelConfig {
  key: ChannelKey;
  label: string;
  description: string;
  max: number;
}

export const CHANNEL_CONFIG: ChannelConfig[] = [
  {
    key: 'apraxia',
    label: 'Apraxia / Motor-planning',
    description: 'Models planning and execution mismatch for intended interactions inside the simulator.',
    max: 100,
  },
  {
    key: 'stim',
    label: 'Need to Stim / Involuntary Disruption',
    description: 'Adds competing motion and interruption patterns that reduce stable focus.',
    max: 100,
  },
  {
    key: 'hearing',
    label: 'Hearing Distortions',
    description: 'Adds optional layered audio interference such as buzzing, tone overlap, and contrast shifts.',
    max: 100,
  },
  {
    key: 'vision',
    label: 'Vision Distortions',
    description: 'Applies blur, contrast shifts, ghosting, and visual noise within the simulated area.',
    max: 100,
  },
  {
    key: 'synesthesia',
    label: 'Cross-sensory Interference',
    description: 'Introduces linked audio-visual disruption during movement and interaction events.',
    max: 100,
  },
];

export const DEFAULT_LEVELS: ChannelLevels = {
  apraxia: 25,
  stim: 20,
  hearing: 15,
  vision: 20,
  synesthesia: 10,
};

export const PRESET_LIBRARY: Record<string, Partial<ChannelLevels>> = {
  lucas: {
    apraxia: 70,
    hearing: 40,
    vision: 60,
    stim: 50,
    synesthesia: 30,
  },
  classroom: {
    apraxia: 45,
    hearing: 25,
    vision: 35,
    stim: 40,
    synesthesia: 20,
  },
  focused: {
    apraxia: 20,
    hearing: 15,
    vision: 15,
    stim: 15,
    synesthesia: 10,
  },
};

export const CHANNEL_KEYS: ChannelKey[] = ['apraxia', 'stim', 'hearing', 'vision', 'synesthesia'];
