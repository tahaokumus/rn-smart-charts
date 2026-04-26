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
  DEFAULT_Y_TARGET_TICKS,
} from '../constants';
import { formatNumberTick } from '../format/numberFormat';
import { ticks as linearTicks, scale } from '../math/scaleLinear';
import type { PlotMetrics } from '../types/internal';
import type { YAxis as YAxisOption } from '../types/option';

interface Props {
  yAxis: YAxisOption;
  yMin: SharedValue<number>;
  yMax: SharedValue<number>;
  plot: PlotMetrics;
}

interface TickEntry {
  value: number;
  label: string;
}

function computeTicks(yAxis: YAxisOption, lo: number, hi: number): TickEntry[] {
  if (hi <= lo) return [];
  const lt = linearTicks(lo, hi, DEFAULT_Y_TARGET_TICKS);
  const step = lt.length > 1 ? (lt[1] as number) - (lt[0] as number) : 1;
  return lt.map((v, i) => ({
    value: v,
    label: yAxis.axisLabel?.formatter
      ? yAxis.axisLabel.formatter(v, i, lt as number[])
      : formatNumberTick(v, step),
  }));
}

export function YAxis({ yAxis, yMin, yMax, plot }: Props) {
  const labelColor = yAxis.axisLabel?.color ?? DEFAULT_AXIS_LABEL_COLOR;
  const fontSize = yAxis.axisLabel?.fontSize ?? DEFAULT_AXIS_LABEL_FONT_SIZE;
  const showLabels = yAxis.axisLabel?.show !== false;

  const font = matchFont({ fontFamily: 'sans-serif', fontSize });

  // Empty on first render to avoid reading .value during render.
  const [tickList, setTickList] = useState<TickEntry[]>([]);

  // Wrapper invoked on the JS thread — `computeTicks` is not a worklet.
  const recomputeOnJS = (lo: number, hi: number) => {
    setTickList(computeTicks(yAxis, lo, hi));
  };

  useAnimatedReaction(
    () => ({ lo: yMin.value, hi: yMax.value }),
    (curr, prev) => {
      if (
        prev &&
        Math.abs(curr.lo - prev.lo) / Math.max(1, Math.abs(prev.lo)) < 0.01 &&
        Math.abs(curr.hi - prev.hi) / Math.max(1, Math.abs(prev.hi)) < 0.01
      ) {
        return;
      }
      runOnJS(recomputeOnJS)(curr.lo, curr.hi);
    },
  );

  // Initial population + recompute on axis-config change (useEffect runs post-render).
  useEffect(() => {
    setTickList(computeTicks(yAxis, yMin.value, yMax.value));
  }, [yAxis, yMin, yMax]);

  if (!showLabels || !font) return null;

  return (
    <>
      {tickList.map((t, i) => (
        <YTick
          key={`ytick-${i}-${t.value}`}
          tick={t}
          yMin={yMin}
          yMax={yMax}
          plot={plot}
          font={font}
          color={labelColor}
          fontSize={fontSize}
        />
      ))}
    </>
  );
}

interface YTickProps {
  tick: TickEntry;
  yMin: SharedValue<number>;
  yMax: SharedValue<number>;
  plot: PlotMetrics;
  font: SkFont;
  color: string;
  fontSize: number;
}

function YTick({ tick, yMin, yMax, plot, font, color, fontSize }: YTickProps) {
  const labelWidth = font.measureText(tick.label).width;
  const x = plot.left - labelWidth - 6;
  const y = useDerivedValue(() => {
    const yScale = {
      d0: yMin.value,
      d1: yMax.value,
      r0: plot.top + plot.height,
      r1: plot.top,
    };
    return scale(yScale, tick.value) + fontSize / 3;
  });
  return <Text x={x} y={y} text={tick.label} font={font} color={color} />;
}
