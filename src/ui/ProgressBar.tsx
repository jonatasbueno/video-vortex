import React from 'react';
import { Text, useStdout } from 'ink';
import { renderFullProgressBar } from './renderProgressBar.js';

export interface ProgressBarProps {
  /** Progress from 0 to 100 */
  percent: number;
  /** Optional fixed width; defaults to terminal columns */
  width?: number;
}

export function ProgressBar({ percent, width }: ProgressBarProps): React.ReactElement {
  const { stdout } = useStdout();
  const cols = width ?? stdout?.columns ?? 80;
  // Account for parent Box padding when using full terminal width
  const usable = width == null ? Math.max(4, cols - 2) : Math.max(4, width);

  return <Text>{renderFullProgressBar(percent, usable)}</Text>;
}
