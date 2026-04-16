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
import { formatTimeTick } from '../format/timeTickFormat';
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
    return tt.map((t, i) => ({
      value: t.value,
      label: xAxis.axisLabel?.formatter
        ? xAxis.axisLabel.formatter(t.value, i)
        : formatTimeTick(t.value, t.level),
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

  // React state: the tick list. Updated from the UI thread when window changes.
  const [tickList, setTickList] = useState<TickEntry[]>(() =>
    computeTicks(xAxis, xStart.value, xEnd.value),
  );

  useAnimatedReaction(
    () => ({ s: xStart.value, e: xEnd.value }),
    (curr, prev) => {
      if (prev && Math.abs(curr.s - prev.s) < 1 && Math.abs(curr.e - prev.e) < 1) return;
      runOnJS(setTickList)(computeTicks(xAxis, curr.s, curr.e));
    },
  );

  // Recompute when axis config / plot changes.
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
