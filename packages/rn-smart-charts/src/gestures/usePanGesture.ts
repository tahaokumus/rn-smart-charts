import { Gesture } from 'react-native-gesture-handler';
import { type SharedValue, cancelAnimation, withDecay } from 'react-native-reanimated';
import { DEFAULT_DECAY_DECELERATION } from '../constants';

interface Args {
  xStart: SharedValue<number>;
  xEnd: SharedValue<number>;
  panStartXStart: SharedValue<number>;
  panStartXEnd: SharedValue<number>;
  interacting: SharedValue<boolean>;
  /** Plot width in px — read on the UI thread inside the gesture. */
  plotW: SharedValue<number>;
  dataMinX: number;
  dataMaxX: number;
}

export function usePanGesture({
  xStart,
  xEnd,
  panStartXStart,
  panStartXEnd,
  interacting,
  plotW,
  dataMinX,
  dataMaxX,
}: Args) {
  return Gesture.Pan()
    // Single-finger only — a 2-finger gesture belongs to the pinch.
    .minPointers(1)
    .maxPointers(1)
    .onBegin(() => {
      'worklet';
      cancelAnimation(xStart);
      cancelAnimation(xEnd);
      panStartXStart.value = xStart.value;
      panStartXEnd.value = xEnd.value;
      interacting.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      const span = panStartXEnd.value - panStartXStart.value;
      const dxData = (-e.translationX * span) / Math.max(1, plotW.value);
      let s = panStartXStart.value + dxData;
      let en = panStartXEnd.value + dxData;
      // Hard clamp at data edges (no rubber band).
      if (s < dataMinX) {
        en += dataMinX - s;
        s = dataMinX;
      }
      if (en > dataMaxX) {
        s -= en - dataMaxX;
        en = dataMaxX;
      }
      xStart.value = s;
      xEnd.value = en;
    })
    .onEnd((e) => {
      'worklet';
      const span = xEnd.value - xStart.value;
      const velocityData = (-e.velocityX * span) / Math.max(1, plotW.value);
      xStart.value = withDecay({
        velocity: velocityData,
        clamp: [dataMinX, dataMaxX - span],
        deceleration: DEFAULT_DECAY_DECELERATION,
      });
      xEnd.value = withDecay({
        velocity: velocityData,
        clamp: [dataMinX + span, dataMaxX],
        deceleration: DEFAULT_DECAY_DECELERATION,
      });
      interacting.value = false;
    })
    .onFinalize(() => {
      'worklet';
      interacting.value = false;
    });
}
