export interface LinearScale {
  d0: number;
  d1: number;
  r0: number;
  r1: number;
}

/** Worklet-safe. Maps a value from domain → range. */
export function scale(s: LinearScale, v: number): number {
  'worklet';
  const span = s.d1 - s.d0;
  if (span === 0) return s.r0;
  return s.r0 + ((v - s.d0) * (s.r1 - s.r0)) / span;
}

/** Worklet-safe. Maps a pixel back to domain space. */
export function invert(s: LinearScale, p: number): number {
  'worklet';
  const span = s.r1 - s.r0;
  if (span === 0) return s.d0;
  return s.d0 + ((p - s.r0) * (s.d1 - s.d0)) / span;
}

/**
 * Generate "nice" tick values for [d0, d1] aiming for ~targetCount ticks.
 * Uses the standard 1/2/5 × 10^k progression (D3-style).
 * Not worklet — call from JS once per window change.
 */
export function ticks(d0: number, d1: number, targetCount: number): number[] {
  if (d0 === d1) return [d0];
  const lo = Math.min(d0, d1);
  const hi = Math.max(d0, d1);
  const step = niceStep(hi - lo, targetCount);
  if (step <= 0 || !Number.isFinite(step)) return [];
  const start = Math.ceil(lo / step) * step;
  const out: number[] = [];
  // Guard against floating-point drift by capping at targetCount * 4.
  const cap = Math.max(8, targetCount * 4);
  for (let v = start, i = 0; v <= hi + step * 1e-9 && i < cap; v += step, i++) {
    // Round to step precision to avoid 0.30000000000000004
    out.push(roundToStep(v, step));
  }
  return out;
}

function niceStep(span: number, target: number): number {
  if (span <= 0) return 0;
  const rough = span / Math.max(1, target);
  const pow10 = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / pow10;
  let mult: number;
  if (norm < 1.5) mult = 1;
  else if (norm < 3) mult = 2;
  else if (norm < 7) mult = 5;
  else mult = 10;
  return mult * pow10;
}

function roundToStep(v: number, step: number): number {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}
