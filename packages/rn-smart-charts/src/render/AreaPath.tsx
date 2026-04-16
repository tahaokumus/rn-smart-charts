import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import type { NormalizedSeries, PlotMetrics } from '../types/internal';
import { withAlpha } from './gradient';
import { buildAreaPath } from './pathBuilder';

interface Props {
  series: NormalizedSeries;
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  yMin: SharedValue<number>;
  yMax: SharedValue<number>;
  plot: PlotMetrics;
}

export function AreaPath({ series, xStart, xEnd, yMin, yMax, plot }: Props) {
  const fillPath = useDerivedValue(() => {
    return buildAreaPath({
      xs: series.xs,
      ys: series.ys,
      xStart: xStart.value,
      xEnd: xEnd.value,
      yMin: yMin.value,
      yMax: yMax.value,
      plot,
      smooth: series.smooth,
      closed: true,
    });
  });

  const strokePath = useDerivedValue(() => {
    return buildAreaPath({
      xs: series.xs,
      ys: series.ys,
      xStart: xStart.value,
      xEnd: xEnd.value,
      yMin: yMin.value,
      yMax: yMax.value,
      plot,
      smooth: series.smooth,
      closed: false,
    });
  });

  const topColor = withAlpha(series.areaColor, series.areaOpacity);
  const bottomColor = withAlpha(series.areaColor, 0);

  return (
    <Group>
      <Path path={fillPath} style="fill">
        <LinearGradient
          start={vec(0, plot.top)}
          end={vec(0, plot.top + plot.height)}
          colors={[topColor, bottomColor]}
        />
      </Path>
      <Path
        path={strokePath}
        style="stroke"
        strokeWidth={series.strokeWidth}
        color={series.lineColor}
        strokeJoin="round"
        strokeCap="round"
      />
    </Group>
  );
}
