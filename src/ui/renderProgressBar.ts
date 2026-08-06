import chalk from 'chalk';

export interface ProgressBarColors {
  /** Growing bar fill (left → right over empty space) */
  barBg: (text: string) => string;
  /** Inverted label on top of the bar (negative of bar color) */
  barLabel: (text: string) => string;
  /** Unfilled region — empty terminal space (no second track bar) */
  empty: (text: string) => string;
  /** Label sitting on empty space */
  emptyLabel: (text: string) => string;
}

const DEFAULT_COLORS: ProgressBarColors = {
  barBg: (text) => chalk.bgGray(text),
  barLabel: (text) => chalk.bgGray.black(text),
  empty: (text) => text,
  emptyLabel: (text) => chalk.white(text),
};

/** Right-aligned percent label, e.g. `  0%`, ` 45%`, `100%`. */
export function formatPercentLabel(percent: number): string {
  const clamped = Math.min(100, Math.max(0, percent));
  const rounded = Math.round(clamped);
  return `${rounded}%`.padStart(4, ' ');
}

/**
 * Full-width progress bar (left → right) with percent pinned to the right.
 * A single gray bar grows over empty space (no underlying track bar).
 * Digits covered by the fill use the inverted (negative) bar color.
 */
export function renderFullProgressBar(
  percent: number,
  width: number,
  colors: ProgressBarColors = DEFAULT_COLORS,
): string {
  const cols = Math.max(4, Math.floor(width));
  const label = formatPercentLabel(percent);
  const filled = Math.min(cols, Math.round((Math.min(100, Math.max(0, percent)) / 100) * cols));
  const labelStart = cols - label.length;

  let out = '';
  for (let i = 0; i < cols; i++) {
    const isFilled = i < filled;
    const inLabel = i >= labelStart;
    if (inLabel) {
      const ch = label[i - labelStart] ?? ' ';
      out += isFilled ? colors.barLabel(ch) : colors.emptyLabel(ch);
    } else {
      out += isFilled ? colors.barBg(' ') : colors.empty(' ');
    }
  }
  return out;
}
