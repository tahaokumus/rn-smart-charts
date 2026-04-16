# rn-smart-charts

A React Native chart library built on [@shopify/react-native-skia](https://shopify.github.io/react-native-skia/), [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/), and [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/). Configuration API inspired by [Apache ECharts](https://echarts.apache.org/).

**v1 ships:**

- A single area chart (`series.type: 'area'`) with stroke + vertical gradient fill.
- ECharts-style declarative `option` config with full TypeScript types.
- Time / value / category x-axis with auto-tick generation.
- TradingView-style **horizontal pinch-zoom** anchored to the right edge.
- **Pan** with `withDecay` inertia and hard clamp at data edges.
- **Long-press crosshair** with sliding tooltip bubble.
- Imperative ref API: `chartRef.zoomTo(start, end)`, `.resetZoom()`, `.panTo(x)`, `.getViewport()`.
- Path morphing animation when the data prop changes.
- LTTB downsampling for large datasets.

**v1 platform:** Android only (iOS deferred — code is platform-agnostic).

## Layout

This is a pnpm monorepo:

```
packages/rn-smart-charts/   # the publishable library
apps/example/               # Expo SDK 53 dev-client demo app
```

## Getting started

```sh
pnpm install
pnpm lib:test              # run the math/normalize unit tests
pnpm example:android       # build & run the example app on a connected Android device
```

See [packages/rn-smart-charts/README.md](packages/rn-smart-charts/README.md) for the public API.

## License

MIT — see [LICENSE](LICENSE).
