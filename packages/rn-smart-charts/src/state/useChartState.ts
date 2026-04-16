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
  // Pan/pinch scratch (snapshots at gesture begin)
  panStartXStart: SharedValue<number>;
  panStartXEnd: SharedValue<number>;
  pinchStartXStart: SharedValue<number>;
  pinchStartXEnd: SharedValue<number>;
}

export function useChartState(option: NormalizedOption): ChartState {
  // Initial y domain over the initial visible window — so the chart looks
  // correct on first paint, before any gesture-driven re-derivation.
  const initialY = useMemo(() => {
    const { i0, i1 } = indexRangeFor(option.series.xs, option.initialXStart, option.initialXEnd);
    return yDomainFor(option.series.ys, i0, i1, option.yAxis.scale !== true);
  }, [option]);

  const xStart = useSharedValue(option.initialXStart);
  const xEnd = useSharedValue(option.initialXEnd);
  const yMinAnim = useSharedValue(initialY.yMin);
  const yMaxAnim = useSharedValue(initialY.yMax);

  const crosshairX = useSharedValue(0);
  const crosshairActive = useSharedValue(false);

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
    panStartXStart,
    panStartXEnd,
    pinchStartXStart,
    pinchStartXEnd,
  };
}
