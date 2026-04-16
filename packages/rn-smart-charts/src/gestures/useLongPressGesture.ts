import { Gesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import { DEFAULT_LONG_PRESS_MS } from '../constants';

interface Args {
  crosshairActive: SharedValue<boolean>;
  crosshairX: SharedValue<number>;
}

/**
 * Returns two composable gestures:
 *   - `longPress`: activates the crosshair and sets initial pixelX.
 *   - `crosshairPan`: while the crosshair is active, slides crosshairX with the
 *     finger. Has no effect when `crosshairActive` is false.
 */
export function useLongPressGesture({ crosshairActive, crosshairX }: Args) {
  const longPress = Gesture.LongPress()
    .minDuration(DEFAULT_LONG_PRESS_MS)
    .onStart((e) => {
      'worklet';
      crosshairActive.value = true;
      crosshairX.value = e.x;
    })
    .onEnd(() => {
      'worklet';
      crosshairActive.value = false;
    })
    .onFinalize(() => {
      'worklet';
      crosshairActive.value = false;
    });

  const crosshairPan = Gesture.Pan()
    .averageTouches(false)
    .onUpdate((e) => {
      'worklet';
      if (!crosshairActive.value) return;
      crosshairX.value = e.x;
    })
    .onEnd(() => {
      'worklet';
      crosshairActive.value = false;
    });

  return { longPress, crosshairPan };
}
