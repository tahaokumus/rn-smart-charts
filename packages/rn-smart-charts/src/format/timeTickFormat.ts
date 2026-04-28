import type { TimeLevel, TimeTick } from '../math/scaleTime';

const FALLBACK_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const HAS_INTL = typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function';

const monthFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getMonthName(d: Date, locale: string | undefined): string {
  if (!HAS_INTL) return FALLBACK_MONTHS[d.getMonth()] ?? '';
  const key = locale ?? '';
  let f = monthFormatterCache.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(locale, { month: 'short' });
    } catch {
      return FALLBACK_MONTHS[d.getMonth()] ?? '';
    }
    monthFormatterCache.set(key, f);
  }
  return f.format(d);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Default formatter for a single tick — no contextual awareness. */
export function formatTimeTick(value: number, level: TimeLevel, locale?: string): string {
  const d = new Date(value);
  switch (level) {
    case 'year':
      return `${d.getFullYear()}`;
    case 'month':
      return getMonthName(d, locale);
    case 'day':
      return `${getMonthName(d, locale)} ${d.getDate()}`;
    case 'hour':
      return `${pad2(d.getHours())}:00`;
    case 'minute':
      return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    case 'second':
      return `${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    default:
      return d.toISOString();
  }
}

export interface ContextualLabel {
  label: string;
  /** True for boundary ticks where the bigger unit replaces the primary label. */
  bold: boolean;
}

/**
 * ECharts-style boundary-replacement formatter.
 *
 * At every tick where the next-bigger calendar unit changes (first day of a
 * month, midnight of a day, etc), the primary label is *replaced* by the
 * bigger unit and marked bold. So a daily-zoom axis reads:
 *   28 · 29 · 30 · **Jul** · 2 · 3 · 4
 * and an hourly-zoom axis reads:
 *   18:00 · **Jul** · 06:00 · 12:00 · 18:00 · **2** · 06:00 · ...
 *
 * Year-boundary takes precedence over month-boundary (e.g. Jan 1 of a new
 * year shows the year, not "Jan").
 *
 * Month names honor `locale` via Intl.DateTimeFormat; if omitted, the device's
 * default locale is used. Year/day/hour numbers stay plain to keep chart
 * labels short and predictable.
 */
export function formatTimeTicksContextual(
  ticks: TimeTick[],
  locale?: string,
): ContextualLabel[] {
  const out: ContextualLabel[] = [];
  let prevYear = 0;
  let prevMonth = 0;
  let prevDay = 0;
  let prevHour = 0;

  for (let i = 0; i < ticks.length; i++) {
    const t = ticks[i] as TimeTick;
    const d = new Date(t.value);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const hour = d.getHours();
    // First tick has no predecessor, so it's never a boundary — render the
    // primary unit. Subsequent ticks compare against the previous tick.
    const flags: BoundaryFlags =
      i === 0
        ? { yearChanged: false, monthChanged: false, dayChanged: false, hourChanged: false }
        : {
            yearChanged: year !== prevYear,
            monthChanged: month !== prevMonth,
            dayChanged: day !== prevDay,
            hourChanged: hour !== prevHour,
          };

    out.push(boundaryLabel(t.level, d, flags, locale));

    prevYear = year;
    prevMonth = month;
    prevDay = day;
    prevHour = hour;
  }
  return out;
}

interface BoundaryFlags {
  yearChanged: boolean;
  monthChanged: boolean;
  dayChanged: boolean;
  hourChanged: boolean;
}

function boundaryLabel(
  level: TimeLevel,
  d: Date,
  b: BoundaryFlags,
  locale: string | undefined,
): ContextualLabel {
  const year = d.getFullYear();
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();

  switch (level) {
    case 'year':
      return { label: `${year}`, bold: false };

    case 'month':
      if (b.yearChanged) return { label: `${year}`, bold: true };
      return { label: getMonthName(d, locale), bold: false };

    case 'day':
      if (b.yearChanged) return { label: `${year}`, bold: true };
      if (b.monthChanged) return { label: getMonthName(d, locale), bold: true };
      return { label: `${day}`, bold: false };

    case 'hour':
      if (b.yearChanged) return { label: `${year}`, bold: true };
      if (b.monthChanged) return { label: getMonthName(d, locale), bold: true };
      if (b.dayChanged) return { label: `${day}`, bold: true };
      return { label: `${pad2(hour)}:00`, bold: false };

    case 'minute':
      if (b.yearChanged) return { label: `${year}`, bold: true };
      if (b.monthChanged) return { label: getMonthName(d, locale), bold: true };
      if (b.dayChanged) return { label: `${day}`, bold: true };
      return { label: `${pad2(hour)}:${pad2(minute)}`, bold: false };

    case 'second':
      if (b.dayChanged) return { label: `${day}`, bold: true };
      if (b.hourChanged) return { label: `${pad2(hour)}:00`, bold: true };
      return { label: `${pad2(minute)}:${pad2(second)}`, bold: false };

    default:
      return { label: formatTimeTick(d.getTime(), level, locale), bold: false };
  }
}
