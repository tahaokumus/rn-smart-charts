import {
  DEFAULT_ANIMATION_DURATION,
  DEFAULT_AREA_OPACITY,
  DEFAULT_GRID,
  DEFAULT_LINE_COLOR,
  DEFAULT_LINE_WIDTH,
  DEFAULT_LTTB_THRESHOLD,
} from '../constants';
import { lttb } from '../math/lttb';
import type { NormalizedOption, NormalizedSeries } from '../types/internal';
import type { ChartOption } from '../types/option';
import { normalizeData } from './normalizeData';

function dateToMs(v: number | Date | undefined): number | undefined {
  if (v == null) return undefined;
  return typeof v === 'number' ? v : v.getTime();
}

export function normalizeOption(option: ChartOption): NormalizedOption {
  const seriesIn = option.series[0];
  if (!seriesIn) {
    throw new Error('[rn-smart-charts] option.series must contain exactly one entry.');
  }

  const { xs: rawXs, ys: rawYs } = normalizeData(seriesIn.data, option.xAxis);

  // Optional LTTB downsampling.
  const sampling = seriesIn.sampling ?? 'lttb';
  const threshold = seriesIn.samplingThreshold ?? DEFAULT_LTTB_THRESHOLD;
  let xs = rawXs;
  let ys = rawYs;
  if (sampling === 'lttb' && rawXs.length > threshold) {
    const sampled = lttb(rawXs, rawYs, rawXs.length, threshold);
    xs = sampled.xs;
    ys = sampled.ys;
  }

  const lineColor = seriesIn.lineStyle?.color ?? DEFAULT_LINE_COLOR;
  const series: NormalizedSeries = {
    name: seriesIn.name,
    xs,
    ys,
    rawXs,
    rawYs,
    smooth: seriesIn.smooth ?? false,
    lineColor,
    strokeWidth: seriesIn.lineStyle?.width ?? DEFAULT_LINE_WIDTH,
    areaColor: seriesIn.areaStyle?.color ?? lineColor,
    areaOpacity: seriesIn.areaStyle?.opacity ?? DEFAULT_AREA_OPACITY,
  };

  // Data extent
  const dataMinX = rawXs.length > 0 ? (rawXs[0] as number) : 0;
  const dataMaxX = rawXs.length > 0 ? (rawXs[rawXs.length - 1] as number) : 1;

  // Initial visible window
  const dzStart = dateToMs(option.dataZoom?.startValue);
  const dzEnd = dateToMs(option.dataZoom?.endValue);
  const xMinFromAxis = dateToMs(option.xAxis.min);
  const xMaxFromAxis = dateToMs(option.xAxis.max);
  const initialXStart = dzStart ?? xMinFromAxis ?? dataMinX;
  const initialXEnd = dzEnd ?? xMaxFromAxis ?? dataMaxX;

  // Span limits
  const fullSpan = Math.max(1, dataMaxX - dataMinX);
  const minSpan = option.dataZoom?.minSpan ?? Math.max(1, fullSpan * 0.005);
  const maxSpan = option.dataZoom?.maxSpan ?? fullSpan;

  return {
    xAxis: option.xAxis,
    yAxis: option.yAxis ?? { type: 'value' },
    series,
    grid: {
      left: option.grid?.left ?? DEFAULT_GRID.left,
      right: option.grid?.right ?? DEFAULT_GRID.right,
      top: option.grid?.top ?? DEFAULT_GRID.top,
      bottom: option.grid?.bottom ?? DEFAULT_GRID.bottom,
    },
    animation: {
      enabled: option.animation?.enabled ?? true,
      duration: option.animation?.duration ?? DEFAULT_ANIMATION_DURATION,
      easing: option.animation?.easing ?? 'easeInOut',
    },
    tooltip: {
      show: option.tooltip?.show ?? true,
      trigger: option.tooltip?.trigger,
      formatter: option.tooltip?.formatter,
      textStyle: option.tooltip?.textStyle,
    },
    dataMinX,
    dataMaxX,
    initialXStart,
    initialXEnd,
    minSpan,
    maxSpan,
    backgroundColor: option.backgroundColor ?? 'transparent',
  };
}
