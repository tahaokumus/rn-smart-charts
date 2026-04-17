import { forwardRef, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View, type ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useComposedChartGesture } from './gestures/composeGestures';
import { normalizeOption } from './normalize/normalizeOption';
import { ChartCanvas } from './render/ChartCanvas';
import { useChartState } from './state/useChartState';
import { useImperativeChartRef } from './state/useImperativeChartRef';
import { useYDomain } from './state/useYDomain';
import type { PlotMetrics } from './types/internal';
import type { ChartOption } from './types/option';
import type { ChartRef } from './types/ref';

export interface ChartProps {
  option: ChartOption;
  style?: ViewStyle;
}

export const Chart = forwardRef<ChartRef, ChartProps>(function Chart({ option, style }, ref) {
  const normalized = useMemo(() => normalizeOption(option), [option]);
  const state = useChartState(normalized);

  // Layout
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const plotW = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
    const innerW = Math.max(0, width - normalized.grid.left - normalized.grid.right);
    plotW.value = innerW;
  };

  const plot: PlotMetrics | null = useMemo(() => {
    if (!size) return null;
    return {
      left: normalized.grid.left,
      top: normalized.grid.top,
      width: Math.max(0, size.width - normalized.grid.left - normalized.grid.right),
      height: Math.max(0, size.height - normalized.grid.top - normalized.grid.bottom),
    };
  }, [size, normalized]);

  // Y-domain auto-fit (subscribes to xStart/xEnd, re-targets yMin/yMax with smoothing).
  useYDomain({
    series: normalized.series,
    xStart: state.xStart,
    xEnd: state.xEnd,
    yMinAnim: state.yMinAnim,
    yMaxAnim: state.yMaxAnim,
    interacting: state.interacting,
    includeZero: normalized.yAxis.scale !== true,
  });

  // Imperative API surface.
  useImperativeChartRef({ ref, xStart: state.xStart, xEnd: state.xEnd, option: normalized });

  // Compose gestures (always — even before layout — so the GestureDetector is stable).
  const gesture = useComposedChartGesture({ state, option: normalized, plotW });

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          {plot && size ? (
            <ChartCanvas
              option={normalized}
              plot={plot}
              width={size.width}
              height={size.height}
              xStart={state.xStart}
              xEnd={state.xEnd}
              yMinAnim={state.yMinAnim}
              yMaxAnim={state.yMaxAnim}
              crosshairX={state.crosshairX}
              crosshairActive={state.crosshairActive}
            />
          ) : null}
        </View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
});
