import type { AnimationConfig, Grid, Tooltip, XAxis, YAxis } from './option';

export interface NormalizedSeries {
  name: string | undefined;
  /** Possibly downsampled (LTTB) for rendering. Float64 to keep ms-timestamp precision. */
  xs: Float64Array;
  ys: Float64Array;
  /** Raw, un-downsampled. Used for crosshair lookups so values stay accurate. */
  rawXs: Float64Array;
  rawYs: Float64Array;
  smooth: boolean;
  lineColor: string;
  strokeWidth: number;
  areaColor: string;
  areaOpacity: number;
}

export interface NormalizedOption {
  xAxis: XAxis;
  yAxis: YAxis;
  series: NormalizedSeries[];
  grid: Required<Grid>;
  animation: Required<AnimationConfig>;
  tooltip: Required<Pick<Tooltip, 'show'>> & Tooltip;
  dataMinX: number;
  dataMaxX: number;
  initialXStart: number;
  initialXEnd: number;
  minSpan: number;
  maxSpan: number;
  backgroundColor: string;
}

export interface PlotMetrics {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Minimal interface the path-builder targets so it can be unit tested without Skia. */
export interface PathLike {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  cubicTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  close(): void;
}
