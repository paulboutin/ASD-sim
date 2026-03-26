import { useId, type ReactNode } from 'react';
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
  const filterId = useId().replace(/:/g, '');
  const profile = getVisualProfile(vision, synesthesia, tick, visualMix);
  const redMapHref = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="rgb(0,0,0)"/>
          <stop offset="50%" stop-color="rgb(128,0,0)"/>
          <stop offset="100%" stop-color="rgb(255,0,0)"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#g)"/>
    </svg>`,
  )}`;
  const greenMapHref = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="rgb(0,0,0)"/>
          <stop offset="50%" stop-color="rgb(0,128,0)"/>
          <stop offset="100%" stop-color="rgb(0,255,0)"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#g)"/>
    </svg>`,
  )}`;
  const stageStyle = {
    ...profile.stageStyle,
    filter: profile.convexWarpScale > 0 ? `url(#${filterId})` : undefined,
  };
  const contentStyle = {
    ...profile.contentStyle,
  };

  return (
    <div className="visual-shell" style={profile.shellStyle}>
      <svg className="visual-filter-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter
            id={filterId}
            x="-18%"
            y="-18%"
            width="136%"
            height="136%"
            colorInterpolationFilters="sRGB"
          >
            <feImage href={redMapHref} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="redMap" />
            <feImage
              href={greenMapHref}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="greenMap"
            />
            <feBlend in="redMap" in2="greenMap" mode="screen" result="baseMap" />
            <feComponentTransfer in="baseMap" result="warpMap">
              <feFuncR type="table" tableValues="0 0.01 0.04 0.12 0.28 0.5 0.72 0.88 0.96 0.99 1" />
              <feFuncG type="table" tableValues="0 0.01 0.04 0.12 0.28 0.5 0.72 0.88 0.96 0.99 1" />
              <feFuncB type="identity" />
              <feFuncA type="identity" />
            </feComponentTransfer>
            <feDisplacementMap
              in="SourceGraphic"
              in2="warpMap"
              scale={profile.convexWarpScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div className="visual-stage" style={stageStyle}>
        <div className="visual-content" style={contentStyle}>
          {children}
        </div>
        <div className="visual-noise" style={{ opacity: profile.noiseOpacity }} />
        <div className="visual-ghost" style={{ opacity: profile.ghostOpacity }} />
        <div className="visual-shimmer" style={{ opacity: profile.shimmerOpacity }} />
        <div className="visual-convex" style={{ opacity: profile.convexOpacity }} />
        <div className="visual-fluorescent" style={{ opacity: profile.fluorescentOpacity }} />
      </div>
    </div>
  );
}
