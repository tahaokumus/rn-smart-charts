import { describe, expect, it } from 'vitest';
import { rightAnchoredPinch } from './pinch';

describe('rightAnchoredPinch', () => {
  it('keeps xEnd unchanged in all cases', () => {
    const r = rightAnchoredPinch(0, 100, 2, 1, 1000, -1000);
    expect(r.xEnd).toBe(100);
  });

  it('halves span when scale=2 (zoom in)', () => {
    const r = rightAnchoredPinch(0, 100, 2, 1, 1000, -1000);
    expect(r.xStart).toBe(50);
    expect(r.xEnd - r.xStart).toBe(50);
  });

  it('doubles span when scale=0.5 (zoom out)', () => {
    const r = rightAnchoredPinch(0, 100, 0.5, 1, 1000, -1000);
    expect(r.xStart).toBe(-100);
    expect(r.xEnd - r.xStart).toBe(200);
  });

  it('clamps to minSpan', () => {
    const r = rightAnchoredPinch(0, 100, 1000, 10, 1000, -1000);
    expect(r.xEnd - r.xStart).toBe(10);
  });

  it('clamps to maxSpan', () => {
    const r = rightAnchoredPinch(0, 100, 0.001, 1, 200, -1000);
    expect(r.xEnd - r.xStart).toBe(200);
  });

  it('clamps newStart to dataMinX', () => {
    const r = rightAnchoredPinch(0, 100, 0.5, 1, 1000, -50);
    expect(r.xStart).toBe(-50);
    expect(r.xEnd).toBe(100);
  });

  it('returns unchanged on invalid scale', () => {
    const r1 = rightAnchoredPinch(10, 50, 0, 1, 1000, -1000);
    expect(r1).toEqual({ xStart: 10, xEnd: 50 });
    const r2 = rightAnchoredPinch(10, 50, Number.NaN, 1, 1000, -1000);
    expect(r2).toEqual({ xStart: 10, xEnd: 50 });
  });
});
