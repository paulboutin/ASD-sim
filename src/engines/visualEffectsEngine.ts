import type { CSSProperties } from 'react';
import type { VisualMixLevels } from '../types/simulation';

export interface VisualProfile {
  shellStyle: CSSProperties;
  stageStyle: CSSProperties;
  contentStyle: CSSProperties;
  fisheyeAngle: number;
  noiseOpacity: number;
  ghostOpacity: number;
  shimmerOpacity: number;
  fluorescentOpacity: number;
}

function getFlickerPulse(flickerLevel: number, tick: number): number {
  if (flickerLevel <= 0) return 0;
  const wave =
    Math.sin(tick * 0.011) * 0.5 + Math.sin(tick * 0.037) * 0.35 + Math.sin(tick * 0.071) * 0.15;
  const surge = Math.abs(Math.sin(tick * 0.053)) > 0.9 ? 0.12 : 0;
  return Math.max(0, wave) * (flickerLevel / 165) + surge;
}

export function getVisualInterferenceLevel(visualMix: VisualMixLevels): number {
  const total =
    visualMix.blur +
    visualMix.ghosting +
    visualMix.noise +
    visualMix.flicker +
    Math.abs(visualMix.convex);

  return Math.round(total / 5);
}

export function getVisualProfile(
  _vision: number,
  synesthesia: number,
  tick: number,
  visualMix: VisualMixLevels,
): VisualProfile {
  const blurLevel = visualMix.blur;
  const ghostLevel = visualMix.ghosting;
  const noiseLevel = visualMix.noise;
  const lensLevel = Math.abs(visualMix.convex);
  const flickerLevel = visualMix.flicker;
  const lensDirection = Math.sign(visualMix.convex);

  const blur = (blurLevel / 100) * 3.6;
  const contrastDrop = 1 - (blurLevel * 0.18 + ghostLevel * 0.34 + noiseLevel * 0.18) / 300;
  const flicker = getFlickerPulse(flickerLevel, tick);
  const brightness = 1 + Math.sin(tick * 0.0048) * (flickerLevel / 1100) - flicker * 0.46;
  const fisheyeAngle = lensDirection === 0 ? 0 : (((lensLevel / 100) ** 1.04) * Math.PI * 0.78 * lensDirection);
  const stageScale = Math.max(0.82, 1 - lensLevel / 560);
  const overlayMixLevel = Math.max(blurLevel, ghostLevel, noiseLevel, flickerLevel);
  const ghostOffset = (ghostLevel / 100) * 5;

  return {
    shellStyle: {},
    stageStyle: {
      transform: `scale(${stageScale.toFixed(3)})`,
    },
    contentStyle: {
      filter: `blur(${blur.toFixed(2)}px) contrast(${contrastDrop.toFixed(2)}) brightness(${brightness.toFixed(2)}) drop-shadow(${ghostOffset.toFixed(1)}px 0 rgba(42, 130, 180, ${(ghostLevel / 420).toFixed(2)})) drop-shadow(${(-ghostOffset).toFixed(1)}px 0 rgba(210, 88, 120, ${(ghostLevel / 520).toFixed(2)}))`,
      transform: `scale(${(1 + overlayMixLevel / 1500).toFixed(3)})`,
    },
    fisheyeAngle,
    noiseOpacity: Math.min(0.32, noiseLevel / 330),
    ghostOpacity: Math.min(0.45, ghostLevel / 250),
    shimmerOpacity: overlayMixLevel > 0 ? Math.min(0.35, synesthesia / 250) : 0,
    fluorescentOpacity: Math.min(0.28, flicker),
  };
}
