/**
 * Compact default formatter for axis numeric labels.
 * Picks decimal places based on the magnitude of `step` (the inter-tick
 * distance), so axes don't show "0.30000000000000004" or unnecessary trailing
 * zeros.
 */
export function formatNumberTick(value: number, step: number): string {
  if (!Number.isFinite(value)) return '';
  const absStep = Math.abs(step) || Math.abs(value) || 1;
  const decimals = Math.max(0, -Math.floor(Math.log10(absStep)));
  return value.toFixed(decimals);
}
