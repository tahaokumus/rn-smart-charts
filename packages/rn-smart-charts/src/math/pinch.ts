/**
 * Right-anchored pinch transform: the right edge (xEnd) stays pinned at its
 * starting value; only the span (and therefore xStart) changes. This matches
 * the live-trading chart UX where the latest data point is always on the right.
 *
 * The raw pinch `scale` is dampened via a sub-linear curve so a modest finger
 * spread doesn't dramatically over-zoom. With `PINCH_SENSITIVITY = 0.75`:
 *   scale=2  → effective 1.68 → span × 0.60 (vs linear 0.50)
 *   scale=3  → effective 2.28 → span × 0.44 (vs linear 0.33)
 *
 * Worklet-safe.
 */
const PINCH_SENSITIVITY = 0.75;

export function rightAnchoredPinch(
  pinchStartXStart: number,
  pinchStartXEnd: number,
  scale: number,
  minSpan: number,
  maxSpan: number,
  dataMinX: number,
): { xStart: number; xEnd: number } {
  'worklet';
  const startSpan = pinchStartXEnd - pinchStartXStart;
  if (scale <= 0 || !Number.isFinite(scale)) {
    return { xStart: pinchStartXStart, xEnd: pinchStartXEnd };
  }
  // Dampened scale — sub-linear response in both directions (`< 1` and `> 1`).
  const effectiveScale = scale ** PINCH_SENSITIVITY;
  let newSpan = startSpan / effectiveScale;
  if (newSpan < minSpan) newSpan = minSpan;
  if (newSpan > maxSpan) newSpan = maxSpan;
  let newStart = pinchStartXEnd - newSpan;
  if (newStart < dataMinX) newStart = dataMinX;
  return { xStart: newStart, xEnd: pinchStartXEnd };
}
