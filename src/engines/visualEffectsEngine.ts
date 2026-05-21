import type { CSSProperties } from 'react';
import type { VisualMixLevels } from '../types/simulation';

export interface VisualProfile {
  shellStyle: CSSProperties;
  stageStyle: CSSProperties;
  contentStyle: CSSProperties;
  ghostStyle: CSSProperties;
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

export function getVisualProfile(
  vision: number,
  synesthesia: number,
  tick: number,
  visualMix: VisualMixLevels,
  crossSensoryProximity = 0,
): VisualProfile {
  const visualMaster = Math.max(0, Math.min(100, vision)) / 100;
  const crossSensoryActivation = Math.max(0, Math.min(1, crossSensoryProximity)) * Math.max(0, Math.min(1, synesthesia / 100));
  const blurLevel = visualMix.blur * visualMaster;
  const ghostLevel = visualMix.ghosting * visualMaster;
  const noiseLevel = visualMix.noise * visualMaster;
  const lensLevel = Math.abs(visualMix.convex);
  const flickerLevel = visualMix.flicker * visualMaster;
  const lensDirection = Math.sign(visualMix.convex);

  const blur = (blurLevel / 100) * 3.6;
  const contrastDrop = 1 - (blurLevel * 0.2 + noiseLevel * 0.18) / 300;
  const flicker = getFlickerPulse(flickerLevel, tick);
  const touchFlicker = (flickerLevel / 100) * crossSensoryActivation * 0.18;
  const brightness = 1 + Math.sin(tick * 0.0048) * (flickerLevel / 1100) - flicker * 0.46 - touchFlicker;
  const fisheyeAngle = lensDirection === 0 ? 0 : (((lensLevel / 100) ** 1.04) * Math.PI * 0.78 * lensDirection);
  const stageScale = Math.max(0.82, 1 - lensLevel / 560);
  const appearanceMixLevel = Math.max(blurLevel, ghostLevel, noiseLevel, flickerLevel);
  const ghostBlur = 0.4 + (ghostLevel / 100) * 1.4;

  return {
    shellStyle: {},
    stageStyle: {
      transform: `scale(${stageScale.toFixed(3)})`,
    },
    contentStyle: {
      filter: `blur(${blur.toFixed(2)}px) contrast(${contrastDrop.toFixed(2)}) brightness(${brightness.toFixed(2)})`,
    },
    ghostStyle: {
      filter: `blur(${ghostBlur.toFixed(2)}px) saturate(0.9)`,
      opacity: Math.min(0.42, ghostLevel / 230),
    },
    fisheyeAngle,
    noiseOpacity: Math.min(0.92, (noiseLevel / 132) * (1 + crossSensoryActivation * 0.85)),
    ghostOpacity: Math.min(0.42, ghostLevel / 230),
    shimmerOpacity:
      appearanceMixLevel > 0 ? Math.min(0.45, synesthesia / 250 + crossSensoryActivation * 0.16) : 0,
    fluorescentOpacity: Math.min(0.36, flicker + touchFlicker),
  };
}
