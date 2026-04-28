/**
 * Time scale helpers. Domain values are milliseconds since epoch.
 */

import { formatTimeTicksContextual } from '../format/timeTickFormat';

const MS_SECOND = 1000;
const MS_MINUTE = 60 * MS_SECOND;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;
// Approximate; only used to *rank* candidate levels, never for tick alignment.
// Real calendar math (startOfMonth/startOfYear) handles tick positions.
const MS_MONTH = 30 * MS_DAY;
const MS_YEAR = 365 * MS_DAY;

export type TimeLevel = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

export interface TimeTick {
  value: number;
  level: TimeLevel;
}

export interface ScaleLevel {
  level: TimeLevel;
  ms: number;
}

/**
 * Densified ladder of candidate (level, step) pairs sorted ascending by ms.
 * Walked finest → coarsest by `selectTimeTicks` until the labels fit.
 */
export const TIME_SCALE_LEVELS: ScaleLevel[] = [
  { level: 'second', ms: 1 * MS_SECOND },
  { level: 'second', ms: 5 * MS_SECOND },
  { level: 'second', ms: 15 * MS_SECOND },
  { level: 'second', ms: 30 * MS_SECOND },
  { level: 'minute', ms: 1 * MS_MINUTE },
  { level: 'minute', ms: 5 * MS_MINUTE },
  { level: 'minute', ms: 15 * MS_MINUTE },
  { level: 'minute', ms: 30 * MS_MINUTE },
  { level: 'hour', ms: 1 * MS_HOUR },
  { level: 'hour', ms: 2 * MS_HOUR },
  { level: 'hour', ms: 3 * MS_HOUR },
  { level: 'hour', ms: 6 * MS_HOUR },
  { level: 'hour', ms: 12 * MS_HOUR },
  { level: 'day', ms: 1 * MS_DAY },
  { level: 'day', ms: 2 * MS_DAY },
  { level: 'day', ms: 3 * MS_DAY },
  { level: 'day', ms: 5 * MS_DAY },
  { level: 'day', ms: 7 * MS_DAY },
  { level: 'day', ms: 14 * MS_DAY },
  { level: 'month', ms: 1 * MS_MONTH },
  { level: 'month', ms: 2 * MS_MONTH },
  { level: 'month', ms: 3 * MS_MONTH },
  { level: 'month', ms: 6 * MS_MONTH },
  { level: 'year', ms: 1 * MS_YEAR },
  { level: 'year', ms: 2 * MS_YEAR },
  { level: 'year', ms: 5 * MS_YEAR },
  { level: 'year', ms: 10 * MS_YEAR },
];

export interface SelectTimeTicksParams {
  d0: number;
  d1: number;
  plotWidthPx: number;
  /** Minimum pixel gap between adjacent labels. */
  minLabelGapPx: number;
  /** Width in px of a label string at the rendered font. Caller injects font metric. */
  measureLabel: (text: string, bold: boolean) => number;
  /** BCP-47 locale for contextual labels (matches xAxis.locale). */
  locale?: string;
  /** Drop candidates whose step is finer than this (ms). */
  minInterval?: number;
  /** Drop candidates whose step is coarser than this (ms). */
  maxInterval?: number;
}

/**
 * Width-aware tick selection. Walks {@link TIME_SCALE_LEVELS} finest →
 * coarsest and returns the first level whose contextual labels fit the plot
 * width without overlap. Same code path handles narrow phones (auto-thin) and
 * wide tablets (auto-densify).
 */
/**
 * Minimum pixels per tick to bother generating. Any level finer than this
 * cannot fit a label and would waste cycles (and risk OOM at large spans
 * with second-level candidates) before `fits` rejects it.
 */
const MIN_PX_PER_TICK = 2;

export function selectTimeTicks(p: SelectTimeTicksParams): TimeTick[] {
  if (p.d1 <= p.d0 || p.plotWidthPx <= 0) return [];
  const minMs = p.minInterval ?? 0;
  const maxMs = p.maxInterval ?? Number.POSITIVE_INFINITY;
  const pxPerMs = p.plotWidthPx / (p.d1 - p.d0);
  // Pre-filter: bound by [minInterval, maxInterval] AND by a pixel floor —
  // levels whose step is sub-pixel can never carry labels.
  const minStepMs = MIN_PX_PER_TICK / pxPerMs;
  const candidates = TIME_SCALE_LEVELS.filter(
    (lv) => lv.ms >= Math.max(minMs, minStepMs) && lv.ms <= maxMs,
  );
  if (candidates.length === 0) return [];

  let lastNonEmpty: TimeTick[] = [];

  for (const lv of candidates) {
    const base = alignedTicks(p.d0, p.d1, lv.level, lv.ms);
    if (base.length === 0) continue;
    const ticks = mergeMonthAnchors(base, lv.level, lv.ms, p.d0, p.d1);
    lastNonEmpty = ticks;
    if (fits(ticks, pxPerMs, p)) {
      return hideOverlapping(ticks, pxPerMs, p);
    }
  }
  // Coarsest didn't fit either — drop overlaps and return; better than blank.
  return hideOverlapping(lastNonEmpty, pxPerMs, p);
}

function fits(ticks: TimeTick[], pxPerMs: number, p: SelectTimeTicksParams): boolean {
  if (ticks.length <= 1) return true;
  // Format the full batch first — boundary labels (e.g. bold "Mar" replacing
  // a day number) are wider than their primary form, so per-tick measurement
  // would mis-estimate the worst case.
  const labels = formatTimeTicksContextual(ticks, p.locale);
  for (let i = 1; i < ticks.length; i++) {
    const a = labels[i - 1] as { label: string; bold: boolean };
    const b = labels[i] as { label: string; bold: boolean };
    const wA = p.measureLabel(a.label, a.bold);
    const wB = p.measureLabel(b.label, b.bold);
    const gapPx = ((ticks[i] as TimeTick).value - (ticks[i - 1] as TimeTick).value) * pxPerMs;
    if (gapPx < (wA + wB) / 2 + p.minLabelGapPx) return false;
  }
  return true;
}

/**
 * Belt-and-suspenders sweep: drop any tick whose label box would overlap its
 * predecessor's. A no-op when the chosen level passed `fits`; rescues the
 * fallback path where even the coarsest level overflows.
 */
function hideOverlapping(
  ticks: TimeTick[],
  pxPerMs: number,
  p: SelectTimeTicksParams,
): TimeTick[] {
  if (ticks.length <= 1) return ticks;
  const labels = formatTimeTicksContextual(ticks, p.locale);
  const out: TimeTick[] = [ticks[0] as TimeTick];
  let lastIdx = 0;
  for (let i = 1; i < ticks.length; i++) {
    const prev = labels[lastIdx] as { label: string; bold: boolean };
    const cur = labels[i] as { label: string; bold: boolean };
    const wPrev = p.measureLabel(prev.label, prev.bold);
    const wCur = p.measureLabel(cur.label, cur.bold);
    const gapPx = ((ticks[i] as TimeTick).value - (ticks[lastIdx] as TimeTick).value) * pxPerMs;
    if (gapPx < (wPrev + wCur) / 2 + p.minLabelGapPx) continue;
    out.push(ticks[i] as TimeTick);
    lastIdx = i;
  }
  return out;
}

/**
 * Sub-month zooms inject a tick on every month-start so the month label is
 * always anchored on day-1 regardless of how the auto-step lands. Day-level
 * tick that lands within half a step of a month anchor is replaced by it.
 */
function mergeMonthAnchors(
  base: TimeTick[],
  level: TimeLevel,
  stepMs: number,
  d0: number,
  d1: number,
): TimeTick[] {
  if (level !== 'day' && level !== 'hour' && level !== 'minute' && level !== 'second') {
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
  const minGap = stepMs * 0.5;
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
  // Align day/hour/minute/second to local-time boundaries (e.g. midnight in
  // the device's TZ) using a per-tick TZ-offset compensation.
  const tzOffsetMinAtD0 = new Date(d0).getTimezoneOffset();
  const tzOffsetMs = tzOffsetMinAtD0 * MS_MINUTE;
  const alignedStart = Math.ceil((d0 + tzOffsetMs) / stepMs) * stepMs - tzOffsetMs;
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
