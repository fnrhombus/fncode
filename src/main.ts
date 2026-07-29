// `fncode`: resolve the first positional (a repo ref or path) to a local
// repo path using fnclaude's EXACT resolver, then exec (true process-image
// replacement, via bun:ffi → libc execvp) into `code <path> <...passthrough>`.
//
// The resolver modules under src/repo and src/path are a verbatim copy of
// fnclaude's, so fncode resolves to the same clones fnc would. The only
// mutation vs. the user's argv is replacing the first arg (the ref) with its
// resolved path; every later arg passes through byte-for-byte.
//
// The exec also happens *from* the resolved directory, so VS Code inherits it
// as its working directory — see ./chdir-target.ts for why that matters.

import { existsSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { buildCodeArgv } from './build-argv';
import { chdirTarget } from './chdir-target';
import { execvp } from './exec';
import { computeCloneDestination, buildCloneUrl } from './repo/clone';
import { cloneRepo } from './repo/clone-exec';
import { runGhApi, runGhClone } from './repo/gh-runner';
import { loadHostAliases } from './repo/host-aliases';
import { findOwner, formatOwnerLookupError } from './repo/owner-lookup';
import { loadRepoSettings } from './repo/repo-settings';
import { resolveInput } from './repo/resolve-input';

const args = process.argv.slice(2);
const firstArg = args.length > 0 ? args[0]! : null;
const passthrough = args.slice(1);
const HOME = homedir();
const shellCwd = process.cwd();

const settings = loadRepoSettings({
  userPath: join(HOME, '.claude', 'settings.json'),
  projectPath: join(shellCwd, '.claude', 'settings.json'),
  localPath: join(shellCwd, '.claude', 'settings.local.json'),
  managedPath: '/etc/claude-code/managed-settings.json',
});
const hostAliases = loadHostAliases({
  systemPath: '/usr/share/fnrhombus/host-aliases.json',
  userPath: join(HOME, '.local', 'share', 'fnrhombus', 'host-aliases.json'),
});

const resolved = resolveInput({
  input: firstArg,
  shellCwd,
  home: HOME,
  xdgConfigHome: process.env.XDG_CONFIG_HOME,
  settings: {
    cloneTemplate: settings.cloneTemplate,
    worktreeTemplate: settings.worktreeTemplate,
    hostAliases,
  },
});

/**
 * Clone `url` into `destination`, returning the destination on success.
 * On failure, print to stderr and exit 1 — fncode has no bootstrap path.
 */
async function cloneOrExit(url: string, destination: string): Promise<string> {
  process.stderr.write(`fncode: cloning ${url} → ${destination}\n`);
  const cloneR = await cloneRepo({
    url,
    destination,
    ghClone: runGhClone,
    mkdirp: async (path) => {
      await mkdir(path, { recursive: true });
    },
  });
  if (cloneR.ok) return destination;
  process.stderr.write(`fncode: ${cloneR.error}\n`);
  process.exit(1);
}

let resolvedPath: string | null;
switch (resolved.kind) {
  case 'launch':
    resolvedPath = resolved.usedNoopFallback ? null : resolved.launchCwd;
    break;
  case 'needs-clone':
    resolvedPath = await cloneOrExit(resolved.url, resolved.destination);
    break;
  case 'needs-owner-lookup': {
    const ownerR = await findOwner({ name: resolved.name, ghApi: runGhApi });
    if (!ownerR.ok) {
      process.stderr.write(`${formatOwnerLookupError(ownerR, resolved.name)}\n`);
      process.exit(1);
    }
    if (settings.cloneTemplate === '') {
      process.stderr.write(
        `fncode: cloneTemplate is not configured in repoSettings; cannot resolve bare-name refs.\n`,
      );
      process.exit(1);
    }
    const syntheticRef = {
      host: '',
      owner: ownerR.owner,
      name: resolved.name,
      workspace: resolved.workspace,
      original: resolved.name,
    };
    const destR = computeCloneDestination({
      ref: syntheticRef,
      template: settings.cloneTemplate,
      hostAliases,
      home: HOME,
    });
    if (!destR.ok) {
      process.stderr.write(`fncode: ${destR.error}\n`);
      process.exit(1);
    }
    if (existsSync(destR.path)) {
      resolvedPath = destR.path;
      break;
    }
    resolvedPath = await cloneOrExit(buildCloneUrl(syntheticRef), destR.path);
    break;
  }
  case 'ambiguous': {
    const both = resolved.cloneDestination ?? resolved.repoRef ?? '?';
    process.stderr.write(
      `fncode: ambiguous reference — could be the local directory ${resolved.path} OR ${both}. Disambiguate by typing './<name>' for the local path.\n`,
    );
    process.exit(1);
  }
  case 'ambiguous-local': {
    const list = resolved.paths.map((p) => `  ${p}`).join('\n');
    process.stderr.write(
      `fncode: ambiguous reference — multiple local clones named '${resolved.name}':\n${list}\nDisambiguate with '${resolved.name}@<owner>'.\n`,
    );
    process.exit(1);
  }
  case 'error':
    process.stderr.write(`fncode: ${resolved.error}\n`);
    process.exit(1);
}

/**
 * Filesystem adapter for chdirTarget. Deliberately a local copy of the one
 * inside resolve-input.ts: that module mirrors fnclaude's resolver verbatim,
 * and main is the boundary where filesystem side effects already live.
 */
function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

const launchDir = chdirTarget(resolvedPath, isDirectory);
if (launchDir !== null) {
  process.chdir(launchDir);
}

execvp('code', buildCodeArgv(resolvedPath, passthrough, args));
