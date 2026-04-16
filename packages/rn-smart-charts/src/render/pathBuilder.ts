import { type SkPath, Skia } from '@shopify/react-native-skia';
import { buildLinearPath, buildMonotonePath } from '../math/monotoneCubic';
import { scale } from '../math/scaleLinear';
import { indexRangeFor } from '../math/viewport';
import type { PathLike, PlotMetrics } from '../types/internal';

/** SkPath adapter that satisfies our PathLike interface. */
function pathAdapter(p: SkPath): PathLike {
  'worklet';
  return {
    moveTo(x, y) {
      p.moveTo(x, y);
    },
    lineTo(x, y) {
      p.lineTo(x, y);
    },
    cubicTo(c1x, c1y, c2x, c2y, x, y) {
      p.cubicTo(c1x, c1y, c2x, c2y, x, y);
    },
    close() {
      p.close();
    },
  };
}

export interface BuildAreaPathArgs {
  xs: ArrayLike<number>;
  ys: ArrayLike<number>;
  xStart: number;
  xEnd: number;
  yMin: number;
  yMax: number;
  plot: PlotMetrics;
  smooth: boolean;
  closed: boolean;
}

/**
 * Build a single SkPath for the visible window, projecting (x,y) → pixels
 * inline so we don't allocate intermediate arrays.
 *
 * Worklet-safe — only Skia.Path.Make() and primitive math.
 */
export function buildAreaPath(args: BuildAreaPathArgs): SkPath {
  'worklet';
  const { xs, ys, xStart, xEnd, yMin, yMax, plot, smooth, closed } = args;
  const { i0, i1 } = indexRangeFor(xs, xStart, xEnd);
  const path = Skia.Path.Make();

  if (i1 < i0) return path;

  const count = i1 - i0 + 1;

  const xScale = { d0: xStart, d1: xEnd, r0: plot.left, r1: plot.left + plot.width };
  const yScale = { d0: yMin, d1: yMax, r0: plot.top + plot.height, r1: plot.top };

  // Project into a small typed-array slice for the curve builder.
  // We can't pass array views into the curve builder if we're going to mutate,
  // so allocate two short arrays per frame. Acceptable for visible point counts.
  const px = new Float64Array(count);
  const py = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    px[i] = scale(xScale, xs[i0 + i] as number);
    py[i] = scale(yScale, ys[i0 + i] as number);
  }

  const adapter = pathAdapter(path);
  const closeBottom = closed ? { y: plot.top + plot.height } : undefined;
  if (smooth) {
    buildMonotonePath(px, py, count, adapter, closeBottom);
  } else {
    buildLinearPath(px, py, count, adapter, closeBottom);
  }

  return path;
}
