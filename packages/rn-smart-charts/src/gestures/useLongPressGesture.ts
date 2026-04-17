import { Gesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import { DEFAULT_LONG_PRESS_MS } from '../constants';

interface Args {
  crosshairActive: SharedValue<boolean>;
  crosshairX: SharedValue<number>;
}

/**
 * A single `Gesture.Pan()` that only activates after the user holds the finger
 * still for `DEFAULT_LONG_PRESS_MS`. Before that threshold, the normal pan/pinch
 * gestures win the Race, so regular panning isn't blocked.
 *
 * Once activated, it sets `crosshairActive=true` and drives `crosshairX` with
 * the finger position. On release, it clears `crosshairActive`.
 */
export function useLongPressGesture({ crosshairActive, crosshairX }: Args) {
  const crosshairPan = Gesture.Pan()
    .activateAfterLongPress(DEFAULT_LONG_PRESS_MS)
    .averageTouches(false)
    .onStart((e) => {
      'worklet';
      crosshairActive.value = true;
      crosshairX.value = e.x;
    })
    .onUpdate((e) => {
      'worklet';
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

  return { crosshairPan };
}
