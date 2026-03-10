import type { CSSProperties } from 'react';

export interface VisualProfile {
  containerStyle: CSSProperties;
  noiseOpacity: number;
  ghostOpacity: number;
  shimmerOpacity: number;
}

export function getVisualProfile(vision: number, synesthesia: number, tick: number): VisualProfile {
  const blur = (vision / 100) * 4;
  const contrastDrop = 1 - vision / 260;
  const pulse = 1 + Math.sin(tick * 0.0027) * (vision / 800);

  return {
    containerStyle: {
      filter: `blur(${blur.toFixed(2)}px) contrast(${contrastDrop.toFixed(2)}) brightness(${pulse.toFixed(2)})`,
      transform: `scale(${(1 + vision / 1400).toFixed(3)})`,
    },
    noiseOpacity: Math.min(0.32, vision / 330),
    ghostOpacity: Math.min(0.45, vision / 280),
    shimmerOpacity: Math.min(0.35, synesthesia / 250),
  };
}
