import { dlopen, FFIType, ptr } from 'bun:ffi';

const libcName = process.platform === 'darwin' ? 'libc.dylib' : 'libc.so.6';

const { symbols } = dlopen(libcName, {
  execvp: {
    args: [FFIType.cstring, FFIType.ptr],
    returns: FFIType.int,
  },
});

function cstr(s: string): Uint8Array {
  return new TextEncoder().encode(`${s}\0`);
}

/**
 * Replace the current process image with `file`, invoked with `argv`
 * (argv[0] is the program name by convention). On success this never
 * returns. Throws only if execvp itself fails (e.g. `code` not on PATH).
 */
export function execvp(file: string, argv: string[]): never {
  const argBufs = argv.map(cstr); // held alive for the duration of the call
  const fileBuf = cstr(file);
  const ptrs = new BigUint64Array(argv.length + 1);
  for (let i = 0; i < argBufs.length; i++) {
    ptrs[i] = BigInt(ptr(argBufs[i]!));
  }
  ptrs[argv.length] = 0n;
  symbols.execvp(ptr(fileBuf), ptr(ptrs));
  throw new Error(`fncode: failed to exec 'code' (is it on PATH?)`);
}
