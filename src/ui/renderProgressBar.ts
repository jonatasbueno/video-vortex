import chalk from 'chalk';

export interface ProgressBarColors {
  /** Background/fill color of the completed portion */
  barBg: (text: string) => string;
  /** Inverted label on top of the bar (negative of bar color) */
  barLabel: (text: string) => string;
  /** Empty track background */
  trackBg: (text: string) => string;
  /** Label sitting on the empty track */
  trackLabel: (text: string) => string;
}

const DEFAULT_COLORS: ProgressBarColors = {
  barBg: (text) => chalk.bgCyan(text),
  barLabel: (text) => chalk.bgCyan.black(text),
  trackBg: (text) => chalk.bgGray(text),
  trackLabel: (text) => chalk.white(text),
};

/** Right-aligned percent label, e.g. `  0%`, ` 45%`, `100%`. */
export function formatPercentLabel(percent: number): string {
  const clamped = Math.min(100, Math.max(0, percent));
  const rounded = Math.round(clamped);
  return `${rounded}%`.padStart(4, ' ');
}

/**
 * Full-width progress bar (left → right) with percent pinned to the right.
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
      out += isFilled ? colors.barLabel(ch) : colors.trackLabel(ch);
    } else {
      out += isFilled ? colors.barBg(' ') : colors.trackBg(' ');
    }
  }
  return out;
}
