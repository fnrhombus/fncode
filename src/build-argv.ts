/**
 * Compute the argv to exec `code` with. The ONLY mutation vs. the user's
 * input is replacing the first arg (the repo ref) with its resolved local
 * path; everything after passes through unchanged.
 *
 * `resolvedPath === null` means "no repo ref to resolve" (empty/omitted
 * first arg) — pass the user's argv straight through to `code`, no mutation.
 */
export function buildCodeArgv(
  resolvedPath: string | null,
  passthrough: string[],
  originalArgs: string[],
): string[] {
  if (resolvedPath === null) return ['code', ...originalArgs];
  return ['code', resolvedPath, ...passthrough];
}
