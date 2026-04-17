import {
  cancelAnimation,
  type SharedValue,
  useAnimatedReaction,
  withTiming,
} from 'react-native-reanimated';
import { Y_DOMAIN_EPSILON, Y_DOMAIN_SMOOTHING_DURATION } from '../constants';
import { indexRangeFor, yDomainFor } from '../math/viewport';
import type { NormalizedSeries } from '../types/internal';

interface Args {
  series: NormalizedSeries;
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  yMinAnim: SharedValue<number>;
  yMaxAnim: SharedValue<number>;
  /** True while a pan/pinch gesture is in flight — skip smoothing to avoid flicker. */
  interacting: SharedValue<boolean>;
  includeZero: boolean;
}

/**
 * Watches the visible window and updates the y-domain shared values.
 *
 * While the user is actively pinching or panning, we assign the target values
 * directly — otherwise `withTiming` restarts on every frame and produces a
 * visible lag/flicker as the animation chases a moving target.
 *
 * When the gesture is idle, small changes are ignored (epsilon gate) and
 * larger changes are smoothed via `withTiming` so an outlier scrolling into
 * view doesn't cause a jarring snap.
 */
export function useYDomain({
  series,
  xStart,
  xEnd,
  yMinAnim,
  yMaxAnim,
  interacting,
  includeZero,
}: Args) {
  useAnimatedReaction(
    () => {
      const { i0, i1 } = indexRangeFor(series.xs, xStart.value, xEnd.value);
      const d = yDomainFor(series.ys, i0, i1, includeZero);
      return { yMin: d.yMin, yMax: d.yMax, interacting: interacting.value };
    },
    (curr, prev) => {
      if (curr.interacting) {
        // Snap to the target — no animation chain during gestures.
        cancelAnimation(yMinAnim);
        cancelAnimation(yMaxAnim);
        yMinAnim.value = curr.yMin;
        yMaxAnim.value = curr.yMax;
        return;
      }

      if (prev && !prev.interacting) {
        // Epsilon gate: ignore micro-changes that would cause noisy animations.
        const span = Math.max(1, prev.yMax - prev.yMin);
        const dMin = Math.abs(curr.yMin - prev.yMin);
        const dMax = Math.abs(curr.yMax - prev.yMax);
        if (dMin / span < Y_DOMAIN_EPSILON && dMax / span < Y_DOMAIN_EPSILON) {
          return;
        }
      }

      yMinAnim.value = withTiming(curr.yMin, { duration: Y_DOMAIN_SMOOTHING_DURATION });
      yMaxAnim.value = withTiming(curr.yMax, { duration: Y_DOMAIN_SMOOTHING_DURATION });
    },
  );
}
