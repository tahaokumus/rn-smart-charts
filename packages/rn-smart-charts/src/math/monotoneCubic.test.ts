import { describe, expect, it } from 'vitest';
import type { PathLike } from '../types/internal';
import { buildLinearPath, buildMonotonePath } from './monotoneCubic';

type Op =
  | { kind: 'M'; x: number; y: number }
  | { kind: 'L'; x: number; y: number }
  | { kind: 'C'; c1x: number; c1y: number; c2x: number; c2y: number; x: number; y: number }
  | { kind: 'Z' };

class RecordingPath implements PathLike {
  ops: Op[] = [];
  moveTo(x: number, y: number) {
    this.ops.push({ kind: 'M', x, y });
  }
  lineTo(x: number, y: number) {
    this.ops.push({ kind: 'L', x, y });
  }
  cubicTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    this.ops.push({ kind: 'C', c1x, c1y, c2x, c2y, x, y });
  }
  close() {
    this.ops.push({ kind: 'Z' });
  }
}

describe('buildMonotonePath', () => {
  it('handles empty input as a no-op', () => {
    const p = new RecordingPath();
    buildMonotonePath([], [], 0, p);
    expect(p.ops).toEqual([]);
  });

  it('emits only moveTo for a single point', () => {
    const p = new RecordingPath();
    buildMonotonePath([5], [10], 1, p);
    expect(p.ops).toEqual([{ kind: 'M', x: 5, y: 10 }]);
  });

  it('emits moveTo + cubicTo per segment', () => {
    const p = new RecordingPath();
    buildMonotonePath([0, 1, 2, 3], [0, 1, 4, 9], 4, p);
    expect(p.ops[0]).toMatchObject({ kind: 'M', x: 0, y: 0 });
    expect(p.ops.length).toBe(4); // M + 3 C
    for (let i = 1; i < p.ops.length; i++) {
      expect(p.ops[i]?.kind).toBe('C');
    }
  });

  it('does not overshoot a monotone-increasing series', () => {
    const xs = [0, 1, 2, 3, 4, 5];
    const ys = [0, 1, 2, 3, 4, 5];
    const p = new RecordingPath();
    buildMonotonePath(xs, ys, xs.length, p);
    // All endpoints + control points should stay within [min(y), max(y)].
    // For a perfectly monotone-linear input, the curve is the straight line
    // and control y's equal the segment endpoints.
    for (const op of p.ops) {
      if (op.kind === 'C') {
        expect(op.c1y).toBeGreaterThanOrEqual(0);
        expect(op.c1y).toBeLessThanOrEqual(5);
        expect(op.c2y).toBeGreaterThanOrEqual(0);
        expect(op.c2y).toBeLessThanOrEqual(5);
      }
    }
  });

  it('produces a flat path for flat input', () => {
    const xs = [0, 1, 2, 3];
    const ys = [7, 7, 7, 7];
    const p = new RecordingPath();
    buildMonotonePath(xs, ys, xs.length, p);
    for (const op of p.ops) {
      if (op.kind === 'M' || op.kind === 'L') expect(op.y).toBe(7);
      if (op.kind === 'C') {
        expect(op.c1y).toBe(7);
        expect(op.c2y).toBe(7);
        expect(op.y).toBe(7);
      }
    }
  });

  it('appends bottom + close when closeBottom is provided', () => {
    const p = new RecordingPath();
    buildMonotonePath([0, 1, 2], [10, 20, 15], 3, p, { y: 0 });
    const last4 = p.ops.slice(-3);
    expect(last4[0]?.kind).toBe('L'); // down-right
    expect(last4[1]?.kind).toBe('L'); // bottom-left
    expect(last4[2]?.kind).toBe('Z');
  });
});

describe('buildLinearPath', () => {
  it('emits moveTo + lineTo per point', () => {
    const p = new RecordingPath();
    buildLinearPath([0, 1, 2], [10, 20, 30], 3, p);
    expect(p.ops).toEqual([
      { kind: 'M', x: 0, y: 10 },
      { kind: 'L', x: 1, y: 20 },
      { kind: 'L', x: 2, y: 30 },
    ]);
  });

  it('closes to bottom when requested', () => {
    const p = new RecordingPath();
    buildLinearPath([0, 1], [10, 20], 2, p, { y: 0 });
    expect(p.ops[p.ops.length - 1]?.kind).toBe('Z');
  });
});
