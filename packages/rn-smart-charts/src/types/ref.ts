export interface ChartRef {
  /** Set the visible x-window. Dates are converted to ms. */
  zoomTo(start: number | Date, end: number | Date): void;
  /** Reset to full data extent. */
  resetZoom(): void;
  /** Pan so the given x value sits at the right edge of the plot. */
  panTo(x: number | Date): void;
  /** Snapshot of the current visible window in numeric form. */
  getViewport(): { start: number; end: number };
}
