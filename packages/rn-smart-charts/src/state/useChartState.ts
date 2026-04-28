import { useMemo } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';
import { yDomainFor } from '../math/viewport';
import { indexRangeFor } from '../math/viewport';
import type { NormalizedOption } from '../types/internal';

export interface ChartState {
  // Visible window (data-space)
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  // Smoothed y domain (data-space)
  yMinAnim: SharedValue<number>;
  yMaxAnim: SharedValue<number>;
  // Crosshair / tooltip
  crosshairX: SharedValue<number>;
  crosshairActive: SharedValue<boolean>;
  // True during an active pan/pinch gesture — skips y-domain smoothing.
  interacting: SharedValue<boolean>;
  // Pan/pinch scratch (snapshots at gesture begin)
  panStartXStart: SharedValue<number>;
  panStartXEnd: SharedValue<number>;
  pinchStartXStart: SharedValue<number>;
  pinchStartXEnd: SharedValue<number>;
}

export function useChartState(option: NormalizedOption): ChartState {
  // Initial y domain over the initial visible window — union across all series
  // so the chart looks correct on first paint, before any gesture-driven re-derivation.
  const initialY = useMemo(() => {
    const includeZero = option.yAxis.scale !== true;
    const padRatio = option.yAxis.padding ?? 0.03;
    const yMinOverride = typeof option.yAxis.min === 'number' ? option.yAxis.min : null;
    const yMaxOverride = typeof option.yAxis.max === 'number' ? option.yAxis.max : null;
    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;
    for (const s of option.series) {
      const { i0, i1 } = indexRangeFor(s.xs, option.initialXStart, option.initialXEnd);
      const d = yDomainFor(s.ys, i0, i1, includeZero, padRatio);
      if (d.yMin < yMin) yMin = d.yMin;
      if (d.yMax > yMax) yMax = d.yMax;
    }
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
      yMin = 0;
      yMax = 1;
    }
    if (yMinOverride !== null) yMin = yMinOverride;
    if (yMaxOverride !== null) yMax = yMaxOverride;
    return { yMin, yMax };
  }, [option]);

  const xStart = useSharedValue(option.initialXStart);
  const xEnd = useSharedValue(option.initialXEnd);
  const yMinAnim = useSharedValue(initialY.yMin);
  const yMaxAnim = useSharedValue(initialY.yMax);

  const crosshairX = useSharedValue(0);
  const crosshairActive = useSharedValue(false);
  const interacting = useSharedValue(false);

  const panStartXStart = useSharedValue(0);
  const panStartXEnd = useSharedValue(0);
  const pinchStartXStart = useSharedValue(0);
  const pinchStartXEnd = useSharedValue(0);

  return {
    xStart,
    xEnd,
    yMinAnim,
    yMaxAnim,
    crosshairX,
    crosshairActive,
    interacting,
    panStartXStart,
    panStartXEnd,
    pinchStartXStart,
    pinchStartXEnd,
  };
}
