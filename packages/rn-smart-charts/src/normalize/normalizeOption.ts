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
  if (!option.series || option.series.length === 0) {
    throw new Error('[rn-smart-charts] option.series must contain at least one entry.');
  }

  const series: NormalizedSeries[] = option.series.map((seriesIn) => {
    const { xs: rawXs, ys: rawYs, medianDeltaX } = normalizeData(seriesIn.data, option.xAxis);

    // Optional LTTB downsampling (per-series).
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
    const out: NormalizedSeries = {
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
    if (medianDeltaX !== undefined) out.medianDeltaX = medianDeltaX;
    return out;
  });

  // Resolve effective tick-density floor: explicit opt wins; otherwise pick the
  // smallest median delta across series (= the finest resolution we can show).
  let xAxisEffectiveMinInterval = option.xAxis.minInterval;
  if (xAxisEffectiveMinInterval === undefined && option.xAxis.type === 'time') {
    let smallest = Number.POSITIVE_INFINITY;
    for (const s of series) {
      if (s.medianDeltaX !== undefined && s.medianDeltaX < smallest) smallest = s.medianDeltaX;
    }
    if (Number.isFinite(smallest)) xAxisEffectiveMinInterval = smallest;
  }

  // Data extent — union across all series.
  let dataMinX = Number.POSITIVE_INFINITY;
  let dataMaxX = Number.NEGATIVE_INFINITY;
  for (const s of series) {
    if (s.rawXs.length === 0) continue;
    const lo = s.rawXs[0] as number;
    const hi = s.rawXs[s.rawXs.length - 1] as number;
    if (lo < dataMinX) dataMinX = lo;
    if (hi > dataMaxX) dataMaxX = hi;
  }
  if (!Number.isFinite(dataMinX) || !Number.isFinite(dataMaxX)) {
    dataMinX = 0;
    dataMaxX = 1;
  }

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
    ...(xAxisEffectiveMinInterval !== undefined ? { xAxisEffectiveMinInterval } : {}),
  };
}
