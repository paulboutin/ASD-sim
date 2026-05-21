import html2canvas from 'html2canvas';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { getVisualProfile } from '../engines/visualEffectsEngine';
import type { VisualMixLevels } from '../types/simulation';

interface VisualEffectsLayerProps {
  vision: number;
  synesthesia: number;
  visualMix: VisualMixLevels;
  tick: number;
  children: ReactNode;
}

interface WebGLRenderer {
  canvas: HTMLCanvasElement;
  context: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  texture: WebGLTexture;
  positionLocation: number;
  resolutionLocation: WebGLUniformLocation | null;
  angleLocation: WebGLUniformLocation | null;
  textureLocation: WebGLUniformLocation | null;
}

interface NoiseParticle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  blur: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  rotation: number;
  cursorOffsetX: number;
  cursorOffsetY: number;
  background: string;
  borderRadius: string;
}

interface PointerSensoryState {
  x: number;
  y: number;
  proximity: number;
}

const VERTEX_SHADER_SOURCE = `
  precision mediump float;

  attribute vec2 inPos;

  void main() {
    gl_Position = vec4(inPos.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_angle;
  uniform sampler2D u_texture;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 ndcPos = uv * 2.0 - 1.0;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 viewportScale = vec2(aspect, 1.0);
    float viewportDiameter = length(viewportScale);
    vec2 scaled = ndcPos * viewportScale;
    float relativeDistance = length(scaled) / max(viewportDiameter, 0.0001);

    vec2 projected = ndcPos;

    if (abs(u_angle) > 0.001 && relativeDistance > 0.0001) {
      float halfAngle = abs(u_angle) * 0.5;
      float halfDistance = tan(halfAngle);
      float factor = 1.0;

      if (u_angle > 0.0) {
        factor = tan(relativeDistance * halfAngle) / max(relativeDistance * halfDistance, 0.0001);
      } else {
        float beta = atan(relativeDistance * halfDistance);
        factor = beta / max(relativeDistance * halfAngle, 0.0001);
      }

      projected = ndcPos * factor;
    }

    vec2 projectedUv = projected * 0.5 + 0.5;

    if (projectedUv.x < 0.0 || projectedUv.x > 1.0 || projectedUv.y < 0.0 || projectedUv.y > 1.0) {
      discard;
    }

    gl_FragColor = texture2D(u_texture, projectedUv);
  }
`;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getTargetProximity(source: HTMLElement, clientX: number, clientY: number): number {
  const targets = Array.from(source.querySelectorAll<HTMLElement>('button, [role="button"]'));
  if (!targets.length) return 0;

  const nearestDistance = targets.reduce((nearest, target) => {
    const bounds = target.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return nearest;

    const nearestX = clamp(clientX, bounds.left, bounds.right);
    const nearestY = clamp(clientY, bounds.top, bounds.bottom);
    const distance = Math.hypot(clientX - nearestX, clientY - nearestY);
    return Math.min(nearest, distance);
  }, Number.POSITIVE_INFINITY);

  if (!Number.isFinite(nearestDistance)) return 0;

  const proximityRadius = 150;
  return clamp(1 - nearestDistance / proximityRadius, 0, 1);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createNoiseParticles(count = 78): NoiseParticle[] {
  return Array.from({ length: count }, (_, index) => {
    const particleType = Math.random();
    const isFiber = particleType > 0.86;
    const isSmudge = particleType > 0.66 && !isFiber;
    const isDark = Math.random() > 0.64;
    const width = isFiber ? randomBetween(18, 58) : isSmudge ? randomBetween(10, 36) : randomBetween(2, 10);
    const height = isFiber ? randomBetween(1.2, 4.5) : isSmudge ? randomBetween(6, 24) : randomBetween(2, 10);
    const lightBackground =
      'radial-gradient(circle, rgba(255, 255, 255, 0.95), rgba(204, 228, 236, 0.42) 58%, transparent 76%)';
    const darkBackground =
      'radial-gradient(circle, rgba(34, 45, 48, 0.46), rgba(75, 92, 94, 0.2) 54%, transparent 78%)';
    const fiberBackground = isDark
      ? 'linear-gradient(90deg, transparent, rgba(34, 45, 48, 0.42), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent)';

    return {
      id: index,
      x: randomBetween(-4, 104),
      y: randomBetween(-4, 104),
      width,
      height,
      opacity: isFiber ? randomBetween(0.2, 0.48) : isSmudge ? randomBetween(0.18, 0.52) : randomBetween(0.24, 0.72),
      blur: isFiber ? randomBetween(0.6, 2.4) : isSmudge ? randomBetween(2.2, 7.5) : randomBetween(0.2, 2.8),
      duration: randomBetween(5.5, 13),
      delay: randomBetween(-9, 0),
      driftX: randomBetween(-18, 18),
      driftY: randomBetween(-14, 20),
      rotation: randomBetween(-50, 50),
      cursorOffsetX: randomBetween(-11, 11),
      cursorOffsetY: randomBetween(-9, 9),
      background: isFiber ? fiberBackground : isDark ? darkBackground : lightBackground,
      borderRadius: isFiber ? '999px' : `${randomBetween(42, 999).toFixed(0)}px`,
    };
  });
}

function getVisualDistractionLevel(visualMix: VisualMixLevels): number {
  return Math.max(visualMix.blur, visualMix.ghosting, visualMix.noise, visualMix.flicker) / 100;
}

function getNoiseParticleStyle(
  particle: NoiseParticle,
  pointerSensory: PointerSensoryState,
  cursorAttraction: number,
): CSSProperties & {
  '--noise-drift-x': string;
  '--noise-drift-y': string;
  '--noise-rotate': string;
} {
  const attraction = clamp(cursorAttraction, 0, 1);
  const targetX = pointerSensory.x + particle.cursorOffsetX * (1 - attraction * 0.35);
  const targetY = pointerSensory.y + particle.cursorOffsetY * (1 - attraction * 0.35);
  const positionX = particle.x + (targetX - particle.x) * attraction;
  const positionY = particle.y + (targetY - particle.y) * attraction;
  const driftScale = 1 + attraction * 1.8;
  const opacityScale = 1 + attraction * 0.72;

  return {
    '--noise-drift-x': `${(particle.driftX * driftScale).toFixed(1)}px`,
    '--noise-drift-y': `${(particle.driftY * driftScale).toFixed(1)}px`,
    '--noise-rotate': `${particle.rotation.toFixed(1)}deg`,
    left: `${positionX.toFixed(2)}%`,
    top: `${positionY.toFixed(2)}%`,
    width: `${particle.width.toFixed(1)}px`,
    height: `${particle.height.toFixed(1)}px`,
    opacity: Math.min(0.95, particle.opacity * opacityScale),
    filter: `blur(${particle.blur.toFixed(1)}px)`,
    animationDuration: `${(particle.duration / (1 + attraction * 1.7)).toFixed(2)}s`,
    animationDelay: `${particle.delay.toFixed(2)}s`,
    background: particle.background,
    borderRadius: particle.borderRadius,
  };
}

function createShader(
  context: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = context.createShader(type);
  if (!shader) return null;

  context.shaderSource(shader, source);
  context.compileShader(shader);

  if (context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    return shader;
  }

  console.error(context.getShaderInfoLog(shader));
  context.deleteShader(shader);
  return null;
}

function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer | null {
  const context = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });

  if (!context) {
    return null;
  }

  const vertexShader = createShader(context, context.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = createShader(context, context.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = context.createProgram();
  if (!program) {
    return null;
  }

  context.attachShader(program, vertexShader);
  context.attachShader(program, fragmentShader);
  context.linkProgram(program);

  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    console.error(context.getProgramInfoLog(program));
    context.deleteProgram(program);
    return null;
  }

  const positionBuffer = context.createBuffer();
  const indexBuffer = context.createBuffer();
  const texture = context.createTexture();

  if (!positionBuffer || !indexBuffer || !texture) {
    return null;
  }

  context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
  context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), context.STATIC_DRAW);

  context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indexBuffer);
  context.bufferData(context.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), context.STATIC_DRAW);

  context.bindTexture(context.TEXTURE_2D, texture);
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);

  const positionLocation = context.getAttribLocation(program, 'inPos');
  const resolutionLocation = context.getUniformLocation(program, 'u_resolution');
  const angleLocation = context.getUniformLocation(program, 'u_angle');
  const textureLocation = context.getUniformLocation(program, 'u_texture');

  context.useProgram(program);
  context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
  context.enableVertexAttribArray(positionLocation);
  context.vertexAttribPointer(positionLocation, 2, context.FLOAT, false, 0, 0);
  context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indexBuffer);
  context.clearColor(0, 0, 0, 0);

  return {
    canvas,
    context,
    program,
    positionBuffer,
    indexBuffer,
    texture,
    positionLocation,
    resolutionLocation,
    angleLocation,
    textureLocation,
  };
}

function drawRenderer(renderer: WebGLRenderer, fisheyeAngle: number): void {
  const { context, canvas, program, resolutionLocation, angleLocation, textureLocation } = renderer;
  context.viewport(0, 0, canvas.width, canvas.height);
  context.clear(context.COLOR_BUFFER_BIT);
  context.useProgram(program);
  context.uniform2f(resolutionLocation, canvas.width, canvas.height);
  context.uniform1f(angleLocation, fisheyeAngle);
  context.uniform1i(textureLocation, 0);
  context.drawElements(context.TRIANGLES, 6, context.UNSIGNED_SHORT, 0);
}

function uploadTexture(renderer: WebGLRenderer, sourceCanvas: HTMLCanvasElement): void {
  const { context, texture } = renderer;
  context.activeTexture(context.TEXTURE0);
  context.bindTexture(context.TEXTURE_2D, texture);
  context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);
  context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, sourceCanvas);
}

function mapOutputPointToSource(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
  fisheyeAngle: number,
): { x: number; y: number } {
  const width = Math.max(bounds.width, 1);
  const height = Math.max(bounds.height, 1);
  const uvX = clamp((clientX - bounds.left) / width, 0, 1);
  const uvY = clamp((clientY - bounds.top) / height, 0, 1);
  const ndcX = uvX * 2 - 1;
  const ndcY = uvY * 2 - 1;

  const aspect = width / height;
  const viewportLength = Math.hypot(aspect, 1);
  const relativeDistance = Math.hypot(ndcX * aspect, ndcY) / Math.max(viewportLength, 0.0001);

  let factor = 1;
  if (Math.abs(fisheyeAngle) > 0.001 && relativeDistance > 0.0001) {
    const halfAngle = Math.abs(fisheyeAngle) * 0.5;
    const halfDistance = Math.tan(halfAngle);
    if (fisheyeAngle > 0) {
      factor = Math.tan(relativeDistance * halfAngle) / Math.max(relativeDistance * halfDistance, 0.0001);
    } else {
      const beta = Math.atan(relativeDistance * halfDistance);
      factor = beta / Math.max(relativeDistance * halfAngle, 0.0001);
    }
  }

  const projectedX = clamp((ndcX * factor + 1) * 0.5, 0, 1);
  const projectedY = clamp((ndcY * factor + 1) * 0.5, 0, 1);

  return {
    x: bounds.left + projectedX * width,
    y: bounds.top + projectedY * height,
  };
}

function sanitizeGhostClone(clone: HTMLElement): HTMLElement {
  clone.classList.remove('visual-source-hidden');
  clone.setAttribute('aria-hidden', 'true');

  clone.querySelectorAll<HTMLElement>('.visual-source-hidden').forEach((element) => {
    element.classList.remove('visual-source-hidden');
  });
  clone.querySelectorAll<HTMLElement>('[id]').forEach((element) => {
    element.removeAttribute('id');
  });
  clone
    .querySelectorAll<HTMLElement>('a, button, input, select, textarea, [tabindex], [role="button"]')
    .forEach((element) => {
      element.setAttribute('tabindex', '-1');
      element.setAttribute('aria-hidden', 'true');
    });

  return clone;
}

export function VisualEffectsLayer({ vision, synesthesia, visualMix, tick, children }: VisualEffectsLayerProps) {
  const [pointerSensory, setPointerSensory] = useState<PointerSensoryState>({ x: 50, y: 50, proximity: 0 });
  const profile = getVisualProfile(vision, synesthesia, tick, visualMix, pointerSensory.proximity);
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghostLayerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const captureTimerRef = useRef<number | null>(null);
  const ghostTimerRef = useRef<number | null>(null);
  const captureInFlightRef = useRef(false);
  const pendingCaptureRef = useRef(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [ghostOffset, setGhostOffset] = useState({ x: 0, y: 0 });
  const noiseParticles = useMemo(() => createNoiseParticles(), []);
  const cursorAttraction =
    Math.max(0, Math.min(1, synesthesia / 100)) *
    Math.max(0, Math.min(1, vision / 100)) *
    getVisualDistractionLevel(visualMix) *
    (0.25 + pointerSensory.proximity * 0.75);
  const fisheyeActive = Math.abs(profile.fisheyeAngle) > 0.001;
  const ghostActive = profile.ghostOpacity > 0.001;

  const resizeCanvas = useCallback((): void => {
    const source = sourceRef.current;
    const canvas = canvasRef.current;
    if (!source || !canvas) return;

    const rect = source.getBoundingClientRect();
    const devicePixelRatio = clamp(window.devicePixelRatio || 1, 1, 2);
    const width = Math.max(1, Math.round(rect.width * devicePixelRatio));
    const height = Math.max(1, Math.round(rect.height * devicePixelRatio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }, []);

  const captureFrame = useCallback(async (): Promise<void> => {
    if (!fisheyeActive || !sourceRef.current || !rendererRef.current) return;

    if (captureInFlightRef.current) {
      pendingCaptureRef.current = true;
      return;
    }

    captureInFlightRef.current = true;

    try {
      resizeCanvas();
      const devicePixelRatio = clamp(window.devicePixelRatio || 1, 1, 2);
      const snapshot = await html2canvas(sourceRef.current, {
        backgroundColor: null,
        logging: false,
        scale: devicePixelRatio,
        useCORS: true,
        onclone: (documentClone) => {
          const clone = documentClone.querySelector('[data-visual-source="true"]');
          if (clone instanceof HTMLElement) {
            clone.classList.remove('visual-source-hidden');
            clone.style.opacity = '1';
          }
        },
      });

      if (!rendererRef.current) return;

      uploadTexture(rendererRef.current, snapshot);
      drawRenderer(rendererRef.current, profile.fisheyeAngle);
      setRendererReady(true);
    } catch (error) {
      console.error('Failed to render fisheye surface.', error);
      setRendererReady(false);
    } finally {
      captureInFlightRef.current = false;
      if (pendingCaptureRef.current) {
        pendingCaptureRef.current = false;
        window.setTimeout(() => {
          void captureFrame();
        }, 45);
      }
    }
  }, [fisheyeActive, profile.fisheyeAngle, resizeCanvas]);

  const scheduleCapture = useCallback(
    (delay = 70): void => {
      if (!fisheyeActive) return;

      if (captureTimerRef.current !== null) {
        window.clearTimeout(captureTimerRef.current);
      }

      captureTimerRef.current = window.setTimeout(() => {
        captureTimerRef.current = null;
        void captureFrame();
      }, delay);
    },
    [captureFrame, fisheyeActive],
  );

  const refreshGhostLayer = useCallback((): void => {
    const source = sourceRef.current;
    const ghostLayer = ghostLayerRef.current;
    if (!ghostLayer) return;

    if (!ghostActive || !source) {
      ghostLayer.replaceChildren();
      return;
    }

    const clone = source.cloneNode(true);
    if (clone instanceof HTMLElement) {
      ghostLayer.replaceChildren(sanitizeGhostClone(clone));
    }
  }, [ghostActive]);

  const scheduleGhostRefresh = useCallback(
    (delay = 45): void => {
      if (!ghostActive) return;

      if (ghostTimerRef.current !== null) {
        window.clearTimeout(ghostTimerRef.current);
      }

      ghostTimerRef.current = window.setTimeout(() => {
        ghostTimerRef.current = null;
        refreshGhostLayer();
      }, delay);
    },
    [ghostActive, refreshGhostLayer],
  );

  useEffect(() => {
    if (!fisheyeActive || !canvasRef.current) {
      setRendererReady(false);
      rendererRef.current = null;
      return;
    }

    const renderer = createRenderer(canvasRef.current);
    rendererRef.current = renderer;
    setRendererReady(false);

    if (!renderer) {
      return;
    }

    resizeCanvas();
    scheduleCapture(0);

    return () => {
      rendererRef.current = null;
    };
  }, [fisheyeActive, resizeCanvas, scheduleCapture]);

  useEffect(() => {
    if (!fisheyeActive || !sourceRef.current) return;

    const source = sourceRef.current;
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      scheduleCapture(0);
    });
    resizeObserver.observe(source);

    const mutationObserver = new MutationObserver(() => {
      scheduleCapture(80);
    });
    mutationObserver.observe(source, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    const handleWindowResize = (): void => {
      resizeCanvas();
      scheduleCapture(0);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [fisheyeActive, resizeCanvas, scheduleCapture]);

  useEffect(() => {
    if (!fisheyeActive) return;
    scheduleCapture(0);
  }, [fisheyeActive, profile.fisheyeAngle, scheduleCapture]);

  useEffect(() => {
    if (!ghostActive || !sourceRef.current) {
      refreshGhostLayer();
      return;
    }

    const source = sourceRef.current;
    scheduleGhostRefresh(0);

    const mutationObserver = new MutationObserver(() => {
      scheduleGhostRefresh(45);
    });
    mutationObserver.observe(source, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [ghostActive, refreshGhostLayer, scheduleGhostRefresh]);

  useEffect(() => {
    return () => {
      if (captureTimerRef.current !== null) {
        window.clearTimeout(captureTimerRef.current);
      }
      if (ghostTimerRef.current !== null) {
        window.clearTimeout(ghostTimerRef.current);
      }
    };
  }, []);

  const handleWarpClick = useCallback(
    (event: MouseEvent<HTMLCanvasElement>): void => {
      if (!sourceRef.current) return;

      const canvas = event.currentTarget;
      const mappedPoint = mapOutputPointToSource(
        event.clientX,
        event.clientY,
        canvas.getBoundingClientRect(),
        profile.fisheyeAngle,
      );

      canvas.style.pointerEvents = 'none';
      const underlyingTarget = document.elementFromPoint(mappedPoint.x, mappedPoint.y);
      canvas.style.pointerEvents = 'auto';

      const resolvedTarget =
        underlyingTarget instanceof Element
          ? underlyingTarget.closest('button, [role="button"]') ?? underlyingTarget
          : null;

      if (!(resolvedTarget instanceof HTMLElement) || !sourceRef.current.contains(resolvedTarget)) {
        return;
      }

      if (typeof resolvedTarget.click === 'function') {
        resolvedTarget.click();
      } else {
        resolvedTarget.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: mappedPoint.x,
            clientY: mappedPoint.y,
            view: window,
          }),
        );
      }

      scheduleCapture(50);
    },
    [profile.fisheyeAngle, scheduleCapture],
  );

  const getGhostBaseOffset = useCallback((): { x: number; y: number } => {
    const strength = clamp(profile.ghostOpacity / 0.42, 0, 1);
    return {
      x: 5 + strength * 12,
      y: 3 + strength * 8,
    };
  }, [profile.ghostOpacity]);

  const handleGhostPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>): void => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const pointerX = clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1);
      const pointerY = clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1);
      const proximity = sourceRef.current ? getTargetProximity(sourceRef.current, event.clientX, event.clientY) : 0;
      setPointerSensory({
        x: pointerX * 100,
        y: pointerY * 100,
        proximity,
      });

      if (!ghostActive) return;

      const strength = clamp(profile.ghostOpacity / 0.42, 0, 1);
      const crossSensoryFollow = cursorAttraction;
      const relativeX = pointerX * 2 - 1;
      const relativeY = pointerY * 2 - 1;
      const base = getGhostBaseOffset();

      setGhostOffset({
        x: base.x + relativeX * (strength * 8 + crossSensoryFollow * 30),
        y: base.y + relativeY * (strength * 7 + crossSensoryFollow * 26),
      });
    },
    [cursorAttraction, getGhostBaseOffset, ghostActive, profile.ghostOpacity],
  );

  const handleGhostPointerLeave = useCallback((): void => {
    setPointerSensory((current) => ({ ...current, proximity: 0 }));
    setGhostOffset(getGhostBaseOffset());
  }, [getGhostBaseOffset]);

  useEffect(() => {
    setGhostOffset(ghostActive ? getGhostBaseOffset() : { x: 0, y: 0 });
  }, [getGhostBaseOffset, ghostActive]);

  return (
    <div
      className="visual-shell"
      style={profile.shellStyle}
      onPointerMove={handleGhostPointerMove}
      onPointerLeave={handleGhostPointerLeave}
    >
      <div className="visual-stage" style={profile.stageStyle}>
        <div
          ref={sourceRef}
          className={`visual-source ${fisheyeActive && rendererReady ? 'visual-source-hidden' : ''}`}
          data-visual-source="true"
        >
          <div className="visual-content" style={profile.contentStyle}>
            {children}
          </div>
        </div>
        {fisheyeActive ? (
          <canvas
            ref={canvasRef}
            className={`visual-webgl-surface ${rendererReady ? '' : 'visual-webgl-surface-hidden'}`}
            aria-hidden="true"
            onClick={handleWarpClick}
          />
        ) : null}
        <div
          ref={ghostLayerRef}
          className="visual-ghost-content"
          style={{
            ...profile.ghostStyle,
            transform: `translate(${ghostOffset.x.toFixed(1)}px, ${ghostOffset.y.toFixed(1)}px)`,
          }}
          aria-hidden="true"
        />
        {profile.noiseOpacity > 0.001 ? (
          <div
            className="visual-noise"
            style={{
              opacity: profile.noiseOpacity,
              '--noise-touch-x': `${pointerSensory.x.toFixed(1)}%`,
              '--noise-touch-y': `${pointerSensory.y.toFixed(1)}%`,
              '--noise-touch-opacity': `${(
                pointerSensory.proximity *
                Math.max(0, Math.min(1, synesthesia / 100)) *
                0.58
              ).toFixed(3)}`,
            } as CSSProperties}
          >
            {noiseParticles.map((particle) => (
              <span
                key={particle.id}
                className="visual-noise-particle"
                style={getNoiseParticleStyle(particle, pointerSensory, cursorAttraction)}
              />
            ))}
          </div>
        ) : null}
        {profile.shimmerOpacity > 0.001 ? (
          <div className="visual-shimmer" style={{ opacity: profile.shimmerOpacity }} />
        ) : null}
        {profile.fluorescentOpacity > 0.001 ? (
          <div className="visual-fluorescent" style={{ opacity: profile.fluorescentOpacity }} />
        ) : null}
      </div>
    </div>
  );
}
