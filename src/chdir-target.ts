/**
 * Decide which directory `code` should be exec'd *from*.
 *
 * `code <path>` only tells VS Code which folder to open — the process still
 * inherits the shell's cwd. Anything downstream that keys off `$PWD` rather
 * than the workspace root therefore sees the directory `fncode` was invoked
 * from: integrated terminals, and with them mise's `precmd` hook and direnv,
 * so the project's toolchain never activates. Chdir'ing first makes
 * `fncode <ref>` behave like `cd <resolved> && code .`.
 *
 * Returns null when there is nothing to chdir into — either no repo ref was
 * given (`resolvedPath === null`, a plain `code` passthrough) or the resolved
 * path is not a directory. The path short-circuit in `resolveInput` launches
 * unconditionally without an existence check, so `fncode ./nope` and
 * `fncode ~/notes.md` both arrive here with a non-directory. Neither should
 * abort the exec: the chdir is context for `code`, not a precondition of it.
 */

export type IsDirectory = (path: string) => boolean;

export function chdirTarget(
  resolvedPath: string | null,
  isDirectory: IsDirectory,
): string | null {
  if (resolvedPath === null) {
    return null;
  }
  return isDirectory(resolvedPath) ? resolvedPath : null;
}
