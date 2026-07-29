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

The exec happens **from** the resolved directory, so VS Code inherits it as
its working directory. That's what `cd <repo> && code .` would give you:
integrated terminals start in the repo, and cwd-sensitive tooling (mise,
direnv) activates the project's environment instead of whatever was active
where you ran `fncode`. One consequence — relative paths in the passthrough
arguments resolve against the repo, not against your shell's directory.

## Install

```sh
npm install -g fncode
```

Requires [Bun](https://bun.com) on the PATH — `fncode` runs under Bun (never
Node) so it can call libc `execvp` via `bun:ffi` for true process-image
replacement into `code`.

Unix only for now; see [#1](https://github.com/fnrhombus/fncode/issues/1) for
Windows support.
