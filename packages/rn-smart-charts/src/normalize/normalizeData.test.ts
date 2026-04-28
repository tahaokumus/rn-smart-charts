import { describe, expect, it } from 'vitest';
import type { XAxis } from '../types/option';
import { normalizeData } from './normalizeData';

describe('normalizeData', () => {
  it('accepts {x, y}[] form with numeric x', () => {
    const r = normalizeData(
      [
        { x: 10, y: 1 },
        { x: 20, y: 2 },
      ],
      { type: 'value' },
    );
    expect(Array.from(r.xs)).toEqual([10, 20]);
    expect(Array.from(r.ys)).toEqual([1, 2]);
  });

  it('accepts {x, y}[] with Date x and converts to ms', () => {
    const d1 = new Date(2026, 0, 1);
    const d2 = new Date(2026, 1, 1);
    const r = normalizeData(
      [
        { x: d1, y: 10 },
        { x: d2, y: 20 },
      ],
      { type: 'time' },
    );
    expect(r.xs[0]).toBe(d1.getTime());
    expect(r.xs[1]).toBe(d2.getTime());
  });

  it('sorts by x ascending', () => {
    const r = normalizeData(
      [
        { x: 30, y: 3 },
        { x: 10, y: 1 },
        { x: 20, y: 2 },
      ],
      { type: 'value' },
    );
    expect(Array.from(r.xs)).toEqual([10, 20, 30]);
    expect(Array.from(r.ys)).toEqual([1, 2, 3]);
  });

  it('accepts parallel form with xAxis.data', () => {
    const xAxis: XAxis = { type: 'value', data: [100, 200, 300] };
    const r = normalizeData([10, 20, 30], xAxis);
    expect(Array.from(r.xs)).toEqual([100, 200, 300]);
    expect(Array.from(r.ys)).toEqual([10, 20, 30]);
  });

  it('throws when parallel form is missing xAxis.data', () => {
    expect(() => normalizeData([1, 2, 3], { type: 'value' })).toThrowError(/xAxis.data is missing/);
  });

  it('throws when parallel-form lengths do not match', () => {
    expect(() => normalizeData([1, 2, 3], { type: 'value', data: [10, 20] })).toThrowError(
      /length/,
    );
  });

  it('returns empty arrays for empty input', () => {
    const r = normalizeData([], { type: 'value' });
    expect(r.xs.length).toBe(0);
    expect(r.ys.length).toBe(0);
  });

  it('uses category index for category axis with string x', () => {
    const xAxis: XAxis = { type: 'category', data: ['Mon', 'Tue', 'Wed'] };
    const r = normalizeData([10, 20, 30], xAxis);
    expect(Array.from(r.xs)).toEqual([0, 1, 2]);
  });

  describe('medianDeltaX', () => {
    it('matches the median gap of regularly spaced data', () => {
      const r = normalizeData(
        [
          { x: 0, y: 0 },
          { x: 100, y: 1 },
          { x: 200, y: 2 },
          { x: 300, y: 3 },
        ],
        { type: 'value' },
      );
      expect(r.medianDeltaX).toBe(100);
    });

    it('picks the middle gap for irregular spacing', () => {
      // Gaps: 50, 100, 200 → sorted [50, 100, 200] → median 100
      const r = normalizeData(
        [
          { x: 0, y: 0 },
          { x: 50, y: 1 },
          { x: 150, y: 2 },
          { x: 350, y: 3 },
        ],
        { type: 'value' },
      );
      expect(r.medianDeltaX).toBe(100);
    });

    it('averages two middle gaps for an even number of deltas', () => {
      // 4 points → 3 gaps. To get an even number of gaps, use 5 points.
      // Gaps: 10, 20, 30, 40 → median = (20+30)/2 = 25
      const r = normalizeData(
        [
          { x: 0, y: 0 },
          { x: 10, y: 1 },
          { x: 30, y: 2 },
          { x: 60, y: 3 },
          { x: 100, y: 4 },
        ],
        { type: 'value' },
      );
      expect(r.medianDeltaX).toBe(25);
    });

    it('is undefined for fewer than 2 points', () => {
      const empty = normalizeData([], { type: 'value' });
      expect(empty.medianDeltaX).toBeUndefined();
      const single = normalizeData([{ x: 1, y: 1 }], { type: 'value' });
      expect(single.medianDeltaX).toBeUndefined();
    });

    it('is undefined when all points share the same x (no positive gaps)', () => {
      const r = normalizeData(
        [
          { x: 5, y: 0 },
          { x: 5, y: 1 },
        ],
        { type: 'value' },
      );
      expect(r.medianDeltaX).toBeUndefined();
    });
  });
});
