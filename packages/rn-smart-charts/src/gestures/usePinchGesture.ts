import { Gesture } from 'react-native-gesture-handler';
import { type SharedValue, cancelAnimation } from 'react-native-reanimated';
import { rightAnchoredPinch } from '../math/pinch';

interface Args {
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  pinchStartXStart: SharedValue<number>;
  pinchStartXEnd: SharedValue<number>;
  interacting: SharedValue<boolean>;
  minSpan: number;
  maxSpan: number;
  dataMinX: number;
}

export function usePinchGesture({
  xStart,
  xEnd,
  pinchStartXStart,
  pinchStartXEnd,
  interacting,
  minSpan,
  maxSpan,
  dataMinX,
}: Args) {
  return Gesture.Pinch()
    .onBegin(() => {
      'worklet';
      cancelAnimation(xStart);
      cancelAnimation(xEnd);
      pinchStartXStart.value = xStart.value;
      pinchStartXEnd.value = xEnd.value;
      interacting.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      const next = rightAnchoredPinch(
        pinchStartXStart.value,
        pinchStartXEnd.value,
        e.scale,
        minSpan,
        maxSpan,
        dataMinX,
      );
      xStart.value = next.xStart;
      xEnd.value = next.xEnd;
    })
    .onEnd(() => {
      'worklet';
      interacting.value = false;
    })
    .onFinalize(() => {
      'worklet';
      interacting.value = false;
    });
}
