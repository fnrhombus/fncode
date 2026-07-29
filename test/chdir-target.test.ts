import { describe, expect, test } from 'bun:test';

import { chdirTarget } from '../src/chdir-target';

describe('chdirTarget', () => {
  test('resolved path is a directory → chdir into it', () => {
    expect(chdirTarget('/home/me/src/foo@bar', () => true)).toBe('/home/me/src/foo@bar');
  });

  test('worktree path from the ./ short-circuit → chdir into it', () => {
    const worktree = '/home/me/src/std@fnioc+IServiceManifest-repair';
    expect(chdirTarget(worktree, () => true)).toBe(worktree);
  });

  test('null resolvedPath → no chdir, plain code passthrough keeps the shell cwd', () => {
    expect(chdirTarget(null, () => true)).toBeNull();
  });

  test('null resolvedPath never touches the filesystem', () => {
    let calls = 0;
    chdirTarget(null, () => {
      calls++;
      return true;
    });
    expect(calls).toBe(0);
  });

  test('resolved path is a file → no chdir, exec still proceeds', () => {
    expect(chdirTarget('/home/me/notes.md', () => false)).toBeNull();
  });

  test('nonexistent short-circuit path → no chdir, exec still proceeds', () => {
    expect(chdirTarget('/home/me/nope', () => false)).toBeNull();
  });
});
