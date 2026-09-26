# @webiny/cli-standalone

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/cli-standalone` is the self-hosted (non-AWS) hosting-type entry point of the `webiny` CLI: it mirrors `cli-aws`'s `bin.ts` shape but registers only `watch` and `serve` commands (no deploy/destroy/pulumi/output/refresh, since there is no Pulumi-managed cloud stack to operate on), plus an overridden `GetProjectSdkService` and a `DefaultAppsService` that defaults watch/serve to `["api", "admin"]`. The package is small, careful and unusually well-commented (particularly the startup-output-gating logic), correctly follows the minimal-barrel-export convention, and its overall health is good; the main gaps are a small internal duplication between its two output-prefixing Transform streams and almost no test coverage.

## Public API
- `registerStandaloneFeatures(container)` (`src/registerStandaloneFeatures.ts:7`) — the only export from `src/index.ts`, passed by `src/bin.ts:29` as the `register` callback to `Cli.init`, the same pattern `cli-aws` uses. This is also the only cross-package consumer found (`create-webiny-project`'s standalone project scaffolder references `@webiny/cli-standalone` only as a `package.json` dependency string, not a code import).
- Internally: `StandaloneWatchCommand` (`src/features/WatchCommand.ts`) and `StandaloneServeCommand` (`src/features/ServeCommand.ts`) are the two DI-registered commands; `ServerGetProjectSdkService` overrides project-SDK construction to use `@webiny/project-standalone`'s `registerStandaloneProjectFeatures`; `ServerDefaultAppsService` supplies the `["api", "admin"]` default. None of these are exported from `src/index.ts` — correctly kept internal.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `packages/cli-standalone/src/bin.ts:24` | Same issue as in `cli-aws`: `ensureSystemRequirements()` calls bare `process.exit()` on failure (exit code 0), and `bin.ts` calls it synchronously with no exit-code check of its own. | A CI/deploy script invoking the standalone `webiny` binary and checking its exit code will see success (`0`) even when the Node/Yarn version check failed and the CLI aborted without running the requested command. Root cause lives in `@webiny/system-requirements` (flagged at level 0); identical, unmitigated usage in both hosting-type CLIs. | high |

No package-specific bugs beyond this shared, upstream-rooted issue were found in `WatchCommand.ts`, `ServeCommand.ts`, `WatchOutputGate.ts`, `WatchStartup.ts`, `serverProcesses.ts`, `terminalPrefix.ts`, or the two services.

## Duplication
- Internal: `createWatchServerPrefixer` (`packages/cli-standalone/src/features/serverProcesses.ts:16-58`) duplicates most of `createPrefixer`'s (`packages/cli-standalone/src/features/terminalPrefix.ts:88-132`) line-buffering Transform logic (accumulate chunks, split on `LINE_BREAK`, flush lines over `MAX_LINE_LENGTH`, prefix each line) — confirmed by jscpd (`serverProcesses.ts:18-33` <-> `terminalPrefix.ts:89-104`, 16 lines). The two differ only in how they detect a "ready"/URL line (regex-based `LISTENING`/`WATCH_NOISE` vs. `DEV_SERVER_URL`/`DEV_SERVER_READY`), so the shared buffering could be factored into one base Transform parameterized by a line-classifier callback.
- Cross-package: `colorForString` (`packages/cli-standalone/src/features/terminalPrefix.ts:32-39`) and `cli-aws`'s `getRandomColorForString` (`packages/cli-aws/src/features/WatchCommand/getRandomColorForString.ts`) implement the identical hash-based color-selection algorithm with two separately hardcoded palettes — see the `cli-aws` report for the same finding from that side. This is a good candidate to consolidate into one shared "deterministic prefix color" utility, e.g. in `cli-core`, rather than maintaining it twice.

## Dead code
None found. Codegraph/grep confirms every exported service/command is reached from `registerStandaloneFeatures`, and `src/index.ts` exports nothing beyond that single entry point.

## Convention issues
None found. The package follows the minimal-barrel-export convention correctly (`src/index.ts` exports only `registerStandaloneFeatures`), one abstraction/implementation per file, and consistent DI naming — a better example of the convention than its `cli-aws` sibling.

## Test gaps
- Only one test file exists for the entire package: `packages/cli-standalone/__tests__/WatchSummary.test.ts`. `StandaloneWatchCommand`, `StandaloneServeCommand`, `WatchOutputGate`, `WatchStartup`, `serverProcesses.ts` (`createWatchServerPrefixer`), `terminalPrefix.ts` (`createPrefixer`/`colorForString`), `ServerGetProjectSdkService`, and `ServerDefaultAppsService` all have zero direct test coverage. `WatchOutputGate`'s problem-detection regex (`PROBLEM`/`RESOLVED`) and `WatchStartup`'s three-timer release logic are non-trivial enough (documented via extensive comments precisely because the behavior is subtle) that they would benefit most from unit tests among the untested pieces.

## Recommendations
1. Extract the shared line-buffering logic between `createPrefixer` and `createWatchServerPrefixer` into one parameterized Transform to remove the jscpd-flagged duplication.
2. Consolidate the "deterministic prefix color from a string" algorithm with `cli-aws`'s `getRandomColorForString` into a single shared utility instead of two independently hardcoded palettes.
3. Add unit tests for `WatchOutputGate`'s problem-detection heuristic and `WatchStartup`'s timer/release state machine — the two most behaviorally subtle, currently-untested pieces in the package.
