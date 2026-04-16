import type { PathLike } from '../types/internal';

/**
 * Builds a path through (xs[i], ys[i]) using D3's monotone-X cubic interpolation
 * (Fritsch-Carlson). Produces a smooth curve with no overshoot — ideal for
 * monotone-ish time series.
 *
 * Coordinates are written into `path` as-is; the caller is responsible for
 * pre-projecting data → pixels before calling.
 *
 * If `closeBottom` is provided, the path is extended down to that y, back to the
 * starting x, and closed — yielding a fillable area shape.
 *
 * Worklet-safe (`PathLike` is mutated; no closures over JS-only state).
 */
export function buildMonotonePath(
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  count: number,
  path: PathLike,
  closeBottom?: { y: number },
): void {
  'worklet';
  if (count <= 0) return;
  if (count === 1) {
    const x0 = xs[0] as number;
    const y0 = ys[0] as number;
    path.moveTo(x0, y0);
    if (closeBottom) {
      path.lineTo(x0, closeBottom.y);
      path.close();
    }
    return;
  }

  // Fritsch-Carlson tangent calculation.
  // We compute slopes m[i] for each point such that the cubic Hermite spline
  // is monotone where the source data is monotone.
  const m = new Array<number>(count);
  // Secant slopes between consecutive points.
  const d = new Array<number>(count - 1);

  for (let i = 0; i < count - 1; i++) {
    const dx = (xs[i + 1] as number) - (xs[i] as number);
    d[i] = dx === 0 ? 0 : ((ys[i + 1] as number) - (ys[i] as number)) / dx;
  }

  m[0] = d[0] as number;
  m[count - 1] = d[count - 2] as number;
  for (let i = 1; i < count - 1; i++) {
    const dPrev = d[i - 1] as number;
    const dCurr = d[i] as number;
    if (dPrev * dCurr <= 0) {
      m[i] = 0;
    } else {
      m[i] = (dPrev + dCurr) / 2;
    }
  }

  // Enforce monotonicity (Fritsch-Carlson clamping).
  for (let i = 0; i < count - 1; i++) {
    const dCurr = d[i] as number;
    if (dCurr === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = (m[i] as number) / dCurr;
      const b = (m[i + 1] as number) / dCurr;
      const h = a * a + b * b;
      if (h > 9) {
        const t = 3 / Math.sqrt(h);
        m[i] = t * a * dCurr;
        m[i + 1] = t * b * dCurr;
      }
    }
  }

  // Emit the path: moveTo first point, then cubicTo through each segment.
  path.moveTo(xs[0] as number, ys[0] as number);
  for (let i = 0; i < count - 1; i++) {
    const x0 = xs[i] as number;
    const y0 = ys[i] as number;
    const x1 = xs[i + 1] as number;
    const y1 = ys[i + 1] as number;
    const h = x1 - x0;
    // Convert Hermite tangents to Bezier control points: P1 = P0 + (m0*h)/3, P2 = P3 - (m1*h)/3
    const c1x = x0 + h / 3;
    const c1y = y0 + ((m[i] as number) * h) / 3;
    const c2x = x1 - h / 3;
    const c2y = y1 - ((m[i + 1] as number) * h) / 3;
    path.cubicTo(c1x, c1y, c2x, c2y, x1, y1);
  }

  if (closeBottom) {
    const lastX = xs[count - 1] as number;
    const firstX = xs[0] as number;
    path.lineTo(lastX, closeBottom.y);
    path.lineTo(firstX, closeBottom.y);
    path.close();
  }
}

/**
 * Linear (non-smooth) variant. Same signature as buildMonotonePath.
 * Worklet-safe.
 */
export function buildLinearPath(
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  count: number,
  path: PathLike,
  closeBottom?: { y: number },
): void {
  'worklet';
  if (count <= 0) return;
  path.moveTo(xs[0] as number, ys[0] as number);
  for (let i = 1; i < count; i++) {
    path.lineTo(xs[i] as number, ys[i] as number);
  }
  if (closeBottom) {
    const lastX = xs[count - 1] as number;
    const firstX = xs[0] as number;
    path.lineTo(lastX, closeBottom.y);
    path.lineTo(firstX, closeBottom.y);
    path.close();
  }
}
