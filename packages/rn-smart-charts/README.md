# rn-smart-charts

React Native chart library built on Skia. ECharts-style declarative `option` API with TradingView-style pan & pinch-zoom on the UI thread.

## Install

```sh
pnpm add rn-smart-charts \
  @shopify/react-native-skia \
  react-native-reanimated \
  react-native-gesture-handler
```

> v1 is **Android only**. iOS code paths exist (the library is platform-agnostic) but iOS is not actively tested.

## Quick start

```tsx
import { Chart, type ChartOption } from 'rn-smart-charts';

const option: ChartOption = {
  xAxis: { type: 'time' },
  yAxis: { type: 'value' },
  series: [{
    type: 'area',
    smooth: true,
    data: [
      { x: new Date('2026-02-01'), y: 30 },
      { x: new Date('2026-03-01'), y: 42 },
      { x: new Date('2026-04-01'), y: 35 },
    ],
    lineStyle: { color: '#3B82F6', width: 2.5 },
    areaStyle: { color: '#3B82F6', opacity: 0.35 },
  }],
};

export default function Demo() {
  return <Chart option={option} style={{ width: '100%', height: 240 }} />;
}
```

## Imperative API

```tsx
const ref = useRef<ChartRef>(null);
ref.current?.zoomTo(start, end);
ref.current?.resetZoom();
ref.current?.panTo(now);
ref.current?.getViewport(); // { start, end }
```

## API reference

See [`src/types/option.ts`](src/types/option.ts) for the full `ChartOption` surface. The library is fully typed; let your IDE be the docs.

## License

MIT
