/**
 * Right-anchored pinch transform: the right edge (xEnd) stays pinned at its
 * starting value; only the span (and therefore xStart) changes. This matches
 * the live-trading chart UX where the latest data point is always on the right.
 *
 * `scale > 1` = zoom in (span shrinks). `scale < 1` = zoom out.
 *
 * Worklet-safe.
 */
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
  let newSpan = startSpan / scale;
  if (newSpan < minSpan) newSpan = minSpan;
  if (newSpan > maxSpan) newSpan = maxSpan;
  let newStart = pinchStartXEnd - newSpan;
  if (newStart < dataMinX) newStart = dataMinX;
  return { xStart: newStart, xEnd: pinchStartXEnd };
}
