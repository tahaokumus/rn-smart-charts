import { describe, expect, it } from 'vitest';
import { timeTicks } from './scaleTime';

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

  it('all ticks are within domain', () => {
    const start = new Date(2026, 2, 1).getTime();
    const end = new Date(2026, 8, 1).getTime();
    const ticks = timeTicks(start, end, 5);
    for (const t of ticks) {
      expect(t.value).toBeGreaterThanOrEqual(start);
      expect(t.value).toBeLessThanOrEqual(end);
    }
  });
});

// Silence unused warning: kept for documentation
void MS_YEAR;
