import { type ForwardedRef, useImperativeHandle } from 'react';
import { type SharedValue, cancelAnimation, runOnUI, withTiming } from 'react-native-reanimated';
import type { NormalizedOption } from '../types/internal';
import type { ChartRef } from '../types/ref';

interface Args {
  ref: ForwardedRef<ChartRef>;
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  option: NormalizedOption;
}

function toMs(v: number | Date): number {
  return typeof v === 'number' ? v : v.getTime();
}

export function useImperativeChartRef({ ref, xStart, xEnd, option }: Args) {
  useImperativeHandle(
    ref,
    (): ChartRef => ({
      zoomTo(start, end) {
        const s = toMs(start);
        const e = toMs(end);
        const animated = option.animation.enabled;
        const duration = option.animation.duration;
        runOnUI(() => {
          'worklet';
          cancelAnimation(xStart);
          cancelAnimation(xEnd);
          if (animated) {
            xStart.value = withTiming(s, { duration });
            xEnd.value = withTiming(e, { duration });
          } else {
            xStart.value = s;
            xEnd.value = e;
          }
        })();
      },
      resetZoom() {
        this.zoomTo(option.dataMinX, option.dataMaxX);
      },
      panTo(x) {
        const target = toMs(x);
        const animated = option.animation.enabled;
        const duration = option.animation.duration;
        const dataMinX = option.dataMinX;
        const dataMaxX = option.dataMaxX;
        runOnUI(() => {
          'worklet';
          cancelAnimation(xStart);
          cancelAnimation(xEnd);
          const span = xEnd.value - xStart.value;
          let newEnd = target;
          if (newEnd > dataMaxX) newEnd = dataMaxX;
          let newStart = newEnd - span;
          if (newStart < dataMinX) {
            newStart = dataMinX;
            newEnd = newStart + span;
          }
          if (animated) {
            xStart.value = withTiming(newStart, { duration });
            xEnd.value = withTiming(newEnd, { duration });
          } else {
            xStart.value = newStart;
            xEnd.value = newEnd;
          }
        })();
      },
      getViewport() {
        return { start: xStart.value, end: xEnd.value };
      },
    }),
    [xStart, xEnd, option],
  );
}
