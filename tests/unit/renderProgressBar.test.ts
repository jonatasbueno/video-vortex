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
    trackBg: (t: string) => `[E:${t}]`,
    trackLabel: (t: string) => `[L:${t}]`,
  };

  it('fills left to right and pins percent on the right', () => {
    const width = 10;
    // 50% of 10 = 5 filled
    const line = renderFullProgressBar(50, width, colors);
    expect(line.startsWith('[F: ]')).toBe(true);
    expect(line).toContain('[L:');
    expect(line).toContain('5');
    expect(line).toContain('%');
  });

  it('inverts label characters covered by the bar', () => {
    const width = 10;
    // 100% fills entire width including label → all label chars inverted
    const full = renderFullProgressBar(100, width, colors);
    expect(full).toContain('[I:1]');
    expect(full).toContain('[I:0]');
    expect(full).toContain('[I:0]');
    expect(full).toContain('[I:%]');
    expect(full).not.toContain('[L:');
  });

  it('keeps uncovered label on track color at low progress', () => {
    const width = 20;
    const line = renderFullProgressBar(0, width, colors);
    expect(line).toContain('[L: ');
    expect(line).toContain('[L:0]');
    expect(line).toContain('[L:%]');
    expect(line).not.toContain('[I:');
  });

  it('partially inverts when bar overlaps only part of the label', () => {
    const width = 10;
    // filled = round(0.8 * 10) = 8; label at 6..9 (" 80%")
    // indices 6,7 filled+label → inverted; 8,9 unfilled+label → track label
    const line = renderFullProgressBar(80, width, colors);
    expect(line).toContain('[I:');
    expect(line).toContain('[L:');
  });
});

