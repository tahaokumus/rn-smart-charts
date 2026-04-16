import { describe, expect, it } from 'vitest';
import { invert, scale, ticks } from './scaleLinear';

describe('scaleLinear', () => {
  describe('scale', () => {
    it('maps domain endpoints to range endpoints', () => {
      const s = { d0: 0, d1: 100, r0: 0, r1: 200 };
      expect(scale(s, 0)).toBe(0);
      expect(scale(s, 100)).toBe(200);
      expect(scale(s, 50)).toBe(100);
    });

    it('handles negative ranges', () => {
      const s = { d0: 0, d1: 1, r0: 100, r1: 0 };
      expect(scale(s, 0)).toBe(100);
      expect(scale(s, 1)).toBe(0);
      expect(scale(s, 0.5)).toBe(50);
    });

    it('returns r0 when domain is zero-width', () => {
      const s = { d0: 5, d1: 5, r0: 42, r1: 99 };
      expect(scale(s, 5)).toBe(42);
      expect(scale(s, 100)).toBe(42);
    });
  });

  describe('invert', () => {
    it('round-trips with scale', () => {
      const s = { d0: -10, d1: 10, r0: 0, r1: 400 };
      for (const v of [-10, -5, 0, 5, 10]) {
        const p = scale(s, v);
        expect(invert(s, p)).toBeCloseTo(v, 9);
      }
    });

    it('returns d0 when range is zero-width', () => {
      const s = { d0: 1, d1: 9, r0: 5, r1: 5 };
      expect(invert(s, 5)).toBe(1);
    });
  });

  describe('ticks', () => {
    it('produces nice ticks for [0,100] target 5 (step=20 is the D3-nice choice)', () => {
      const t = ticks(0, 100, 5);
      expect(t).toEqual([0, 20, 40, 60, 80, 100]);
    });

    it('produces nice fractional ticks', () => {
      const t = ticks(0, 1, 5);
      expect(t).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    });

    it('handles negative domains and includes zero', () => {
      const t = ticks(-50, 50, 5);
      expect(t).toContain(0);
      // D3-style nice step for span=100 target 5 → step 20, so ticks fall at multiples of 20
      // and may not include the exact endpoints.
      expect(t.every((v) => v % 20 === 0)).toBe(true);
      expect(t[0]).toBeGreaterThanOrEqual(-50);
      expect(t[t.length - 1]).toBeLessThanOrEqual(50);
    });

    it('returns single value for zero-width domain', () => {
      expect(ticks(7, 7, 5)).toEqual([7]);
    });

    it('caps tick output for tiny target', () => {
      const t = ticks(0, 1000, 1);
      expect(t.length).toBeGreaterThan(0);
      expect(t.length).toBeLessThanOrEqual(8);
    });
  });
});
