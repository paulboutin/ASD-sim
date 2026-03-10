export interface Offset {
  x: number;
  y: number;
}

export function getTargetDrift(level: number, tick: number, seed: number): Offset {
  const amplitude = level * 0.12;
  const x = Math.sin((tick + seed * 91) * 0.0025) * amplitude;
  const y = Math.cos((tick + seed * 57) * 0.0019) * amplitude;
  return { x, y };
}

export function getActivationDelay(apraxiaLevel: number): number {
  return Math.round(apraxiaLevel * 6);
}

export function shouldRequireIntentConfirm(apraxiaLevel: number): boolean {
  return apraxiaLevel >= 65;
}

export function shouldDropIntent(apraxiaLevel: number): boolean {
  if (apraxiaLevel <= 0) return false;
  return Math.random() < apraxiaLevel / 260;
}

export function getViewportRock(stimLevel: number, tick: number): Offset {
  const amplitude = stimLevel * 0.08;
  const x = Math.sin(tick * 0.0028) * amplitude;
  const y = Math.cos(tick * 0.0036) * amplitude * 0.5;
  return { x, y };
}

export function getInterruptionOpacity(stimLevel: number, tick: number): number {
  if (stimLevel < 15) return 0;
  const wave = Math.abs(Math.sin(tick * 0.0032));
  const base = stimLevel / 260;
  return Math.min(0.45, base * wave);
}
