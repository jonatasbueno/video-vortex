import { describe, expect, it } from 'vitest';
import { formatPercentLabel, renderFullProgressBar } from '../../src/ui/renderProgressBar.js';

describe('formatPercentLabel', () => {
  it('pads and clamps', () => {
    expect(formatPercentLabel(0)).toBe('  0%');
    expect(formatPercentLabel(45)).toBe(' 45%');
    expect(formatPercentLabel(100)).toBe('100%');
    expect(formatPercentLabel(150)).toBe('100%');
    expect(formatPercentLabel(-5)).toBe('  0%');
  });
});

describe('renderFullProgressBar', () => {
  const colors = {
    barBg: (t: string) => `[F:${t}]`,
    barLabel: (t: string) => `[I:${t}]`,
    empty: (t: string) => `[E:${t}]`,
    emptyLabel: (t: string) => `[L:${t}]`,
  };

  it('grows a single fill over empty space (not over a track bar)', () => {
    const width = 10;
    // 50% of 10 = 5 filled, 5 empty
    const line = renderFullProgressBar(50, width, colors);
    expect(line.startsWith('[F: ]')).toBe(true);
    expect(line).toContain('[E: ]');
    expect(line).toContain('[L:');
    expect(line).toContain('5');
    expect(line).toContain('%');
  });

  it('at 0% is only empty space plus label (no fill bar underneath)', () => {
    const width = 20;
    const line = renderFullProgressBar(0, width, colors);
    expect(line).not.toContain('[F:');
    expect(line).toContain('[E: ]');
    expect(line).toContain('[L:0]');
    expect(line).toContain('[L:%]');
  });

  it('inverts label characters covered by the bar', () => {
    const width = 10;
    const full = renderFullProgressBar(100, width, colors);
    expect(full).toContain('[I:1]');
    expect(full).toContain('[I:0]');
    expect(full).toContain('[I:%]');
    expect(full).not.toContain('[L:');
    expect(full).not.toContain('[E:');
  });

  it('partially inverts when bar overlaps only part of the label', () => {
    const width = 10;
    const line = renderFullProgressBar(80, width, colors);
    expect(line).toContain('[I:');
    expect(line).toContain('[L:');
  });
});
