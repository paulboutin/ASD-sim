export type ChannelKey = 'apraxia' | 'stim' | 'hearing' | 'vision' | 'synesthesia';

export type ChannelLevels = Record<ChannelKey, number>;

export interface AudioMixLevels {
  promptVoice: number;
  distortion: number;
  intrusiveThoughts: number;
}

export type TestId = 'symbol-selection' | 'recognition' | 'timed-focus' | 'color-selection';

export interface DebriefSnapshot {
  testId: TestId;
  testTitle: string;
  channelLevels: ChannelLevels;
  audioMixLevels: AudioMixLevels;
  intrusiveThoughtsEnabled: boolean;
  notes: string[];
  attempts: number;
  responses: number;
  incorrectResponses: number;
  disruptions: number;
  prompts: number;
}
