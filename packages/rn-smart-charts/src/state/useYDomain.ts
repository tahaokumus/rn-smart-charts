import { type SharedValue, useAnimatedReaction, withTiming } from 'react-native-reanimated';
import { Y_DOMAIN_EPSILON, Y_DOMAIN_SMOOTHING_DURATION } from '../constants';
import { indexRangeFor, yDomainFor } from '../math/viewport';
import type { NormalizedSeries } from '../types/internal';

interface Args {
  series: NormalizedSeries;
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  yMinAnim: SharedValue<number>;
  yMaxAnim: SharedValue<number>;
  includeZero: boolean;
}

/**
 * Watches the visible window and re-targets the smoothed y-domain shared values
 * via `withTiming` whenever the raw y range changes by more than Y_DOMAIN_EPSILON.
 */
export function useYDomain({ series, xStart, xEnd, yMinAnim, yMaxAnim, includeZero }: Args) {
  useAnimatedReaction(
    () => {
      const { i0, i1 } = indexRangeFor(series.xs, xStart.value, xEnd.value);
      return yDomainFor(series.ys, i0, i1, includeZero);
    },
    (curr, prev) => {
      if (prev) {
        const span = Math.max(1, prev.yMax - prev.yMin);
        const dMin = Math.abs(curr.yMin - prev.yMin);
        const dMax = Math.abs(curr.yMax - prev.yMin);
        if (dMin / span < Y_DOMAIN_EPSILON && dMax / span < Y_DOMAIN_EPSILON) {
          return;
        }
      }
      yMinAnim.value = withTiming(curr.yMin, { duration: Y_DOMAIN_SMOOTHING_DURATION });
      yMaxAnim.value = withTiming(curr.yMax, { duration: Y_DOMAIN_SMOOTHING_DURATION });
    },
  );
}
