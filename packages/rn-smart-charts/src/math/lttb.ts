/**
 * Largest-Triangle-Three-Buckets downsampler (Steinarsson, 2013).
 *
 * Given parallel xs/ys arrays of `count` points (xs sorted ascending),
 * returns two new Float64Arrays of length `threshold` chosen to preserve
 * the visual shape of the source. First and last points are always kept.
 *
 * Pure JS (not a worklet). Intended to run in `useMemo` on the JS thread
 * when the data prop changes.
 */
export function lttb(
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  count: number,
  threshold: number,
): { xs: Float64Array; ys: Float64Array } {
  if (threshold >= count || threshold <= 2) {
    const ox = new Float64Array(count);
    const oy = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      ox[i] = xs[i] as number;
      oy[i] = ys[i] as number;
    }
    return { xs: ox, ys: oy };
  }

  const sampledX = new Float64Array(threshold);
  const sampledY = new Float64Array(threshold);

  let sampledIndex = 0;
  // Bucket size (excluding the first and last points which are kept verbatim).
  const every = (count - 2) / (threshold - 2);

  // Always include the first point.
  sampledX[sampledIndex] = xs[0] as number;
  sampledY[sampledIndex] = ys[0] as number;
  sampledIndex++;

  let a = 0; // index of the previously selected point

  for (let i = 0; i < threshold - 2; i++) {
    // Compute the average point of the next bucket (used as the right vertex
    // of the triangle when picking from the current bucket).
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    const avgRangeEndRaw = Math.floor((i + 2) * every) + 1;
    const avgRangeEnd = avgRangeEndRaw < count ? avgRangeEndRaw : count;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    let avgX = 0;
    let avgY = 0;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += xs[j] as number;
      avgY += ys[j] as number;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Iterate the current bucket and pick the point that forms the largest
    // triangle with `a` and the next-bucket average.
    const rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.floor((i + 1) * every) + 1;

    const pointAX = xs[a] as number;
    const pointAY = ys[a] as number;

    let maxArea = -1;
    let nextA = rangeOffs;

    for (let j = rangeOffs; j < rangeTo; j++) {
      const px = xs[j] as number;
      const py = ys[j] as number;
      // Twice the triangle area (sign-independent, magnitude is what matters).
      const area = Math.abs((pointAX - avgX) * (py - pointAY) - (pointAX - px) * (avgY - pointAY));
      if (area > maxArea) {
        maxArea = area;
        nextA = j;
      }
    }

    sampledX[sampledIndex] = xs[nextA] as number;
    sampledY[sampledIndex] = ys[nextA] as number;
    sampledIndex++;
    a = nextA;
  }

  // Always include the last point.
  sampledX[sampledIndex] = xs[count - 1] as number;
  sampledY[sampledIndex] = ys[count - 1] as number;

  return { xs: sampledX, ys: sampledY };
}
