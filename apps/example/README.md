# rn-smart-charts example app

Expo SDK 53 dev-client app showcasing every screen the library supports.

## Run on Android

```sh
# from the monorepo root
pnpm install
cd apps/example

# generate native android/ folder (one-time, regenerates on changes)
pnpm prebuild

# build + install dev client + start Metro
pnpm android
```

`pnpm prebuild` runs `expo prebuild --platform android --clean` and writes a fresh `android/` directory (gitignored). After the first build, `pnpm start` is enough to relaunch Metro against the installed dev client.

## Screens

- **Basic Area** — linear segments + pan/pinch baseline
- **Smooth Gradient** — matches the reference screenshots
- **Live Updating** — synthetic ticker every 500ms + path morphing + `panTo(now)`
- **Imperative Zoom** — buttons drive `chartRef.zoomTo` / `resetZoom`
- **Custom Tooltip** — Turkish month labels + `kg` tooltip formatter

## Notes

- Requires a custom dev client (Skia + Reanimated do not run in Expo Go).
- iOS is not configured for v1 (Android-only target).
