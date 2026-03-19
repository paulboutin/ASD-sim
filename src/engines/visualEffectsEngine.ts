import type { CSSProperties } from 'react';

export interface VisualProfile {
  shellStyle: CSSProperties;
  contentStyle: CSSProperties;
  noiseOpacity: number;
  ghostOpacity: number;
  shimmerOpacity: number;
  convexOpacity: number;
  fluorescentOpacity: number;
}

function getFlickerPulse(vision: number, tick: number): number {
  if (vision <= 0) return 0;
  const wave = Math.sin(tick * 0.011) * 0.5 + Math.sin(tick * 0.037) * 0.35 + Math.sin(tick * 0.071) * 0.15;
  const surge = Math.abs(Math.sin(tick * 0.053)) > 0.9 ? 0.12 : 0;
  return Math.max(0, wave) * (vision / 165) + surge;
}

export function getVisualProfile(vision: number, synesthesia: number, tick: number): VisualProfile {
  const blur = (vision / 100) * 2.2;
  const contrastDrop = 1 - vision / 300;
  const flicker = getFlickerPulse(vision, tick);
  const brightness = 1 + Math.sin(tick * 0.0048) * (vision / 1600) - flicker * 0.42;
  const convexDepth = vision / 85;
  const rotateX = Math.sin(tick * 0.0017) * convexDepth * 0.15;
  const rotateY = Math.cos(tick * 0.0014) * convexDepth * 0.18;

  return {
    shellStyle: {
      transform: `perspective(1300px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
    },
    contentStyle: {
      filter: `blur(${blur.toFixed(2)}px) contrast(${contrastDrop.toFixed(2)}) brightness(${brightness.toFixed(2)})`,
      transform: `scale(${(1 + vision / 1700).toFixed(3)})`,
    },
    noiseOpacity: Math.min(0.32, vision / 330),
    ghostOpacity: Math.min(0.45, vision / 280),
    shimmerOpacity: Math.min(0.35, synesthesia / 250),
    convexOpacity: Math.min(0.3, vision / 250),
    fluorescentOpacity: Math.min(0.28, flicker),
  };
}
