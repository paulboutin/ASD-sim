import html2canvas from 'html2canvas';
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
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

    if (u_angle > 0.001 && relativeDistance > 0.0001) {
      float halfAngle = u_angle * 0.5;
      float halfDistance = tan(halfAngle);
      float factor = tan(relativeDistance * halfAngle) / max(relativeDistance * halfDistance, 0.0001);
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
  if (fisheyeAngle > 0.001 && relativeDistance > 0.0001) {
    const halfAngle = fisheyeAngle * 0.5;
    const halfDistance = Math.tan(halfAngle);
    factor = Math.tan(relativeDistance * halfAngle) / Math.max(relativeDistance * halfDistance, 0.0001);
  }

  const projectedX = clamp((ndcX * factor + 1) * 0.5, 0, 1);
  const projectedY = clamp((ndcY * factor + 1) * 0.5, 0, 1);

  return {
    x: bounds.left + projectedX * width,
    y: bounds.top + projectedY * height,
  };
}

export function VisualEffectsLayer({ vision, synesthesia, visualMix, tick, children }: VisualEffectsLayerProps) {
  const profile = getVisualProfile(vision, synesthesia, tick, visualMix);
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const captureTimerRef = useRef<number | null>(null);
  const captureInFlightRef = useRef(false);
  const pendingCaptureRef = useRef(false);
  const [rendererReady, setRendererReady] = useState(false);
  const fisheyeActive = profile.fisheyeAngle > 0.001;

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
    return () => {
      if (captureTimerRef.current !== null) {
        window.clearTimeout(captureTimerRef.current);
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

  return (
    <div className="visual-shell" style={profile.shellStyle}>
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
        <div className="visual-noise" style={{ opacity: profile.noiseOpacity }} />
        <div className="visual-ghost" style={{ opacity: profile.ghostOpacity }} />
        <div className="visual-shimmer" style={{ opacity: profile.shimmerOpacity }} />
        <div className="visual-fluorescent" style={{ opacity: profile.fluorescentOpacity }} />
      </div>
    </div>
  );
}
