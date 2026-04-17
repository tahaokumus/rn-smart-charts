/**
 * Right-anchored pinch transform with a left-edge fallback.
 *
 * Primary behavior: the right edge (xEnd) stays pinned at its starting value;
 * only the span (and therefore xStart) changes. This matches the live-trading
 * chart UX where the latest data point is always on the right.
 *
 * Fallback: when zooming out would push xStart below `dataMinX` (the user is
 * already scrolled to the very first data point), we clamp xStart to
 * `dataMinX` and extend the right edge outward instead — capped at `dataMaxX`.
 * This lets users keep zooming out past the edge.
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
  dataMaxX: number,
): { xStart: number; xEnd: number } {
  'worklet';
  const startSpan = pinchStartXEnd - pinchStartXStart;
  if (scale <= 0 || !Number.isFinite(scale)) {
    return { xStart: pinchStartXStart, xEnd: pinchStartXEnd };
  }
  // Dampened scale — sub-linear response in both directions (`< 1` and `> 1`).
  const effectiveScale = scale ** PINCH_SENSITIVITY;
  let newSpan = startSpan / effectiveScale;
  const dataSpan = dataMaxX - dataMinX;
  const hardMaxSpan = Math.min(maxSpan, Math.max(minSpan, dataSpan));
  if (newSpan < minSpan) newSpan = minSpan;
  if (newSpan > hardMaxSpan) newSpan = hardMaxSpan;

  // Primary: right-anchored — xEnd stays pinned.
  let newStart = pinchStartXEnd - newSpan;
  let newEnd = pinchStartXEnd;

  if (newStart < dataMinX) {
    // Fallback: left edge hit the data min. Pin left and extend right.
    newStart = dataMinX;
    newEnd = newStart + newSpan;
    if (newEnd > dataMaxX) {
      newEnd = dataMaxX;
      // Shrink span if data range itself is smaller than requested span.
      newStart = Math.max(dataMinX, newEnd - newSpan);
    }
  }

  return { xStart: newStart, xEnd: newEnd };
}
