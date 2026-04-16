import type { DataPoint, XAxis } from '../types/option';

export interface NormalizedData {
  xs: Float64Array;
  ys: Float64Array;
}

/** Coerces a Date|number x-value to numeric ms (or numeric value). */
function toX(v: number | Date | string, type: XAxis['type'], categoryIndex: number): number {
  'worklet';
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  if (type === 'category') return categoryIndex;
  // string in non-category axis: try to parse as date
  const t = Date.parse(v);
  if (!Number.isNaN(t)) return t;
  return categoryIndex;
}

/**
 * Normalize a series' data + the axis config into parallel Float64Arrays
 * sorted by x ascending. Accepts both shapes:
 *   - data: DataPoint[]              → xs from each point
 *   - data: number[] + xAxis.data    → xs from xAxis.data, ys from data
 */
export function normalizeData(data: DataPoint[] | number[], xAxis: XAxis): NormalizedData {
  const isParallel = data.length > 0 && typeof (data as unknown[])[0] === 'number';

  let n = 0;
  let getX: (i: number) => number;
  let getY: (i: number) => number;

  if (isParallel) {
    const ys = data as number[];
    const xData = xAxis.data;
    if (!xData) {
      throw new Error(
        '[rn-smart-charts] series.data is a number[] (parallel form), but xAxis.data is missing.',
      );
    }
    if (xData.length !== ys.length) {
      throw new Error(
        `[rn-smart-charts] xAxis.data length (${xData.length}) does not match series.data length (${ys.length}).`,
      );
    }
    n = ys.length;
    getX = (i) => toX(xData[i] as number | Date | string, xAxis.type, i);
    getY = (i) => ys[i] as number;
  } else {
    const points = data as DataPoint[];
    n = points.length;
    getX = (i) => {
      const p = points[i] as DataPoint;
      const xv = p.x;
      return typeof xv === 'number' ? xv : xv.getTime();
    };
    getY = (i) => (points[i] as DataPoint).y;
  }

  if (n === 0) {
    return { xs: new Float64Array(0), ys: new Float64Array(0) };
  }

  // Build paired array, sort by x, then split. Float64Array gives us tight
  // memory and worklet-friendly indexed access.
  const pairs = new Array<[number, number]>(n);
  for (let i = 0; i < n; i++) pairs[i] = [getX(i), getY(i)];
  pairs.sort((a, b) => a[0] - b[0]);

  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const p = pairs[i] as [number, number];
    xs[i] = p[0];
    ys[i] = p[1];
  }

  return { xs, ys };
}
