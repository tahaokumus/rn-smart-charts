import {
  Group,
  Line,
  RoundedRect,
  type SkPoint,
  Text,
  matchFont,
  vec,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import {
  type SharedValue,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated';
import { DEFAULT_AXIS_LABEL_FONT_SIZE } from '../constants';
import { bisectClosest } from '../math/bisect';
import { invert } from '../math/scaleLinear';
import type { NormalizedSeries, PlotMetrics } from '../types/internal';
import type { Tooltip, TooltipParams } from '../types/option';

interface Props {
  series: NormalizedSeries;
  tooltip: Tooltip;
  active: SharedValue<boolean>;
  pixelX: SharedValue<number>;
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  plot: PlotMetrics;
}

interface TooltipSnapshot {
  text: string;
  width: number;
}

export function Crosshair({ series, tooltip, active, pixelX, xStart, xEnd, plot }: Props) {
  const fontSize = tooltip.textStyle?.fontSize ?? DEFAULT_AXIS_LABEL_FONT_SIZE;
  const textColor = tooltip.textStyle?.color ?? '#ffffff';
  const bgColor = tooltip.textStyle?.backgroundColor ?? 'rgba(20,20,20,0.85)';
  const font = matchFont({ fontFamily: 'sans-serif', fontSize });

  // Tooltip text + measured width live in React state because they're derived
  // from a user-supplied `formatter` (a non-worklet JS function) and from
  // SkFont.measureText (also JS-side). The crosshair line + bubble *position*
  // still animate on the UI thread via shared values.
  const [snapshot, setSnapshot] = useState<TooltipSnapshot>({ text: '', width: 0 });

  // JS-side helpers — must be declared *before* useAnimatedReaction so the
  // worklet captures defined references in its closure. Reanimated serializes
  // the closure at registration time; forward-references resolve to undefined
  // and produce: "Cannot read property '__remoteFunction' of undefined".
  const clearSnapshot = () => {
    setSnapshot({ text: '', width: 0 });
  };

  const resolveAndSet = (xv: number, yv: number, i: number) => {
    const params: TooltipParams = { seriesName: series.name, x: xv, y: yv, index: i };
    const text = tooltip.formatter ? tooltip.formatter(params) : `${yv}`;
    const width = font ? font.measureText(text).width + 16 : text.length * 8 + 16;
    setSnapshot({ text, width });
  };

  useAnimatedReaction(
    () => ({
      active: active.value,
      px: pixelX.value,
      xs: xStart.value,
      xe: xEnd.value,
    }),
    (curr, prev) => {
      if (
        prev &&
        prev.active === curr.active &&
        Math.abs(prev.px - curr.px) < 1 &&
        prev.xs === curr.xs &&
        prev.xe === curr.xe
      ) {
        return;
      }
      if (!curr.active) {
        runOnJS(clearSnapshot)();
        return;
      }
      const xScale = {
        d0: curr.xs,
        d1: curr.xe,
        r0: plot.left,
        r1: plot.left + plot.width,
      };
      const dataX = invert(xScale, curr.px);
      const i = bisectClosest(series.rawXs, dataX);
      if (i < 0) {
        runOnJS(clearSnapshot)();
        return;
      }
      const xv = series.rawXs[i] as number;
      const yv = series.rawYs[i] as number;
      runOnJS(resolveAndSet)(xv, yv, i);
    },
  );

  // Animated geometry — driven by pixelX + active on the UI thread.
  const lineP1 = useDerivedValue<SkPoint>(() => vec(pixelX.value, plot.top));
  const lineP2 = useDerivedValue<SkPoint>(() => vec(pixelX.value, plot.top + plot.height));
  const lineOpacity = useDerivedValue(() => (active.value ? 1 : 0));

  const bubbleW = snapshot.width;
  const bubbleH = fontSize + 12;
  const bubbleY = plot.top + 8;
  const textY = bubbleY + fontSize + 2;

  const bubbleX = useDerivedValue(() => {
    let x = pixelX.value + 8;
    if (x + bubbleW > plot.left + plot.width) x = pixelX.value - bubbleW - 8;
    return x;
  });
  const textX = useDerivedValue(() => bubbleX.value + 8);

  if (tooltip.show === false) return null;
  if (!font) return null;

  return (
    <Group opacity={lineOpacity}>
      <Line p1={lineP1} p2={lineP2} color="#9AA0A6" style="stroke" strokeWidth={1} />
      <RoundedRect x={bubbleX} y={bubbleY} width={bubbleW} height={bubbleH} r={6} color={bgColor} />
      <Text x={textX} y={textY} text={snapshot.text} font={font} color={textColor} />
    </Group>
  );
}
