import { describe, expect, it } from 'vitest';
import { parseJsonStdout, summarizeStderr, YtDlpError } from '../../src/download/runYtdlp.js';

describe('summarizeStderr', () => {
  it('keeps error lines and drops download progress noise', () => {
    const raw = ['[download]  10.0%', 'ERROR: Private video', 'WARNING: something'].join('\n');
    expect(summarizeStderr(raw)).toContain('ERROR: Private video');
    expect(summarizeStderr(raw)).not.toContain('[download]');
  });
});

describe('parseJsonStdout', () => {
  it('parses valid json', () => {
    expect(parseJsonStdout<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it('includes stderr detail when empty', () => {
    expect(() => parseJsonStdout('', 'ERROR: boom')).toThrow(YtDlpError);
    expect(() => parseJsonStdout('', 'ERROR: boom')).toThrow(/boom/);
  });
});
