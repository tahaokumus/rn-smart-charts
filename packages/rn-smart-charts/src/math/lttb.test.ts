import { describe, expect, it } from 'vitest';
import { lttb } from './lttb';

describe('lttb', () => {
  it('returns input unchanged when threshold >= count', () => {
    const xs = [0, 1, 2, 3, 4];
    const ys = [10, 20, 30, 40, 50];
    const r = lttb(xs, ys, xs.length, 10);
    expect(Array.from(r.xs)).toEqual(xs);
    expect(Array.from(r.ys)).toEqual(ys);
  });

  it('downsamples to exactly `threshold` points', () => {
    const n = 1000;
    const xs = new Float32Array(n);
    const ys = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      xs[i] = i;
      ys[i] = Math.sin(i / 20) * 10;
    }
    const r = lttb(xs, ys, n, 100);
    expect(r.xs.length).toBe(100);
    expect(r.ys.length).toBe(100);
  });

  it('preserves first and last points exactly', () => {
    const n = 500;
    const xs = new Float32Array(n);
    const ys = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      xs[i] = i * 2;
      ys[i] = i * 3;
    }
    const r = lttb(xs, ys, n, 50);
    expect(r.xs[0]).toBe(xs[0]);
    expect(r.ys[0]).toBe(ys[0]);
    expect(r.xs[r.xs.length - 1]).toBe(xs[n - 1]);
    expect(r.ys[r.ys.length - 1]).toBe(ys[n - 1]);
  });

  it('preserves a sharp peak in the middle', () => {
    const n = 1000;
    const xs = new Float32Array(n);
    const ys = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      xs[i] = i;
      ys[i] = i === 500 ? 1000 : 0; // single sharp spike
    }
    const r = lttb(xs, ys, n, 50);
    let maxY = 0;
    for (const y of r.ys) {
      if (y > maxY) maxY = y;
    }
    expect(maxY).toBe(1000);
  });

  it('returns x in ascending order', () => {
    const n = 600;
    const xs = new Float32Array(n);
    const ys = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      xs[i] = i;
      ys[i] = Math.random();
    }
    const r = lttb(xs, ys, n, 80);
    for (let i = 1; i < r.xs.length; i++) {
      expect(r.xs[i]).toBeGreaterThanOrEqual(r.xs[i - 1] as number);
    }
  });
});
