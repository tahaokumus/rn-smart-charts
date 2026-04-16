/**
 * Worklet-safe binary search returning the index whose value is closest to `target`.
 * Assumes `xs` is sorted ascending. Searches `[lo, hi]` inclusive.
 */
export function bisectClosest(
  xs: ArrayLike<number>,
  target: number,
  lo = 0,
  hi = xs.length - 1,
): number {
  'worklet';
  if (hi < lo) return lo;
  if (target <= (xs[lo] as number)) return lo;
  if (target >= (xs[hi] as number)) return hi;
  let l = lo;
  let h = hi;
  while (h - l > 1) {
    const mid = (l + h) >>> 1;
    const v = xs[mid] as number;
    if (v <= target) l = mid;
    else h = mid;
  }
  const lv = xs[l] as number;
  const hv = xs[h] as number;
  return target - lv <= hv - target ? l : h;
}

/** Smallest index whose value is >= target. */
export function bisectLeft(xs: ArrayLike<number>, target: number, lo = 0, hi = xs.length): number {
  'worklet';
  let l = lo;
  let h = hi;
  while (l < h) {
    const mid = (l + h) >>> 1;
    if ((xs[mid] as number) < target) l = mid + 1;
    else h = mid;
  }
  return l;
}

/** Smallest index whose value is > target (i.e. one past the last <= target). */
export function bisectRight(xs: ArrayLike<number>, target: number, lo = 0, hi = xs.length): number {
  'worklet';
  let l = lo;
  let h = hi;
  while (l < h) {
    const mid = (l + h) >>> 1;
    if ((xs[mid] as number) <= target) l = mid + 1;
    else h = mid;
  }
  return l;
}
