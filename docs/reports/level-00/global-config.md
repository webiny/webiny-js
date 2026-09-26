# @webiny/global-config

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A small singleton that reads/writes a per-machine JSON config file at `~/.webiny/config` (a random telemetry `id`, a `telemetry` opt-out flag, and a `newUser` flag used to gate first-deploy telemetry events). It self-heals: any read failure or a missing `id` causes the whole file to be regenerated with fresh defaults, and a missing `newUser` key is backfilled in place. Health is good — the logic is small and defensive, but entirely untested and has one internal API/type mismatch.

## Public API
- `globalConfig.get(key?)` / `globalConfig.set(key, value)` (`packages/global-config/index.js:10`) — 6 consumers across the repo: `project`, `project-aws`, `project-standalone`, `create-webiny-project`, and `telemetry/cli.js`, mostly to read/write the `newUser` and `telemetry` flags after a first successful deploy.

## Bugs
None found with a concrete failure scenario. One thing worth flagging as a latent risk (not a confirmed bug): if the config file exists but is valid JSON without an `id` key (e.g., hand-edited or from an older format), `get()` throws inside the `try` block and the `catch` regenerates the *entire* file with new defaults — including resetting `telemetry` to `true` even if the user previously opted out by editing the file directly. This only matters for a config file that lost its `id` while keeping other keys, which isn't a normal code path in this repo (nothing writes a file without `id`), so confidence is low that it's reachable in practice.

## Duplication
N/A — no jscpd report was generated (no `src` directory) and the file is too small (47 lines) for meaningful clone detection.

## Dead code
None found — both `get` and `set` are used by all 6 consumers.

## Convention issues
Minor type/implementation mismatch: `index.d.ts:9` declares `set(key: string, value: any): void`, but the implementation (`index.js:50-55`) returns the updated config object. No consumer currently uses the return value, so this isn't causing a bug, but the declared type undersells what the function actually returns.

## Test gaps
No tests exist at all. The most important untested behavior is the self-healing path in `get()` (`index.js:13-35`): missing file, corrupt JSON, and missing `id` all take the same "regenerate everything" branch, and the `newUser` backfill (`index.js:43-46`) is a second, separate write path that's never exercised in isolation.

## Recommendations
1. Add a couple of unit tests around `get()`'s three branches (fresh file, corrupt file, missing `newUser` on an otherwise-valid file) since it's shared, singleton, filesystem-touching state used by telemetry gating in 6 packages.
2. Align `index.d.ts`'s `set` return type with the actual implementation (returns the config object, not `void`).
3. Otherwise leave alone — the code is small and the self-heal-by-regenerating-defaults behavior is intentional and documented in-line.
