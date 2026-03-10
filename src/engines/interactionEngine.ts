export interface Offset {
  x: number;
  y: number;
}

function surge(level: number, tick: number, seed: number): number {
  const threshold = 0.96 - level / 420;
  const wave = Math.abs(Math.sin((tick + seed * 17) * 0.009));
  return wave > threshold ? 1.9 : 1;
}

export function getTargetDrift(level: number, tick: number, seed: number): Offset {
  const waveSurge = surge(level, tick, seed);
  const amplitude = level * 0.2 * waveSurge;
  const tremor = level * 0.06;
  const x =
    Math.sin((tick + seed * 91) * 0.0025) * amplitude +
    Math.sin((tick + seed * 13) * 0.029) * tremor;
  const y =
    Math.cos((tick + seed * 57) * 0.0019) * amplitude +
    Math.cos((tick + seed * 23) * 0.025) * tremor;
  return { x, y };
}

export function getActivationDelay(apraxiaLevel: number): number {
  return Math.round(80 + apraxiaLevel * 8.5);
}

export function shouldRequireIntentConfirm(apraxiaLevel: number): boolean {
  return apraxiaLevel >= 65;
}

export function shouldDropIntent(apraxiaLevel: number): boolean {
  if (apraxiaLevel <= 0) return false;
  return Math.random() < apraxiaLevel / 180;
}

export function getViewportRock(stimLevel: number, tick: number): Offset {
  const amplitude = stimLevel * 0.16;
  const x = Math.sin(tick * 0.0028) * amplitude + Math.sin(tick * 0.019) * (stimLevel * 0.03);
  const y = Math.cos(tick * 0.0036) * amplitude * 0.6;
  return { x, y };
}

export function getInterruptionOpacity(stimLevel: number, tick: number): number {
  if (stimLevel < 10) return 0;
  const wave = Math.abs(Math.sin(tick * 0.0032)) + Math.abs(Math.sin(tick * 0.012));
  const base = stimLevel / 210;
  return Math.min(0.62, base * wave * 0.75);
}
