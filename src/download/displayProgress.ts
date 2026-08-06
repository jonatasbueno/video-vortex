/** Advance one bar column every interval while waiting for yt-dlp. */
export const DRIP_INTERVAL_MS = 500;

/** Soft ceiling so the drip never fakes a nearly-complete download. */
export const DRIP_CAP_PERCENT = 18;

/** Percent represented by a single column on a full-width bar. */
export function columnStepPercent(width: number): number {
  return 100 / Math.max(4, Math.floor(width));
}

/**
 * Advance drip by one column, capped.
 * Option A UX: idle animation until real progress catches up via max().
 */
export function nextDripPercent(
  currentDrip: number,
  width: number,
  cap: number = DRIP_CAP_PERCENT,
): number {
  if (currentDrip >= cap) return currentDrip;
  const step = columnStepPercent(width);
  return Math.min(cap, currentDrip + step);
}

/** Option A: display never goes backwards — max(drip, real). */
export function resolveDisplayProgress(drip: number, real: number): number {
  return Math.min(100, Math.max(0, Math.max(drip, real)));
}

export function progressBarWidth(columns: number | undefined, padding = 2): number {
  return Math.max(4, (columns ?? 80) - padding);
}
