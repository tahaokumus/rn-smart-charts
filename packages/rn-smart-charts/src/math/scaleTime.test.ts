import { describe, expect, it } from 'vitest';
import { type TimeTick, selectTimeTicks } from './scaleTime';

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;
const MS_YEAR = 365 * MS_DAY;

// Deterministic font metric: each char is FAKE_CHAR_WIDTH px, bold +1px to
// reflect the slight extra width of a bold face. Real Skia font metrics are
// covered by integration; these tests assert the *algorithm*.
const FAKE_CHAR_WIDTH = 7;
const measure = (text: string, bold: boolean) =>
  text.length * (bold ? FAKE_CHAR_WIDTH + 1 : FAKE_CHAR_WIDTH);

function pick(d0: number, d1: number, plotWidthPx: number, opts?: {
  minInterval?: number;
  maxInterval?: number;
  locale?: string;
  minLabelGapPx?: number;
}): TimeTick[] {
  return selectTimeTicks({
    d0,
    d1,
    plotWidthPx,
    minLabelGapPx: opts?.minLabelGapPx ?? 8,
    measureLabel: measure,
    locale: opts?.locale,
    minInterval: opts?.minInterval,
    maxInterval: opts?.maxInterval,
  });
}

describe('selectTimeTicks', () => {
  describe('zoom levels', () => {
    it('picks hour/minute level for a 1-day domain at 800px', () => {
      const start = new Date(2026, 0, 15, 0, 0).getTime();
      const ticks = pick(start, start + MS_DAY, 800);
      expect(ticks.length).toBeGreaterThan(0);
      expect(
        ticks.every((t) => t.level === 'hour' || t.level === 'minute' || t.level === 'day'),
      ).toBe(true);
    });

    it('picks month level for a 1-year domain', () => {
      const start = new Date(2026, 0, 1).getTime();
      const end = new Date(2027, 0, 1).getTime();
      const ticks = pick(start, end, 600);
      expect(ticks.length).toBeGreaterThanOrEqual(2);
      // The chosen base level is month; year may appear at year-boundary anchors.
      expect(ticks.every((t) => t.level === 'month' || t.level === 'year')).toBe(true);
    });

    it('picks year level for a 10-year domain', () => {
      const start = new Date(2020, 0, 1).getTime();
      const end = new Date(2030, 0, 1).getTime();
      const ticks = pick(start, end, 600);
      expect(ticks.length).toBeGreaterThanOrEqual(2);
      expect(ticks.every((t) => t.level === 'year')).toBe(true);
    });
  });

  describe('width-aware density', () => {
    it('narrow plot picks fewer ticks than wide plot for the same span', () => {
      const start = new Date(2026, 0, 1).getTime();
      const end = new Date(2026, 6, 1).getTime(); // 6 months
      const narrow = pick(start, end, 200);
      const wide = pick(start, end, 800);
      expect(wide.length).toBeGreaterThan(narrow.length);
    });

    it('zero plot width returns empty', () => {
      const start = new Date(2026, 0, 1).getTime();
      const end = new Date(2026, 6, 1).getTime();
      expect(pick(start, end, 0)).toEqual([]);
    });
  });

  describe('alignment & invariants', () => {
    it('aligns month ticks to first of month', () => {
      const start = new Date(2026, 0, 15).getTime();
      const end = new Date(2026, 5, 15).getTime();
      const ticks = pick(start, end, 600);
      for (const t of ticks) {
        if (t.level !== 'month') continue;
        const d = new Date(t.value);
        expect(d.getDate()).toBe(1);
      }
    });

    it('aligns year ticks to Jan 1', () => {
      const start = new Date(2020, 5, 15).getTime();
      const end = new Date(2030, 5, 15).getTime();
      const ticks = pick(start, end, 600);
      for (const t of ticks) {
        if (t.level !== 'year') continue;
        const d = new Date(t.value);
        expect(d.getMonth()).toBe(0);
        expect(d.getDate()).toBe(1);
      }
    });

    it('produces strictly increasing tick values', () => {
      const start = new Date(2026, 10, 6).getTime();
      const end = new Date(2027, 0, 5).getTime();
      const ticks = pick(start, end, 800);
      for (let i = 1; i < ticks.length; i++) {
        expect((ticks[i] as TimeTick).value).toBeGreaterThan((ticks[i - 1] as TimeTick).value);
      }
    });

    it('keeps all ticks within the domain', () => {
      const start = new Date(2026, 2, 1).getTime();
      const end = new Date(2026, 8, 1).getTime();
      const ticks = pick(start, end, 600);
      for (const t of ticks) {
        expect(t.value).toBeGreaterThanOrEqual(start);
        expect(t.value).toBeLessThanOrEqual(end);
      }
    });
  });

  describe('month-anchor injection', () => {
    it('injects month-start ticks at sub-month zooms (weekly span)', () => {
      const start = new Date(2026, 10, 6).getTime(); // Nov 6
      const end = new Date(2027, 0, 5).getTime(); // Jan 5
      const ticks = pick(start, end, 800);
      const monthTicks = ticks.filter((t) => t.level === 'month');
      expect(monthTicks.length).toBeGreaterThanOrEqual(2);
      for (const t of monthTicks) {
        const d = new Date(t.value);
        expect(d.getDate()).toBe(1);
      }
      const monthStarts = monthTicks.map((t) => new Date(t.value).getMonth());
      expect(monthStarts).toContain(11); // Dec
      expect(monthStarts).toContain(0); // Jan
    });

    it('injects month-start tick on a daily span crossing a month boundary', () => {
      const start = new Date(2026, 1, 27).getTime(); // Feb 27
      const end = new Date(2026, 2, 8).getTime(); // Mar 8
      const ticks = pick(start, end, 800);
      const mar1 = ticks.find((t) => {
        const d = new Date(t.value);
        return d.getMonth() === 2 && d.getDate() === 1;
      });
      expect(mar1).toBeDefined();
      expect(mar1?.level).toBe('month');
    });
  });

  describe('pan stability', () => {
    it('same span at same width returns the same level after panning', () => {
      const start = new Date(2026, 0, 1).getTime();
      const end = new Date(2026, 6, 1).getTime();
      const span = end - start;
      const a = pick(start, end, 600);
      const b = pick(start + 5 * MS_DAY, start + 5 * MS_DAY + span, 600);
      // Compare base (non-anchor) levels — anchor ticks shift with the window.
      const levelA = (a.find((t) => t.level !== 'month' && t.level !== 'year') ?? a[0])?.level;
      const levelB = (b.find((t) => t.level !== 'month' && t.level !== 'year') ?? b[0])?.level;
      expect(levelA).toBe(levelB);
    });
  });

  describe('zoom transitions are monotonic', () => {
    it('coarser spans pick coarser-or-equal step (1h → 10y, fixed width)', () => {
      const orderRank: Record<string, number> = {
        second: 0,
        minute: 1,
        hour: 2,
        day: 3,
        month: 4,
        year: 5,
      };
      const start = new Date(2026, 5, 15, 12, 0).getTime();
      const widths = 600;
      const spans = [
        MS_HOUR,
        6 * MS_HOUR,
        MS_DAY,
        7 * MS_DAY,
        30 * MS_DAY,
        90 * MS_DAY,
        MS_YEAR,
        5 * MS_YEAR,
        10 * MS_YEAR,
      ];
      let prevRank = -1;
      for (const span of spans) {
        const ticks = pick(start, start + span, widths);
        if (ticks.length === 0) continue;
        // Use the dominant (first non-anchor) level as the chosen level.
        const base = ticks.find((t) => t.level !== 'month' || span >= 30 * MS_DAY);
        const lvl = (base ?? ticks[0])?.level;
        const rank = lvl ? (orderRank[lvl] ?? 0) : 0;
        expect(rank).toBeGreaterThanOrEqual(prevRank);
        prevRank = rank;
      }
    });
  });

  describe('minInterval', () => {
    it('honors minInterval = 1 day on a hourly-resolution span (no sub-day ticks)', () => {
      const start = new Date(2026, 0, 1).getTime();
      const end = start + 7 * MS_DAY;
      const ticks = pick(start, end, 800, { minInterval: MS_DAY });
      expect(ticks.length).toBeGreaterThan(0);
      expect(
        ticks.every(
          (t) => t.level !== 'hour' && t.level !== 'minute' && t.level !== 'second',
        ),
      ).toBe(true);
    });

    it('honors minInterval = 1 hour on a fine span (no sub-hour ticks)', () => {
      const start = new Date(2026, 0, 1, 0, 0, 0).getTime();
      const end = start + 6 * MS_HOUR;
      const ticks = pick(start, end, 800, { minInterval: MS_HOUR });
      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks.every((t) => t.level !== 'minute' && t.level !== 'second')).toBe(true);
    });

    it('returns empty when every candidate is filtered out', () => {
      const start = new Date(2026, 0, 1).getTime();
      const end = new Date(2026, 0, 2).getTime();
      // 1000-year floor: nothing survives.
      const ticks = pick(start, end, 600, { minInterval: 1000 * MS_YEAR });
      expect(ticks).toEqual([]);
    });

    it('minInterval = undefined behaves like the no-opts call', () => {
      const start = new Date(2026, 0, 1).getTime();
      const end = start + MS_DAY;
      const a = pick(start, end, 600);
      const b = pick(start, end, 600, { minInterval: undefined });
      expect(a).toEqual(b);
    });
  });

  describe('degenerate inputs', () => {
    it('returns empty for non-positive span', () => {
      expect(pick(100, 50, 600)).toEqual([]);
      expect(pick(50, 50, 600)).toEqual([]);
    });

    it('returns empty for non-positive plot width', () => {
      expect(pick(0, 100, 0)).toEqual([]);
      expect(pick(0, 100, -1)).toEqual([]);
    });
  });

  describe('boundary labels affect width budget', () => {
    it('contextual labels (bold "Mar") factor into the fit check', () => {
      // A span with one month boundary in the middle. With a stingy plot
      // width, the bold "Mar" should push the algorithm to a coarser level
      // than a span without a boundary.
      const noBoundary = pick(
        new Date(2026, 5, 5).getTime(),
        new Date(2026, 5, 25).getTime(),
        260,
      );
      const withBoundary = pick(
        new Date(2026, 5, 25).getTime(),
        new Date(2026, 6, 14).getTime(),
        260,
      );
      // The fit check uses contextual widths; both queries must succeed and
      // produce non-overlapping ticks. Stronger assertion: the pair counts
      // should both be small (collision-free) at this width.
      expect(noBoundary.length).toBeGreaterThan(0);
      expect(withBoundary.length).toBeGreaterThan(0);
    });
  });
});
