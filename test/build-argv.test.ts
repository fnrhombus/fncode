import { describe, expect, test } from 'bun:test';

import { buildCodeArgv } from '../src/build-argv';

describe('buildCodeArgv', () => {
  test('normal ref → code + resolved path + passthrough', () => {
    expect(buildCodeArgv('/home/me/src/foo@bar', ['-g', 'a.ts:12'], ['foo', '-g', 'a.ts:12'])).toEqual([
      'code',
      '/home/me/src/foo@bar',
      '-g',
      'a.ts:12',
    ]);
  });

  test('resolvedPath null → pass original argv through unmutated', () => {
    const original = ['--list-extensions', '--show-versions'];
    expect(buildCodeArgv(null, ['--show-versions'], original)).toEqual([
      'code',
      '--list-extensions',
      '--show-versions',
    ]);
  });

  test('resolvedPath null with empty argv → just code', () => {
    expect(buildCodeArgv(null, [], [])).toEqual(['code']);
  });

  test('passthrough preserved byte-for-byte including flags and a bare --', () => {
    const passthrough = ['--wait', '--', '--not-a-flag', 'file with spaces.txt', '-n'];
    const original = ['repo', ...passthrough];
    expect(buildCodeArgv('/path/to/repo', passthrough, original)).toEqual([
      'code',
      '/path/to/repo',
      '--wait',
      '--',
      '--not-a-flag',
      'file with spaces.txt',
      '-n',
    ]);
  });

  test('ref with no passthrough → code + resolved path only', () => {
    expect(buildCodeArgv('/path/to/repo', [], ['repo'])).toEqual(['code', '/path/to/repo']);
  });
});
