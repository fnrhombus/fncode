#!/usr/bin/env bun
//
// fncode entry shim. Runs directly under Bun (never Node): fncode needs
// `bun:ffi` to call libc `execvp` for true process-image replacement into
// `code`, which Node can't provide. Bun only strips a `--` sentinel that
// sits in the very first user-arg slot — where fncode always expects the
// repo reference, never `--` — so every real invocation's args survive
// byte-for-byte. main.ts reads process.argv directly.

await import('../src/main.ts');
