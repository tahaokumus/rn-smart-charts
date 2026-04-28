import { Canvas, Group, Rect, rect } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { NormalizedOption, NormalizedSeries, PlotMetrics } from '../types/internal';
import { AreaPath } from './AreaPath';
import { Crosshair } from './Crosshair';
import { XAxis } from './XAxis';
import { YAxis } from './YAxis';

interface Props {
  option: NormalizedOption;
  plot: PlotMetrics;
  width: number;
  height: number;
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  yMinAnim: SharedValue<number>;
  yMaxAnim: SharedValue<number>;
  crosshairX: SharedValue<number>;
  crosshairActive: SharedValue<boolean>;
}

export function ChartCanvas({
  option,
  plot,
  width,
  height,
  xStart,
  xEnd,
  yMinAnim,
  yMaxAnim,
  crosshairX,
  crosshairActive,
}: Props) {
  const clipRect = rect(plot.left, plot.top, plot.width, plot.height);

  return (
    <Canvas style={{ width, height }}>
      {option.backgroundColor !== 'transparent' ? (
        <Rect x={0} y={0} width={width} height={height} color={option.backgroundColor} />
      ) : null}

      <YAxis yAxis={option.yAxis} yMin={yMinAnim} yMax={yMaxAnim} plot={plot} />

      <Group clip={clipRect}>
        {option.series.map((s, i) => (
          <AreaPath
            key={s.name ?? i}
            series={s}
            xStart={xStart}
            xEnd={xEnd}
            yMin={yMinAnim}
            yMax={yMaxAnim}
            plot={plot}
          />
        ))}
      </Group>

      <XAxis
        xAxis={option.xAxis}
        xStart={xStart}
        xEnd={xEnd}
        plot={plot}
        minInterval={option.xAxisEffectiveMinInterval}
      />

      <Crosshair
        series={option.series[0] as NormalizedSeries}
        tooltip={option.tooltip}
        active={crosshairActive}
        pixelX={crosshairX}
        xStart={xStart}
        xEnd={xEnd}
        plot={plot}
      />
    </Canvas>
  );
}
