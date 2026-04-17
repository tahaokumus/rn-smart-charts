import { type SkFont, Text, matchFont } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import {
  type SharedValue,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  DEFAULT_AXIS_LABEL_COLOR,
  DEFAULT_AXIS_LABEL_FONT_SIZE,
  DEFAULT_X_TARGET_TICKS,
} from '../constants';
import { formatNumberTick } from '../format/numberFormat';
import { formatTimeTicksContextual } from '../format/timeTickFormat';
import { ticks as linearTicks, scale } from '../math/scaleLinear';
import { timeTicks } from '../math/scaleTime';
import type { PlotMetrics } from '../types/internal';
import type { XAxis as XAxisOption } from '../types/option';

interface Props {
  xAxis: XAxisOption;
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  plot: PlotMetrics;
}

interface TickEntry {
  value: number;
  label: string;
}

function computeTicks(xAxis: XAxisOption, xStart: number, xEnd: number): TickEntry[] {
  if (xEnd <= xStart) return [];
  if (xAxis.type === 'time') {
    const tt = timeTicks(xStart, xEnd, DEFAULT_X_TARGET_TICKS);
    // Contextual labels: show higher units only when they change.
    const contextualLabels = formatTimeTicksContextual(tt);
    return tt.map((t, i) => ({
      value: t.value,
      label: xAxis.axisLabel?.formatter
        ? xAxis.axisLabel.formatter(t.value, i)
        : (contextualLabels[i] ?? ''),
    }));
  }
  const lt = linearTicks(xStart, xEnd, DEFAULT_X_TARGET_TICKS);
  const step = lt.length > 1 ? (lt[1] as number) - (lt[0] as number) : 1;
  return lt.map((v, i) => ({
    value: v,
    label: xAxis.axisLabel?.formatter ? xAxis.axisLabel.formatter(v, i) : formatNumberTick(v, step),
  }));
}

export function XAxis({ xAxis, xStart, xEnd, plot }: Props) {
  const labelColor = xAxis.axisLabel?.color ?? DEFAULT_AXIS_LABEL_COLOR;
  const fontSize = xAxis.axisLabel?.fontSize ?? DEFAULT_AXIS_LABEL_FONT_SIZE;
  const showLabels = xAxis.axisLabel?.show !== false;

  const font = matchFont({ fontFamily: 'sans-serif', fontSize });

  // Tick list as React state. Empty on first render to avoid reading .value during render;
  // useEffect populates it on mount.
  const [tickList, setTickList] = useState<TickEntry[]>([]);

  // Wrapper invoked on the JS thread — `computeTicks` is not a worklet.
  const recomputeOnJS = (s: number, e: number) => {
    setTickList(computeTicks(xAxis, s, e));
  };

  useAnimatedReaction(
    () => ({ s: xStart.value, e: xEnd.value }),
    (curr, prev) => {
      if (prev && Math.abs(curr.s - prev.s) < 1 && Math.abs(curr.e - prev.e) < 1) return;
      runOnJS(recomputeOnJS)(curr.s, curr.e);
    },
  );

  // Initial population + recompute when axis config changes. useEffect runs after render
  // so reading shared-value `.value` here is safe.
  useEffect(() => {
    setTickList(computeTicks(xAxis, xStart.value, xEnd.value));
  }, [xAxis, xStart, xEnd]);

  if (!showLabels || !font) return null;

  const yLabel = plot.top + plot.height + fontSize + 4;

  return (
    <>
      {tickList.map((t, i) => (
        <XTick
          key={`xtick-${i}-${t.value}`}
          tick={t}
          xStart={xStart}
          xEnd={xEnd}
          plot={plot}
          font={font}
          color={labelColor}
          y={yLabel}
        />
      ))}
    </>
  );
}

interface TickProps {
  tick: TickEntry;
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  plot: PlotMetrics;
  font: SkFont;
  color: string;
  y: number;
}

function XTick({ tick, xStart, xEnd, plot, font, color, y }: TickProps) {
  const labelWidth = font.measureText(tick.label).width;
  const x = useDerivedValue(() => {
    const xScale = {
      d0: xStart.value,
      d1: xEnd.value,
      r0: plot.left,
      r1: plot.left + plot.width,
    };
    return scale(xScale, tick.value) - labelWidth / 2;
  });
  return <Text x={x} y={y} text={tick.label} font={font} color={color} />;
}
