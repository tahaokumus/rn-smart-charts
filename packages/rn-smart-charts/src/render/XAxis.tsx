import { type SkFont, Text, matchFont } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
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
import { selectTimeTicks } from '../math/scaleTime';
import type { PlotMetrics } from '../types/internal';
import type { XAxis as XAxisOption } from '../types/option';

interface Props {
  xAxis: XAxisOption;
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  plot: PlotMetrics;
  /** Resolved tick-density floor in ms (`xAxis.minInterval` or auto-detected). */
  minInterval?: number;
}

interface TickEntry {
  value: number;
  label: string;
  bold: boolean;
}

const DEFAULT_LABEL_MIN_GAP_PX = 8;

function computeTicks(
  xAxis: XAxisOption,
  xStart: number,
  xEnd: number,
  plotWidthPx: number,
  minInterval: number | undefined,
  measureLabel: (text: string, bold: boolean) => number,
): TickEntry[] {
  if (xEnd <= xStart) return [];
  if (xAxis.type === 'time') {
    const tt = selectTimeTicks({
      d0: xStart,
      d1: xEnd,
      plotWidthPx,
      minLabelGapPx: xAxis.axisLabel?.minGap ?? DEFAULT_LABEL_MIN_GAP_PX,
      measureLabel,
      locale: xAxis.locale,
      minInterval,
    });
    const values = tt.map((t) => t.value);
    const contextual = formatTimeTicksContextual(tt, xAxis.locale);
    return tt.map((t, i) => {
      const c = contextual[i];
      const fallback = c?.label ?? '';
      const bold = c?.bold ?? false;
      const label = xAxis.axisLabel?.formatter
        ? xAxis.axisLabel.formatter(t.value, i, values)
        : fallback;
      return { value: t.value, label, bold };
    });
  }
  if (xAxis.type === 'category') {
    const n = xAxis.data?.length ?? 0;
    const step = Math.max(1, Math.ceil(n / DEFAULT_X_TARGET_TICKS));
    const indices: number[] = [];
    for (let i = 0; i < n; i += step) indices.push(i);
    return indices
      .filter((i) => i >= xStart && i <= xEnd)
      .map((i) => ({
        value: i,
        label: xAxis.axisLabel?.formatter
          ? xAxis.axisLabel.formatter(i, i, indices)
          : String(i),
        bold: false,
      }));
  }
  const lt = linearTicks(xStart, xEnd, DEFAULT_X_TARGET_TICKS);
  const step = lt.length > 1 ? (lt[1] as number) - (lt[0] as number) : 1;
  return lt.map((v, i) => ({
    value: v,
    label: xAxis.axisLabel?.formatter
      ? xAxis.axisLabel.formatter(v, i, lt as number[])
      : formatNumberTick(v, step),
    bold: false,
  }));
}

export function XAxis({ xAxis, xStart, xEnd, plot, minInterval }: Props) {
  const labelColor = xAxis.axisLabel?.color ?? DEFAULT_AXIS_LABEL_COLOR;
  const fontSize = xAxis.axisLabel?.fontSize ?? DEFAULT_AXIS_LABEL_FONT_SIZE;
  const showLabels = xAxis.axisLabel?.show !== false;

  const font = matchFont({ fontFamily: 'sans-serif', fontSize });
  // Boundary ticks render in bold to match the ECharts time-axis look.
  // matchFont accepts fontWeight; on platforms that ignore it, swap fontFamily
  // to a -bold variant.
  const boldFont = matchFont({ fontFamily: 'sans-serif', fontSize, fontWeight: 'bold' });

  const [tickList, setTickList] = useState<TickEntry[]>([]);

  // Wrapper invoked on the JS thread — `computeTicks` is not a worklet.
  const recomputeOnJS = (s: number, e: number) => {
    if (!font || !boldFont) return;
    const measureLabel = (text: string, bold: boolean): number => {
      const f = bold ? boldFont : font;
      return f.measureText(text).width;
    };
    setTickList(computeTicks(xAxis, s, e, plot.width, minInterval, measureLabel));
  };

  useAnimatedReaction(
    () => ({ s: xStart.value, e: xEnd.value }),
    (curr, prev) => {
      if (prev && Math.abs(curr.s - prev.s) < 1 && Math.abs(curr.e - prev.e) < 1) return;
      runOnJS(recomputeOnJS)(curr.s, curr.e);
    },
  );

  useEffect(() => {
    if (!font || !boldFont) return;
    const measureLabel = (text: string, bold: boolean): number => {
      const f = bold ? boldFont : font;
      return f.measureText(text).width;
    };
    setTickList(
      computeTicks(xAxis, xStart.value, xEnd.value, plot.width, minInterval, measureLabel),
    );
  }, [xAxis, xStart, xEnd, plot.width, minInterval, font, boldFont]);

  const yLabel = useMemo(() => plot.top + plot.height + fontSize + 4, [plot, fontSize]);

  if (!showLabels || !font || !boldFont) return null;

  return (
    <>
      {tickList.map((t, i) => (
        <XTick
          key={`xtick-${i}-${t.value}`}
          tick={t}
          xStart={xStart}
          xEnd={xEnd}
          plot={plot}
          font={t.bold ? boldFont : font}
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
