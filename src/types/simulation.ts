export type ChannelKey = 'apraxia' | 'stim' | 'hearing' | 'vision' | 'synesthesia';

export type ChannelLevels = Record<ChannelKey, number>;

export type TestId = 'symbol-selection' | 'recognition' | 'timed-focus';

export interface DebriefSnapshot {
  testId: TestId;
  testTitle: string;
  channelLevels: ChannelLevels;
  notes: string[];
  attempts: number;
  responses: number;
  disruptions: number;
  prompts: number;
}
