/**
 * Time scale helpers. Domain values are milliseconds since epoch.
 */

const MS_SECOND = 1000;
const MS_MINUTE = 60 * MS_SECOND;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;
const _MS_WEEK = 7 * MS_DAY;
// Approximate; only used to choose the *level*, not for tick alignment.
const MS_MONTH = 30 * MS_DAY;
const MS_YEAR = 365 * MS_DAY;

export type TimeLevel = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

export interface TimeTick {
  value: number;
  level: TimeLevel;
}

export interface TimeTicksOptions {
  /** Drop interval candidates whose step is finer than this (ms). */
  minInterval?: number;
}

/**
 * Generate "nice" tick instants spanning [d0, d1] aiming for ~targetCount ticks.
 * The returned ticks are aligned to natural calendar boundaries (year start,
 * month start, midnight, hour, etc.) so labels read intuitively.
 */
export function timeTicks(
  d0: number,
  d1: number,
  targetCount: number,
  opts?: TimeTicksOptions,
): TimeTick[] {
  if (d1 <= d0 || targetCount <= 0) return [];
  const span = d1 - d0;
  const target = Math.max(1, targetCount);
  const rough = span / target;

  // Pick the unit and step that produces the closest tick count to target.
  const allIntervals: Array<{ level: TimeLevel; ms: number }> = [
    { level: 'second', ms: 1 * MS_SECOND },
    { level: 'second', ms: 5 * MS_SECOND },
    { level: 'second', ms: 15 * MS_SECOND },
    { level: 'second', ms: 30 * MS_SECOND },
    { level: 'minute', ms: 1 * MS_MINUTE },
    { level: 'minute', ms: 5 * MS_MINUTE },
    { level: 'minute', ms: 15 * MS_MINUTE },
    { level: 'minute', ms: 30 * MS_MINUTE },
    { level: 'hour', ms: 1 * MS_HOUR },
    { level: 'hour', ms: 3 * MS_HOUR },
    { level: 'hour', ms: 6 * MS_HOUR },
    { level: 'hour', ms: 12 * MS_HOUR },
    { level: 'day', ms: 1 * MS_DAY },
    { level: 'day', ms: 7 * MS_DAY }, // week as a "day-level" tick
    { level: 'month', ms: 1 * MS_MONTH },
    { level: 'month', ms: 3 * MS_MONTH },
    { level: 'month', ms: 6 * MS_MONTH },
    { level: 'year', ms: 1 * MS_YEAR },
    { level: 'year', ms: 5 * MS_YEAR },
    { level: 'year', ms: 10 * MS_YEAR },
  ];

  // Apply the granularity floor: drop candidates strictly finer than minInterval.
  // If everything was filtered out, keep the coarsest (largest) entry from the
  // original list so we always produce something.
  const minInterval = opts?.minInterval ?? 0;
  let intervals = allIntervals.filter((it) => it.ms >= minInterval);
  if (intervals.length === 0) {
    intervals = [allIntervals[allIntervals.length - 1] as { level: TimeLevel; ms: number }];
  }

  let chosen = intervals[0] as { level: TimeLevel; ms: number };
  let bestDelta = Math.abs(rough - chosen.ms);
  for (let i = 1; i < intervals.length; i++) {
    const it = intervals[i] as { level: TimeLevel; ms: number };
    const delta = Math.abs(rough - it.ms);
    if (delta < bestDelta) {
      chosen = it;
      bestDelta = delta;
    }
  }

  const base = alignedTicks(d0, d1, chosen.level, chosen.ms);

  // For sub-month zooms, also include every month-start within range so the
  // month label is always anchored on day-1 regardless of how the auto-step
  // lands. Dedupe ticks that fall within half a step of each other; prefer
  // the month tick so the calendar anchor wins.
  if (chosen.level !== 'day' && chosen.level !== 'hour' && chosen.level !== 'minute' && chosen.level !== 'second') {
    return base;
  }

  const months: TimeTick[] = [];
  let cur = startOfMonth(d0);
  while (cur < d0) cur = addMonths(cur, 1);
  while (cur <= d1) {
    months.push({ value: cur, level: 'month' });
    cur = addMonths(cur, 1);
  }
  if (months.length === 0) return base;

  const merged = [...base, ...months].sort((a, b) => a.value - b.value);
  const out: TimeTick[] = [];
  const minGap = chosen.ms * 0.5;
  for (const t of merged) {
    const last = out[out.length - 1];
    if (last && Math.abs(t.value - last.value) < minGap) {
      if (t.level === 'month') out[out.length - 1] = t;
      continue;
    }
    out.push(t);
  }
  return out;
}

function alignedTicks(d0: number, d1: number, level: TimeLevel, stepMs: number): TimeTick[] {
  const out: TimeTick[] = [];
  if (level === 'month') {
    const months = Math.max(1, Math.round(stepMs / MS_MONTH));
    let cur = startOfMonth(d0);
    while (cur < d0) cur = addMonths(cur, 1);
    while (cur <= d1) {
      out.push({ value: cur, level });
      cur = addMonths(cur, months);
    }
    return out;
  }
  if (level === 'year') {
    const years = Math.max(1, Math.round(stepMs / MS_YEAR));
    let cur = startOfYear(d0);
    while (cur < d0) cur = addYears(cur, 1);
    while (cur <= d1) {
      out.push({ value: cur, level });
      cur = addYears(cur, years);
    }
    return out;
  }
  // For day/hour/minute/second we can align by ms math against epoch + local TZ offset.
  // We align to local-time boundaries (e.g. midnight in the device's TZ) by using
  // a per-tick Date conversion.
  const tzOffsetMinAtD0 = new Date(d0).getTimezoneOffset();
  const tzOffsetMs = tzOffsetMinAtD0 * MS_MINUTE;
  // Align the start to the nearest stepMs boundary in local time.
  const alignedStart = Math.ceil((d0 - tzOffsetMs * 0 + tzOffsetMs) / stepMs) * stepMs - tzOffsetMs;
  for (let v = alignedStart; v <= d1; v += stepMs) {
    if (v >= d0) out.push({ value: v, level });
  }
  return out;
}

function startOfMonth(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
function addMonths(ms: number, n: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime();
}
function startOfYear(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), 0, 1).getTime();
}
function addYears(ms: number, n: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear() + n, 0, 1).getTime();
}
