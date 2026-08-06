import { describe, expect, it } from 'vitest';
import {
  DRIP_CAP_PERCENT,
  columnStepPercent,
  nextDripPercent,
  resolveDisplayProgress,
} from '../../src/download/displayProgress.js';

describe('resolveDisplayProgress (option A)', () => {
  it('takes the max of drip and real', () => {
    expect(resolveDisplayProgress(10, 0)).toBe(10);
    expect(resolveDisplayProgress(10, 40)).toBe(40);
    expect(resolveDisplayProgress(18, 5)).toBe(18);
  });
});

describe('nextDripPercent', () => {
  it('advances by one column each tick', () => {
    const width = 50;
    const step = columnStepPercent(width);
    expect(nextDripPercent(0, width)).toBeCloseTo(step);
    expect(nextDripPercent(step, width)).toBeCloseTo(step * 2);
  });

  it('respects drip cap', () => {
    const width = 10;
    let drip = 0;
    for (let i = 0; i < 100; i++) drip = nextDripPercent(drip, width);
    expect(drip).toBeLessThanOrEqual(DRIP_CAP_PERCENT);
    expect(drip).toBe(DRIP_CAP_PERCENT);
  });
});
