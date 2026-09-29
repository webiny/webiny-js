# @webiny/system-requirements

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
Validates that the running Node/Yarn versions meet the CLI's minimum requirements, and prints a formatted table + aborts the process if they don't. Deliberately optimized to avoid spawning subprocesses on the CLI's hot path: it reads the Yarn version from `npm_config_user_agent` first and only falls back to spawning `yarn --version` if that's unavailable. Logic is simple and well-commented; the one real issue is the exit code used when validation fails.

## Public API
- `SystemRequirements.validate()` / `.getNodeVersion()` / `.getYarnVersion()` / `.getNpmVersion()` / `.getNpxVersion()` / `.getOsVersion()` (`packages/system-requirements/SystemRequirements.js:6`) — used by `ensureSystemRequirements` and by `webiny info`/`create-webiny-project` (per in-code comments) to report versions.
- `ensureSystemRequirements()` (`packages/system-requirements/ensureSystemRequirements.js:5`) — called from 3 CLI entrypoints: `packages/cli-aws/src/bin.ts`, `packages/cli-standalone/src/bin.ts`, `packages/create-webiny-project/src/bin.ts` (confirmed via codegraph).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/system-requirements/ensureSystemRequirements.js:72` | `process.exit()` is called with no exit code when system requirements are **not** met, which defaults to exit code `0` (success). | A CI pipeline or wrapper script that runs `webiny deploy` (or any other CLI command) on a runner with an unsupported Node/Yarn version gets the "requirements not met" message printed, the command aborts having done nothing, but the process still reports success (`echo $?` → `0`). Any automation gating on exit code won't notice the deploy never ran. | high |

## Duplication
N/A — no jscpd report was generated for this package (no `src` directory), and the files are small/data-only (a constraints object, a regex-based parser, a validation class, and a console-table printer). No internal duplication observed by inspection.

## Dead code
None found — all exported members of `SystemRequirements` and `ensureSystemRequirements` are used per the in-code comments and codegraph's caller data (3 real CLI entrypoints).

## Convention issues
None meaningful — this is a small, plain-JS utility package predating the current DI conventions; nothing here calls for `createImplementation`/DI wiring.

## Test gaps
No tests exist. Most importantly: the exit-code behavior in bug #1 above is untested, as is `yarnVersionFromUserAgent`'s regex parsing (`packages/system-requirements/yarnVersionFromUserAgent.js:22`) against real-world `npm_config_user_agent` strings (e.g. npm-only agents, malformed agents, pre-release Yarn versions).

## Recommendations
1. Fix the exit code: call `process.exit(1)` (or another non-zero code) in `ensureSystemRequirements.js:72` so failed requirement checks are visible to scripts/CI, not just humans reading the console.
2. Add a couple of unit tests for `yarnVersionFromUserAgent` (valid agent, npm-only agent, malformed version) since it's the fast path used on every CLI invocation started via `yarn webiny`.
3. Low priority: add a test asserting `ensureSystemRequirements()` exits non-zero when `SystemRequirements.validate()` reports invalid, to lock in the fix above.
