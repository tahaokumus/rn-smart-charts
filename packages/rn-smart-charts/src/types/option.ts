export type DataPoint = { x: number | Date; y: number };

export interface AxisLabel {
  show?: boolean;
  color?: string;
  fontSize?: number;
  formatter?: (value: number, index: number) => string;
}

export interface AxisLine {
  show?: boolean;
  color?: string;
  width?: number;
}

export interface SplitLine {
  show?: boolean;
  color?: string;
}

export interface XAxis {
  type: 'time' | 'value' | 'category';
  data?: Array<number | Date | string>;
  axisLabel?: AxisLabel;
  axisLine?: AxisLine;
  splitLine?: SplitLine;
  min?: number | Date;
  max?: number | Date;
}

export interface YAxis {
  type?: 'value';
  axisLabel?: AxisLabel;
  axisLine?: AxisLine;
  splitLine?: SplitLine;
  min?: number | 'auto';
  max?: number | 'auto';
  scale?: boolean;
}

export interface AreaSeries {
  type: 'area';
  name?: string;
  data: DataPoint[] | number[];
  smooth?: boolean;
  sampling?: 'lttb' | 'none';
  samplingThreshold?: number;
  lineStyle?: {
    color?: string;
    width?: number;
  };
  areaStyle?: {
    color?: string;
    opacity?: number;
  };
  symbol?: 'none' | 'circle';
}

export interface DataZoom {
  type?: 'inside';
  startValue?: number | Date;
  endValue?: number | Date;
  minSpan?: number;
  maxSpan?: number;
}

export interface TooltipParams {
  seriesName?: string;
  x: number;
  y: number;
  index: number;
}

export interface Tooltip {
  show?: boolean;
  trigger?: 'longpress';
  formatter?: (params: TooltipParams) => string;
  textStyle?: {
    color?: string;
    fontSize?: number;
    backgroundColor?: string;
  };
}

export interface Grid {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface AnimationConfig {
  enabled?: boolean;
  duration?: number;
  easing?: 'linear' | 'easeInOut';
}

export interface ChartOption {
  xAxis: XAxis;
  yAxis?: YAxis;
  series: [AreaSeries];
  dataZoom?: DataZoom;
  tooltip?: Tooltip;
  grid?: Grid;
  animation?: AnimationConfig;
  backgroundColor?: string;
}
