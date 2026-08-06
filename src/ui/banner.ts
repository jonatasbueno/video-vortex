import chalk from 'chalk';
import gradient from 'gradient-string';

const ASCII_ART = `
██╗   ██╗██╗██████╗ ███████╗ ██████╗     ██╗   ██╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗
██║   ██║██║██╔══██╗██╔════╝██╔═══██╗    ██║   ██║██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
██║   ██║██║██║  ██║█████╗  ██║   ██║    ██║   ██║██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝ 
╚██╗ ██╔╝██║██║  ██║██╔══╝  ██║   ██║    ╚██╗ ██╔╝██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗ 
 ╚████╔╝ ██║██████╔╝███████╗╚██████╔╝     ╚████╔╝ ╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗
  ╚═══╝  ╚═╝╚═════╝ ╚══════╝ ╚═════╝       ╚═══╝   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
`.trim();

export function renderBanner(subtitle?: string): string {
  const colored = gradient(['#00c6ff', '#0072ff', '#7b2ff7'])(ASCII_ART);
  const lines = [colored, chalk.bold.white('  Video Vortex')];
  if (subtitle) {
    lines.push(chalk.gray(`  ${subtitle}`));
  }
  lines.push('');
  return lines.join('\n');
}

export function getAsciiArt(): string {
  return ASCII_ART;
}
