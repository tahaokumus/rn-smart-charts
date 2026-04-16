import type { DataPoint } from 'rn-smart-charts';

/**
 * Generates a synthetic price-like time series. Pure function — same input
 * always yields the same output, so screens are deterministic across reloads.
 */
export function makeSeries(opts: {
  start: Date;
  end: Date;
  intervalMs: number;
  baseY?: number;
  amplitude?: number;
  noise?: number;
  seed?: number;
}): DataPoint[] {
  const baseY = opts.baseY ?? 50;
  const amplitude = opts.amplitude ?? 15;
  const noise = opts.noise ?? 1;
  let seed = opts.seed ?? 1234;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const out: DataPoint[] = [];
  const span = opts.end.getTime() - opts.start.getTime();
  let t = opts.start.getTime();
  let _i = 0;
  while (t <= opts.end.getTime()) {
    const phase = (t - opts.start.getTime()) / span;
    const wave = Math.sin(phase * Math.PI * 4) * amplitude;
    const drift = phase * amplitude * 0.5;
    const jitter = (rand() - 0.5) * noise;
    out.push({ x: t, y: baseY + wave + drift + jitter });
    t += opts.intervalMs;
    _i++;
  }
  return out;
}

const MS_DAY = 24 * 60 * 60 * 1000;

export const sampleSmall = makeSeries({
  start: new Date(2026, 1, 1),
  end: new Date(2026, 6, 30),
  intervalMs: MS_DAY,
  baseY: 28,
  amplitude: 12,
  noise: 2,
});

export const sampleLarge = makeSeries({
  start: new Date(2024, 0, 1),
  end: new Date(2026, 3, 16),
  intervalMs: 60 * 60 * 1000, // hourly → ~20k points
  baseY: 150,
  amplitude: 40,
  noise: 6,
  seed: 9876,
});
