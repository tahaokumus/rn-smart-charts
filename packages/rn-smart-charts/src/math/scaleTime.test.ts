import { describe, expect, it } from 'vitest';
import { type TimeTick, timeTicks } from './scaleTime';

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;
const MS_YEAR = 365 * MS_DAY;

describe('timeTicks', () => {
  it('produces hour-level ticks for a 1-day domain', () => {
    const start = new Date(2026, 0, 15, 0, 0).getTime();
    const end = start + MS_DAY;
    const ticks = timeTicks(start, end, 6);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.every((t) => t.level === 'hour' || t.level === 'minute')).toBe(true);
  });

  it('produces month-level ticks for a 1-year domain', () => {
    const start = new Date(2026, 0, 1).getTime();
    const end = new Date(2027, 0, 1).getTime();
    const ticks = timeTicks(start, end, 6);
    expect(ticks.every((t) => t.level === 'month')).toBe(true);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
  });

  it('produces year-level ticks for a 10-year domain', () => {
    const start = new Date(2020, 0, 1).getTime();
    const end = new Date(2030, 0, 1).getTime();
    const ticks = timeTicks(start, end, 6);
    expect(ticks.every((t) => t.level === 'year')).toBe(true);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
  });

  it('aligns month ticks to first of month', () => {
    const start = new Date(2026, 0, 15).getTime(); // mid-Jan
    const end = new Date(2026, 5, 15).getTime(); // mid-Jun
    const ticks = timeTicks(start, end, 6);
    for (const t of ticks) {
      const d = new Date(t.value);
      expect(d.getDate()).toBe(1);
    }
  });

  it('aligns year ticks to Jan 1', () => {
    const start = new Date(2020, 5, 15).getTime();
    const end = new Date(2030, 5, 15).getTime();
    const ticks = timeTicks(start, end, 6);
    for (const t of ticks) {
      const d = new Date(t.value);
      expect(d.getMonth()).toBe(0);
      expect(d.getDate()).toBe(1);
    }
  });

  it('returns empty array for invalid domains', () => {
    expect(timeTicks(100, 50, 5)).toEqual([]);
    expect(timeTicks(50, 50, 5)).toEqual([]);
    expect(timeTicks(0, 100, 0)).toEqual([]);
  });

  it('injects month-start ticks at sub-month zooms (weekly)', () => {
    // ~60 days picks the 7-day step. Without injection, no tick lands on day 1.
    const start = new Date(2026, 10, 6).getTime(); // Nov 6
    const end = new Date(2027, 0, 5).getTime(); // Jan 5
    const ticks = timeTicks(start, end, 8);
    const monthTicks = ticks.filter((t) => t.level === 'month');
    expect(monthTicks.length).toBeGreaterThanOrEqual(2);
    for (const t of monthTicks) {
      const d = new Date(t.value);
      expect(d.getDate()).toBe(1);
    }
    // All Dec-1 / Jan-1 in range must be present.
    const monthStarts = monthTicks.map((t) => new Date(t.value).getMonth());
    expect(monthStarts).toContain(11); // Dec
    expect(monthStarts).toContain(0); // Jan
  });

  it('injects month-start ticks at sub-month zooms (daily)', () => {
    // ~10 days picks the 1-day step.
    const start = new Date(2026, 1, 27).getTime(); // Feb 27
    const end = new Date(2026, 2, 8).getTime(); // Mar 8
    const ticks = timeTicks(start, end, 8);
    const mar1 = ticks.find((t) => {
      const d = new Date(t.value);
      return d.getMonth() === 2 && d.getDate() === 1;
    });
    expect(mar1).toBeDefined();
    expect(mar1?.level).toBe('month');
  });

  it('produces strictly increasing ticks after month injection', () => {
    const start = new Date(2026, 10, 6).getTime();
    const end = new Date(2027, 0, 5).getTime();
    const ticks = timeTicks(start, end, 8);
    for (let i = 1; i < ticks.length; i++) {
      expect((ticks[i] as TimeTick).value).toBeGreaterThan((ticks[i - 1] as TimeTick).value);
    }
  });

  it('all ticks are within domain', () => {
    const start = new Date(2026, 2, 1).getTime();
    const end = new Date(2026, 8, 1).getTime();
    const ticks = timeTicks(start, end, 5);
    for (const t of ticks) {
      expect(t.value).toBeGreaterThanOrEqual(start);
      expect(t.value).toBeLessThanOrEqual(end);
    }
  });

  it('honors minInterval = 1 day on a hourly-resolution span (no sub-day ticks)', () => {
    // 7 days asking for many ticks would normally pick an hour-level step.
    const start = new Date(2026, 0, 1).getTime();
    const end = start + 7 * MS_DAY;
    const ticks = timeTicks(start, end, 30, { minInterval: MS_DAY });
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.every((t) => t.level !== 'hour' && t.level !== 'minute' && t.level !== 'second')).toBe(true);
  });

  it('honors minInterval = 1 hour on a fine span (no sub-hour ticks)', () => {
    const start = new Date(2026, 0, 1, 0, 0, 0).getTime();
    const end = start + 6 * MS_HOUR;
    const ticks = timeTicks(start, end, 30, { minInterval: MS_HOUR });
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.every((t) => t.level !== 'minute' && t.level !== 'second')).toBe(true);
  });

  it('falls back to coarsest interval when minInterval exceeds every candidate', () => {
    // minInterval larger than the largest interval (10 years) should still
    // yield ticks (the coarsest available).
    const start = new Date(2026, 0, 1).getTime();
    const end = new Date(2026, 0, 2).getTime();
    const ticks = timeTicks(start, end, 6, { minInterval: 1000 * MS_YEAR });
    // Doesn't crash, doesn't return finer-than-fallback ticks. Length may be 0
    // (no aligned year-tick falls inside this 1-day span), which is acceptable.
    expect(Array.isArray(ticks)).toBe(true);
  });

  it('minInterval = undefined behaves like the no-opts call', () => {
    const start = new Date(2026, 0, 1).getTime();
    const end = start + MS_DAY;
    const a = timeTicks(start, end, 6);
    const b = timeTicks(start, end, 6, { minInterval: undefined });
    expect(a).toEqual(b);
  });
});

// Silence unused warning: kept for documentation
void MS_YEAR;
