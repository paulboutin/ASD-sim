import { CHANNEL_KEYS, DEFAULT_LEVELS, PRESET_LIBRARY } from '../config/channels';
import type { AudioMixLevels, ChannelKey, ChannelLevels, TestId, VisualMixLevels } from '../types/simulation';

const AUDIO_MIX_DEFAULTS: AudioMixLevels = {
  promptVoice: 100,
  distortion: 50,
  intrusiveThoughts: 0,
};

const VISUAL_MIX_DEFAULTS: VisualMixLevels = {
  blur: 50,
  ghosting: 50,
  noise: 50,
  convex: 0,
  flicker: 50,
};

const AUDIO_MIX_KEYS: (keyof AudioMixLevels)[] = ['promptVoice', 'distortion', 'intrusiveThoughts'];
const VISUAL_MIX_KEYS: (keyof VisualMixLevels)[] = ['blur', 'ghosting', 'noise', 'convex', 'flicker'];
const TEST_IDS: TestId[] = ['symbol-selection', 'recognition', 'timed-focus', 'color-selection'];

export interface LoadedPreset {
  levels: ChannelLevels;
  audioMix: AudioMixLevels;
  visualMix: VisualMixLevels;
  intrusiveThoughtsEnabled: boolean;
  selectedTest: TestId | null;
  sourceLabel: string;
}

function clampLevel(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseSearch(search: string): URLSearchParams {
  if (!search) return new URLSearchParams();
  return new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
}

function parseHashSearch(hash: string): URLSearchParams {
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return new URLSearchParams();
  return parseSearch(hash.slice(queryIndex));
}

function pickChannelLevels(params: URLSearchParams): Partial<ChannelLevels> {
  const next: Partial<ChannelLevels> = {};

  CHANNEL_KEYS.forEach((key) => {
    const raw = params.get(key);
    if (raw === null) return;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    next[key] = clampLevel(parsed);
  });

  return next;
}

function clampVisualMix(key: keyof VisualMixLevels, value: number): number {
  if (Number.isNaN(value)) return key === 'convex' ? 0 : 0;
  if (key === 'convex') {
    return Math.max(-100, Math.min(100, Math.round(value)));
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pickAudioMix(params: URLSearchParams): Partial<AudioMixLevels> {
  const next: Partial<AudioMixLevels> = {};

  AUDIO_MIX_KEYS.forEach((key) => {
    const raw = params.get(key);
    if (raw === null) return;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    next[key] = clampLevel(parsed);
  });

  return next;
}

function pickVisualMix(params: URLSearchParams): Partial<VisualMixLevels> {
  const next: Partial<VisualMixLevels> = {};

  VISUAL_MIX_KEYS.forEach((key) => {
    const raw = params.get(key);
    if (raw === null) return;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    next[key] = clampVisualMix(key, parsed);
  });

  return next;
}

function pickIntrusiveToggle(params: URLSearchParams): boolean | null {
  const raw = params.get('intrusiveThoughtsEnabled');
  if (raw === null) return null;
  return raw === '1' || raw.toLowerCase() === 'true';
}

function pickSelectedTest(params: URLSearchParams): TestId | null {
  const raw = params.get('test');
  if (!raw) return null;
  return TEST_IDS.includes(raw as TestId) ? (raw as TestId) : null;
}

export function loadPresetFromLocation(locationSearch: string, locationHash: string): LoadedPreset | null {
  const directParams = parseSearch(locationSearch);
  const hashParams = parseHashSearch(locationHash);

  const merged = new URLSearchParams(directParams);
  hashParams.forEach((value, key) => {
    merged.set(key, value);
  });

  const presetName = merged.get('preset')?.trim().toLowerCase();
  const fromNamedPreset = presetName ? PRESET_LIBRARY[presetName] : undefined;
  const explicitLevels = pickChannelLevels(merged);
  const explicitAudioMix = pickAudioMix(merged);
  const explicitVisualMix = pickVisualMix(merged);
  const intrusiveThoughtsEnabled = pickIntrusiveToggle(merged);
  const selectedTest = pickSelectedTest(merged);

  const nextLevels: ChannelLevels = { ...DEFAULT_LEVELS };
  const nextAudioMix: AudioMixLevels = { ...AUDIO_MIX_DEFAULTS };
  const nextVisualMix: VisualMixLevels = { ...VISUAL_MIX_DEFAULTS };
  let changed = false;

  if (fromNamedPreset) {
    Object.entries(fromNamedPreset).forEach(([key, value]) => {
      if (value === undefined) return;
      nextLevels[key as ChannelKey] = clampLevel(value);
      changed = true;
    });
  }

  Object.entries(explicitLevels).forEach(([key, value]) => {
    if (value === undefined) return;
    nextLevels[key as ChannelKey] = value;
    changed = true;
  });

  Object.entries(explicitAudioMix).forEach(([key, value]) => {
    if (value === undefined) return;
    nextAudioMix[key as keyof AudioMixLevels] = value;
    changed = true;
  });

  Object.entries(explicitVisualMix).forEach(([key, value]) => {
    if (value === undefined) return;
    nextVisualMix[key as keyof VisualMixLevels] = value;
    changed = true;
  });

  if (intrusiveThoughtsEnabled !== null) {
    if (!intrusiveThoughtsEnabled) {
      nextAudioMix.intrusiveThoughts = 0;
    } else if (!('intrusiveThoughts' in explicitAudioMix)) {
      nextAudioMix.intrusiveThoughts = 50;
    }
    changed = true;
  }

  if (selectedTest) {
    changed = true;
  }

  if (!changed) return null;

  const sourceLabel = fromNamedPreset
    ? `Loaded preset: ${presetName}${Object.keys(explicitLevels).length ? ' + slider overrides' : ''}`
    : 'Loaded slider values from URL parameters';

  return {
    levels: nextLevels,
    audioMix: nextAudioMix,
    visualMix: nextVisualMix,
    intrusiveThoughtsEnabled: intrusiveThoughtsEnabled ?? false,
    selectedTest,
    sourceLabel,
  };
}

export function buildPresetQuery(
  levels: ChannelLevels,
  audioMix: AudioMixLevels,
  visualMix: VisualMixLevels,
  intrusiveThoughtsEnabled: boolean,
  selectedTest: TestId,
  presetName?: string,
): string {
  const params = new URLSearchParams();

  if (presetName) {
    params.set('preset', presetName);
  }

  CHANNEL_KEYS.forEach((key) => {
    params.set(key, `${levels[key]}`);
  });

  AUDIO_MIX_KEYS.forEach((key) => {
    params.set(key, `${audioMix[key]}`);
  });

  VISUAL_MIX_KEYS.forEach((key) => {
    params.set(key, `${visualMix[key]}`);
  });

  params.set('intrusiveThoughtsEnabled', intrusiveThoughtsEnabled ? '1' : '0');
  params.set('test', selectedTest);

  return params.toString();
}
