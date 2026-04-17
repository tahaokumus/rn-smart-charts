import type { TimeLevel, TimeTick } from '../math/scaleTime';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Default formatter for a single tick — no contextual awareness. */
export function formatTimeTick(value: number, level: TimeLevel): string {
  const d = new Date(value);
  switch (level) {
    case 'year':
      return `${d.getFullYear()}`;
    case 'month':
      return MONTHS[d.getMonth()] ?? '';
    case 'day':
      return `${MONTHS[d.getMonth()] ?? ''} ${d.getDate()}`;
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

/**
 * Contextual formatter — receives the full tick list and produces trading-style
 * labels where the higher unit is only shown when it changes:
 *
 *   day-level:  "Feb 3", "4", "5", "Mar 1", "2", "3", ...
 *   hour-level: "Feb 3 10:00", "12:00", "14:00", "Feb 4 00:00", ...
 *
 * Per-tick defaults to `formatTimeTick` when no previous tick has established
 * the higher unit.
 */
export function formatTimeTicksContextual(ticks: TimeTick[]): string[] {
  const out: string[] = [];
  let prevMonth = -1;
  let prevYear = -1;
  let prevDay = -1;

  for (const t of ticks) {
    const d = new Date(t.value);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    switch (t.level) {
      case 'year':
        out.push(`${year}`);
        break;
      case 'month':
        out.push(year !== prevYear ? `${MONTHS[month]} ${year}` : (MONTHS[month] ?? ''));
        break;
      case 'day':
        out.push(month !== prevMonth ? `${MONTHS[month] ?? ''} ${day}` : `${day}`);
        break;
      case 'hour':
        out.push(day !== prevDay ? `${MONTHS[month] ?? ''} ${day}` : `${pad2(d.getHours())}:00`);
        break;
      case 'minute':
        out.push(
          day !== prevDay
            ? `${MONTHS[month] ?? ''} ${day}`
            : `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
        );
        break;
      case 'second':
        out.push(`${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`);
        break;
      default:
        out.push(formatTimeTick(t.value, t.level));
    }
    prevYear = year;
    prevMonth = month;
    prevDay = day;
  }
  return out;
}
