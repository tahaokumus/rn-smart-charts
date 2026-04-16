import { bisectLeft, bisectRight } from './bisect';

/**
 * Worklet-safe. Returns the inclusive [i0, i1] of indices in `xs` whose values
 * fall within [xStart, xEnd], plus one neighbor on each side if available so
 * the rendered path extends to the clip edges.
 */
export function indexRangeFor(
  xs: ArrayLike<number>,
  xStart: number,
  xEnd: number,
): { i0: number; i1: number } {
  'worklet';
  const n = xs.length;
  if (n === 0) return { i0: 0, i1: -1 };
  // first index where xs[i] >= xStart, then back off by one for the path tail
  const left = Math.max(0, bisectLeft(xs, xStart) - 1);
  // first index where xs[i] > xEnd, then we want i-1 plus one neighbor
  const right = Math.min(n - 1, bisectRight(xs, xEnd));
  return { i0: left, i1: right };
}

/**
 * Worklet-safe. Returns y min/max over xs[i0..i1] inclusive.
 * If `includeZero` is true, the range is extended to include 0.
 * Adds a small symmetric padding (3% of span) for visual breathing room.
 */
export function yDomainFor(
  ys: ArrayLike<number>,
  i0: number,
  i1: number,
  includeZero: boolean,
): { yMin: number; yMax: number } {
  'worklet';
  if (i1 < i0) return { yMin: 0, yMax: 1 };
  let mn = Number.POSITIVE_INFINITY;
  let mx = Number.NEGATIVE_INFINITY;
  for (let i = i0; i <= i1; i++) {
    const v = ys[i] as number;
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  if (includeZero) {
    if (mn > 0) mn = 0;
    if (mx < 0) mx = 0;
  }
  if (!Number.isFinite(mn) || !Number.isFinite(mx)) return { yMin: 0, yMax: 1 };
  if (mn === mx) {
    // give a flat series some headroom
    const pad = mn === 0 ? 1 : Math.abs(mn) * 0.1;
    return { yMin: mn - pad, yMax: mx + pad };
  }
  const span = mx - mn;
  const pad = span * 0.03;
  return { yMin: mn - pad, yMax: mx + pad };
}
