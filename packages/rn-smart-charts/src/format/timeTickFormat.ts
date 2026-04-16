import type { TimeLevel } from '../math/scaleTime';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Default formatter for a time tick value at a given level. */
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
