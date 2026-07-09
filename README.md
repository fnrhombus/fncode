# fncode

Open a repo in VS Code by reference, not by path.

```sh
fncode std --new-window
```

`fncode` resolves the first argument (`std`) to a local checkout using
[fnclaude](https://github.com/fnclaude/fnclaude)'s exact repo resolver —
searching your GitHub orgs for the owner, cloning if the repo isn't on
disk yet, and deriving the local path — then **execs** into the `code`
CLI at that path, passing every remaining argument through unchanged.

## Install

```sh
npm install -g fncode
```

Requires [Bun](https://bun.com) on the PATH — `fncode` runs under Bun (never
Node) so it can call libc `execvp` via `bun:ffi` for true process-image
replacement into `code`.

Unix only for now; see [#1](https://github.com/fnrhombus/fncode/issues/1) for
Windows support.
