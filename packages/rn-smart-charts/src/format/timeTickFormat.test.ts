import { describe, expect, it } from 'vitest';
import type { TimeTick } from '../math/scaleTime';
import { formatTimeTicksContextual } from './timeTickFormat';

function dayTick(y: number, m: number, d: number): TimeTick {
  return { value: new Date(y, m, d).getTime(), level: 'day' };
}
function monthTick(y: number, m: number): TimeTick {
  return { value: new Date(y, m, 1).getTime(), level: 'month' };
}
function hourTick(y: number, m: number, d: number, h: number): TimeTick {
  return { value: new Date(y, m, d, h).getTime(), level: 'hour' };
}

describe('formatTimeTicksContextual', () => {
  it('day-level: month-boundary tick is replaced by month name and bold', () => {
    const ticks = [
      dayTick(2026, 5, 28), // Jun 28
      dayTick(2026, 5, 29),
      dayTick(2026, 5, 30),
      dayTick(2026, 6, 1), // Jul 1 — boundary
      dayTick(2026, 6, 2),
    ];
    const out = formatTimeTicksContextual(ticks);
    expect(out).toEqual([
      { label: '28', bold: false },
      { label: '29', bold: false },
      { label: '30', bold: false },
      { label: 'Jul', bold: true },
      { label: '2', bold: false },
    ]);
  });

  it('day-level: year boundary takes precedence over month and shows the year', () => {
    const ticks = [
      dayTick(2025, 11, 30), // Dec 30
      dayTick(2025, 11, 31), // Dec 31
      dayTick(2026, 0, 1), // Jan 1 — year + month both change
      dayTick(2026, 0, 2),
    ];
    const out = formatTimeTicksContextual(ticks);
    expect(out[2]).toEqual({ label: '2026', bold: true });
    expect(out[0]).toEqual({ label: '30', bold: false });
    expect(out[3]).toEqual({ label: '2', bold: false });
  });

  it('month-level: year-boundary replaces with bold year', () => {
    const ticks = [monthTick(2025, 10), monthTick(2025, 11), monthTick(2026, 0), monthTick(2026, 1)];
    const out = formatTimeTicksContextual(ticks);
    expect(out).toEqual([
      { label: 'Nov', bold: false },
      { label: 'Dec', bold: false },
      { label: '2026', bold: true },
      { label: 'Feb', bold: false },
    ]);
  });

  it('hour-level: day-boundary tick shows day number bold', () => {
    const ticks = [
      hourTick(2026, 6, 1, 18), // Jul 1 18:00 (first tick — not a boundary)
      hourTick(2026, 6, 2, 0), // Jul 2 00:00 — day boundary
      hourTick(2026, 6, 2, 6),
      hourTick(2026, 6, 2, 12),
    ];
    const out = formatTimeTicksContextual(ticks);
    expect(out[0]).toEqual({ label: '18:00', bold: false });
    expect(out[1]).toEqual({ label: '2', bold: true });
    expect(out[2]).toEqual({ label: '06:00', bold: false });
    expect(out[3]).toEqual({ label: '12:00', bold: false });
  });

  it('hour-level: month boundary outranks day boundary', () => {
    const ticks = [
      hourTick(2026, 5, 30, 18), // Jun 30 18:00
      hourTick(2026, 6, 1, 0), // Jul 1 00:00 — month + day both change → "Jul"
    ];
    const out = formatTimeTicksContextual(ticks);
    expect(out[1]).toEqual({ label: 'Jul', bold: true });
  });

  it('first tick is never marked as a boundary', () => {
    // Even if the first tick lands on Jan 1 of a new year, we have nothing
    // to compare against — render the primary unit, not bold.
    const ticks = [dayTick(2026, 0, 1), dayTick(2026, 0, 2)];
    const out = formatTimeTicksContextual(ticks);
    expect(out[0]?.bold).toBe(false);
    expect(out[0]?.label).toBe('1');
  });

  it('returns empty array for empty input', () => {
    expect(formatTimeTicksContextual([])).toEqual([]);
  });

  describe('locale', () => {
    // Helper: what Intl returns for "short" month name in a given locale.
    function intlMonth(locale: string, y: number, m: number): string {
      return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(y, m, 1));
    }

    it('uses device default month names when locale is omitted', () => {
      const ticks = [monthTick(2026, 5), monthTick(2026, 6)]; // Jun, Jul
      const out = formatTimeTicksContextual(ticks);
      // Equals what Intl produces for the runtime's default locale.
      expect(out[0]?.label).toBe(intlMonth(undefined as unknown as string, 2026, 5));
      expect(out[1]?.label).toBe(intlMonth(undefined as unknown as string, 2026, 6));
    });

    it('honors a Turkish locale at month-boundary on day-level zoom', () => {
      const ticks = [
        dayTick(2026, 5, 30), // Jun 30
        dayTick(2026, 6, 1), // Jul 1 — month boundary
        dayTick(2026, 6, 2),
      ];
      const out = formatTimeTicksContextual(ticks, 'tr-TR');
      expect(out[1]).toEqual({ label: intlMonth('tr-TR', 2026, 6), bold: true });
      // Sanity: Turkish "July" differs from English "Jul".
      expect(out[1]?.label).not.toBe('Jul');
    });

    it('honors a Japanese locale at month-level zoom', () => {
      const ticks = [monthTick(2026, 5), monthTick(2026, 6), monthTick(2026, 7)];
      const out = formatTimeTicksContextual(ticks, 'ja-JP');
      expect(out[0]?.label).toBe(intlMonth('ja-JP', 2026, 5));
      expect(out[1]?.label).toBe(intlMonth('ja-JP', 2026, 6));
      // Japanese short month conventionally includes 月 (e.g., "6月").
      expect(out[1]?.label).toContain('月');
    });

    it('caches Intl.DateTimeFormat per locale (idempotent across calls)', () => {
      const ticks = [monthTick(2026, 5), monthTick(2026, 6)];
      const a = formatTimeTicksContextual(ticks, 'tr-TR');
      const b = formatTimeTicksContextual(ticks, 'tr-TR');
      expect(a).toEqual(b);
    });
  });
});
