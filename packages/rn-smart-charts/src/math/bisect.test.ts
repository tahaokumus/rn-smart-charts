import { describe, expect, it } from 'vitest';
import { bisectClosest, bisectLeft, bisectRight } from './bisect';

describe('bisect', () => {
  const xs = [0, 10, 20, 30, 40, 50];

  describe('bisectClosest', () => {
    it('finds exact matches', () => {
      expect(bisectClosest(xs, 0)).toBe(0);
      expect(bisectClosest(xs, 30)).toBe(3);
      expect(bisectClosest(xs, 50)).toBe(5);
    });

    it('returns left when equidistant or closer', () => {
      expect(bisectClosest(xs, 5)).toBe(0); // 5 is equidistant; left wins
      expect(bisectClosest(xs, 14)).toBe(1); // closer to 10
    });

    it('returns right when closer', () => {
      expect(bisectClosest(xs, 26)).toBe(3); // closer to 30
    });

    it('clamps below and above bounds', () => {
      expect(bisectClosest(xs, -100)).toBe(0);
      expect(bisectClosest(xs, 1000)).toBe(5);
    });
  });

  describe('bisectLeft', () => {
    it('returns insertion index for missing value', () => {
      expect(bisectLeft(xs, 25)).toBe(3);
    });
    it('returns existing index for matching value', () => {
      expect(bisectLeft(xs, 30)).toBe(3);
    });
  });

  describe('bisectRight', () => {
    it('returns one past existing matches', () => {
      expect(bisectRight(xs, 30)).toBe(4);
    });
    it('matches bisectLeft for non-existent values', () => {
      expect(bisectRight(xs, 25)).toBe(bisectLeft(xs, 25));
    });
  });
});
