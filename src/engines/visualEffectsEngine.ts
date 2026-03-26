import type { CSSProperties } from 'react';
import type { VisualMixLevels } from '../types/simulation';

export interface VisualProfile {
  shellStyle: CSSProperties;
  stageStyle: CSSProperties;
  contentStyle: CSSProperties;
  convexWarpScale: number;
  noiseOpacity: number;
  ghostOpacity: number;
  shimmerOpacity: number;
  convexOpacity: number;
  fluorescentOpacity: number;
}

function getFlickerPulse(flickerLevel: number, tick: number): number {
  if (flickerLevel <= 0) return 0;
  const wave =
    Math.sin(tick * 0.011) * 0.5 + Math.sin(tick * 0.037) * 0.35 + Math.sin(tick * 0.071) * 0.15;
  const surge = Math.abs(Math.sin(tick * 0.053)) > 0.9 ? 0.12 : 0;
  return Math.max(0, wave) * (flickerLevel / 165) + surge;
}

export function getVisualProfile(
  vision: number,
  synesthesia: number,
  tick: number,
  visualMix: VisualMixLevels,
): VisualProfile {
  const blurLevel = vision * (visualMix.blur / 100);
  const ghostLevel = vision * (visualMix.ghosting / 100);
  const noiseLevel = vision * (visualMix.noise / 100);
  const convexLevel = vision * (visualMix.convex / 100);
  const flickerLevel = vision * (visualMix.flicker / 100);

  const blur = (blurLevel / 100) * 2.2;
  const contrastDrop = 1 - (vision * 0.55 + ghostLevel * 0.45) / 300;
  const flicker = getFlickerPulse(flickerLevel, tick);
  const brightness = 1 + Math.sin(tick * 0.0048) * (flickerLevel / 1600) - flicker * 0.42;

  return {
    shellStyle: {},
    stageStyle: {},
    contentStyle: {
      filter: `blur(${blur.toFixed(2)}px) contrast(${contrastDrop.toFixed(2)}) brightness(${brightness.toFixed(2)})`,
      transform: `scale(${(1 + vision / 1700).toFixed(3)})`,
    },
    convexWarpScale: Math.round(((convexLevel / 100) ** 1.15) * 260),
    noiseOpacity: Math.min(0.32, noiseLevel / 330),
    ghostOpacity: Math.min(0.45, ghostLevel / 250),
    shimmerOpacity: Math.min(0.35, synesthesia / 250),
    convexOpacity: 0,
    fluorescentOpacity: Math.min(0.28, flicker),
  };
}
