import { useId, useMemo, type ReactNode } from 'react';
import { getVisualProfile } from '../engines/visualEffectsEngine';
import type { VisualMixLevels } from '../types/simulation';

interface VisualEffectsLayerProps {
  vision: number;
  synesthesia: number;
  visualMix: VisualMixLevels;
  tick: number;
  children: ReactNode;
}

function createBarrelMapDataUrl(size = 256): string | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const imageData = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x / (size - 1)) * 2 - 1;
      const ny = (y / (size - 1)) * 2 - 1;
      const radius = Math.min(1, Math.sqrt(nx * nx + ny * ny));
      const curve = radius * radius;

      const rx = Math.max(0, Math.min(255, Math.round(128 + nx * curve * 110)));
      const gy = Math.max(0, Math.min(255, Math.round(128 + ny * curve * 110)));
      const offset = (y * size + x) * 4;

      imageData.data[offset] = rx;
      imageData.data[offset + 1] = gy;
      imageData.data[offset + 2] = 128;
      imageData.data[offset + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function VisualEffectsLayer({ vision, synesthesia, visualMix, tick, children }: VisualEffectsLayerProps) {
  const filterId = useId().replace(/:/g, '');
  const profile = getVisualProfile(vision, synesthesia, tick, visualMix);
  const barrelMapHref = useMemo(() => createBarrelMapDataUrl(), []);
  const stageStyle = {
    ...profile.stageStyle,
    filter: profile.convexWarpScale > 0 && barrelMapHref ? `url(#${filterId})` : undefined,
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
            <feImage
              href={barrelMapHref ?? undefined}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="warpMap"
            />
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
