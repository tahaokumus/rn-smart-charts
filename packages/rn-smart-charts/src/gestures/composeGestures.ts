import { type ComposedGesture, Gesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import type { ChartState } from '../state/useChartState';
import type { NormalizedOption } from '../types/internal';
import { useLongPressGesture } from './useLongPressGesture';
import { usePanGesture } from './usePanGesture';
import { usePinchGesture } from './usePinchGesture';

interface Args {
  state: ChartState;
  option: NormalizedOption;
  plotW: SharedValue<number>;
}

export function useComposedChartGesture({ state, option, plotW }: Args): ComposedGesture {
  // We capture plotW.value at gesture configuration time per call; gestures
  // need a number, not an SV. We re-create the gesture object below if plotW
  // changes by reading the latest .value at gesture begin.
  const pan = usePanGesture({
    xStart: state.xStart,
    xEnd: state.xEnd,
    panStartXStart: state.panStartXStart,
    panStartXEnd: state.panStartXEnd,
    plotW: plotW.value,
    dataMinX: option.dataMinX,
    dataMaxX: option.dataMaxX,
  });

  const pinch = usePinchGesture({
    xStart: state.xStart,
    xEnd: state.xEnd,
    pinchStartXStart: state.pinchStartXStart,
    pinchStartXEnd: state.pinchStartXEnd,
    minSpan: option.minSpan,
    maxSpan: option.maxSpan,
    dataMinX: option.dataMinX,
  });

  const { longPress, crosshairPan } = useLongPressGesture({
    crosshairActive: state.crosshairActive,
    crosshairX: state.crosshairX,
  });

  // Once long-press fires, the crosshairPan takes over; otherwise pan/pinch
  // run together. We use Race to give long-press priority once it activates.
  return Gesture.Race(
    Gesture.Simultaneous(longPress, crosshairPan),
    Gesture.Simultaneous(pinch, pan),
  );
}
