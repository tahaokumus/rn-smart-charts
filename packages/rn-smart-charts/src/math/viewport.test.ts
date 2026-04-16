import { describe, expect, it } from 'vitest';
import { indexRangeFor, yDomainFor } from './viewport';

describe('viewport', () => {
  describe('indexRangeFor', () => {
    const xs = [0, 10, 20, 30, 40, 50];

    it('returns full range when window covers everything', () => {
      const { i0, i1 } = indexRangeFor(xs, -10, 100);
      expect(i0).toBe(0);
      expect(i1).toBe(5);
    });

    it('expands by one neighbor on each side', () => {
      // window [15,35] contains values 20,30 (idx 2,3); we extend to include
      // 10 (idx 1) and 40 (idx 4) so the rendered path crosses the clip edges.
      const { i0, i1 } = indexRangeFor(xs, 15, 35);
      expect(i0).toBe(1);
      expect(i1).toBe(4);
    });

    it('collapses gracefully when window is past data', () => {
      const r = indexRangeFor(xs, 1000, 2000);
      expect(r.i0).toBeGreaterThanOrEqual(0);
      expect(r.i1).toBe(5);
    });

    it('returns empty range for empty input', () => {
      const r = indexRangeFor([], 0, 10);
      expect(r.i0).toBe(0);
      expect(r.i1).toBe(-1);
    });
  });

  describe('yDomainFor', () => {
    const ys = [10, 5, 20, 15, 25];

    it('finds min/max with padding', () => {
      const { yMin, yMax } = yDomainFor(ys, 0, 4, false);
      expect(yMin).toBeLessThan(5);
      expect(yMax).toBeGreaterThan(25);
    });

    it('includes zero when requested', () => {
      const { yMin } = yDomainFor([10, 20, 30], 0, 2, true);
      expect(yMin).toBeLessThanOrEqual(0);
    });

    it('handles flat input', () => {
      const { yMin, yMax } = yDomainFor([7, 7, 7], 0, 2, false);
      expect(yMin).toBeLessThan(7);
      expect(yMax).toBeGreaterThan(7);
    });

    it('handles empty range', () => {
      const r = yDomainFor(ys, 5, 4, false);
      expect(r.yMin).toBe(0);
      expect(r.yMax).toBe(1);
    });
  });
});
