import {
  Group,
  Line,
  RoundedRect,
  type SkPoint,
  Text,
  matchFont,
  vec,
} from '@shopify/react-native-skia';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
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

export function Crosshair({ series, tooltip, active, pixelX, xStart, xEnd, plot }: Props) {
  const fontSize = tooltip.textStyle?.fontSize ?? DEFAULT_AXIS_LABEL_FONT_SIZE;
  const textColor = tooltip.textStyle?.color ?? '#ffffff';
  const bgColor = tooltip.textStyle?.backgroundColor ?? 'rgba(20,20,20,0.85)';
  const font = matchFont({ fontFamily: 'sans-serif', fontSize });

  // Endpoints of the vertical line, animated via shared values.
  const lineP1 = useDerivedValue<SkPoint>(() => vec(pixelX.value, plot.top));
  const lineP2 = useDerivedValue<SkPoint>(() => vec(pixelX.value, plot.top + plot.height));
  const lineOpacity = useDerivedValue(() => (active.value ? 1 : 0));

  // Tooltip text (recomputed when window or pixelX or active changes).
  const tooltipText = useDerivedValue(() => {
    if (!active.value) return '';
    const xScale = {
      d0: xStart.value,
      d1: xEnd.value,
      r0: plot.left,
      r1: plot.left + plot.width,
    };
    const dataX = invert(xScale, pixelX.value);
    const i = bisectClosest(series.rawXs, dataX);
    if (i < 0) return '';
    const xv = series.rawXs[i] as number;
    const yv = series.rawYs[i] as number;
    const params: TooltipParams = { seriesName: series.name, x: xv, y: yv, index: i };
    return tooltip.formatter ? tooltip.formatter(params) : `${yv}`;
  });

  // Bubble x/y/w/h derivations. We approximate text width using the font's
  // average char width since SkFont.measureText would require running on JS.
  const charW = (font?.measureText('M').width ?? 8) * 0.7;
  const bubbleW = useDerivedValue(() => tooltipText.value.length * charW + 16);
  const bubbleH = fontSize + 12;
  const bubbleX = useDerivedValue(() => {
    let x = pixelX.value + 8;
    if (x + bubbleW.value > plot.left + plot.width) x = pixelX.value - bubbleW.value - 8;
    return x;
  });
  const bubbleY = plot.top + 8;
  const textX = useDerivedValue(() => bubbleX.value + 8);
  const textY = bubbleY + fontSize + 2;

  if (tooltip.show === false) return null;
  if (!font) return null;

  return (
    <Group opacity={lineOpacity}>
      <Line p1={lineP1} p2={lineP2} color="#9AA0A6" style="stroke" strokeWidth={1} />
      <RoundedRect x={bubbleX} y={bubbleY} width={bubbleW} height={bubbleH} r={6} color={bgColor} />
      <Text x={textX} y={textY} text={tooltipText} font={font} color={textColor} />
    </Group>
  );
}
