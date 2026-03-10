import { CHANNEL_KEYS, DEFAULT_LEVELS, PRESET_LIBRARY } from '../config/channels';
import type { ChannelKey, ChannelLevels } from '../types/simulation';

export interface LoadedPreset {
  levels: ChannelLevels;
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

  const nextLevels: ChannelLevels = { ...DEFAULT_LEVELS };
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

  if (!changed) return null;

  const sourceLabel = fromNamedPreset
    ? `Loaded preset: ${presetName}${Object.keys(explicitLevels).length ? ' + slider overrides' : ''}`
    : 'Loaded slider values from URL parameters';

  return {
    levels: nextLevels,
    sourceLabel,
  };
}

export function buildPresetQuery(levels: ChannelLevels, presetName?: string): string {
  const params = new URLSearchParams();

  if (presetName) {
    params.set('preset', presetName);
  }

  CHANNEL_KEYS.forEach((key) => {
    params.set(key, `${levels[key]}`);
  });

  return params.toString();
}
