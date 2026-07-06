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

Scaffolding in progress.
