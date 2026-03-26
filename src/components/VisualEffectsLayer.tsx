import type { ReactNode } from 'react';
import { getVisualProfile } from '../engines/visualEffectsEngine';
import type { VisualMixLevels } from '../types/simulation';

interface VisualEffectsLayerProps {
  vision: number;
  synesthesia: number;
  visualMix: VisualMixLevels;
  tick: number;
  children: ReactNode;
}

export function VisualEffectsLayer({ vision, synesthesia, visualMix, tick, children }: VisualEffectsLayerProps) {
  const profile = getVisualProfile(vision, synesthesia, tick, visualMix);

  return (
    <div className="visual-shell" style={profile.shellStyle}>
      <div className="visual-content" style={profile.contentStyle}>
        {children}
      </div>
      <div className="visual-noise" style={{ opacity: profile.noiseOpacity }} />
      <div className="visual-ghost" style={{ opacity: profile.ghostOpacity }} />
      <div className="visual-shimmer" style={{ opacity: profile.shimmerOpacity }} />
      <div className="visual-convex" style={{ opacity: profile.convexOpacity }} />
      <div className="visual-fluorescent" style={{ opacity: profile.fluorescentOpacity }} />
    </div>
  );
}
