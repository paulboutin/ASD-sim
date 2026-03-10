import type { ReactNode } from 'react';
import { getVisualProfile } from '../engines/visualEffectsEngine';

interface VisualEffectsLayerProps {
  vision: number;
  synesthesia: number;
  tick: number;
  children: ReactNode;
}

export function VisualEffectsLayer({ vision, synesthesia, tick, children }: VisualEffectsLayerProps) {
  const profile = getVisualProfile(vision, synesthesia, tick);

  return (
    <div className="visual-shell" style={profile.containerStyle}>
      {children}
      <div className="visual-noise" style={{ opacity: profile.noiseOpacity }} />
      <div className="visual-ghost" style={{ opacity: profile.ghostOpacity }} />
      <div className="visual-shimmer" style={{ opacity: profile.shimmerOpacity }} />
    </div>
  );
}
