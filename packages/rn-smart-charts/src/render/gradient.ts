/**
 * Convert a CSS-style hex/rgb color + alpha (0..1) to an `#RRGGBBAA` string
 * that Skia accepts. Falls back to the input untouched if it isn't a hex.
 */
export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    const a = Math.max(0, Math.min(1, alpha));
    const aHex = Math.round(a * 255)
      .toString(16)
      .padStart(2, '0');
    if (color.length === 4) {
      // expand short form #abc → #aabbcc
      const r = color[1];
      const g = color[2];
      const b = color[3];
      return `#${r}${r}${g}${g}${b}${b}${aHex}`;
    }
    return `${color}${aHex}`;
  }
  return color;
}
