# @webiny/cli-aws

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/cli-aws` is the AWS hosting-type entry point of the `webiny` CLI: its `bin.ts` wires `@webiny/system-requirements`/`ensureSameWebinyPackageVersions` checks and hands `Cli.init` a `registerAwsFeatures` callback that registers the deploy/destroy/output/pulumi/refresh/watch commands, two Pulumi-specific "graceful error handler" translators, and a deploy-telemetry decorator into `@webiny/cli-core`'s DI container. The code itself is small, careful and consistently idiomatic (one class per file, `createImplementation`/`createDecorator` used correctly), but the package has zero automated tests, a confirmed yargs option-type bug on a production-safety flag, and a wholesale barrel export that nothing outside the package actually consumes.

## Public API
- `registerAwsFeatures(container)` (`src/registerAwsFeatures.ts:15`) — the only export actually consumed externally, passed by `src/bin.ts:29` as the `register` callback to `Cli.init`. This is the sole call site across the monorepo (a repo-wide grep for `@webiny/cli-aws` outside this package finds only a code comment in `cli-core` and a `package.json` dependency string in `create-webiny-project`'s AWS project scaffolder — no code import).
- `src/index.ts` additionally does `export * from "./features/index.js"` and `"./decorators/index.js"`, re-exporting every command class (`DeployCommand`, `DestroyCommand`, `PulumiCommand`, `RefreshCommand`, `OutputCommand`, `WatchCommand`), both graceful-error-handler classes, and `DeployCommandWithTelemetry` — none of which have any consumer outside `cli-aws` itself.
- Internally, `AwsGetProjectSdkService` (`src/services/GetProjectSdkService.ts`) overrides `GetProjectSdkService` to initialize `ProjectSdk` with `registerAwsProjectFeatures` from `@webiny/project-aws`, used by every command via constructor injection.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/cli-aws/src/features/WatchCommand/WatchCommand.ts:91-97` | The `allow-production` yargs option is declared `type: "number"` (with `default: false`), but the value it feeds, `IBaseAppParams.allowProduction` (`packages/project/src/abstractions/features/Watch.ts:17`), is typed and consumed as a plain boolean guard (`if (!params.allowProduction)` in `packages/project/src/features/Watch/Watch.ts:68`). | A developer running `webiny watch api --env prod --allow-production` to intentionally bypass the production guard gets yargs' number-option parsing instead of a boolean flag — the flag does not reliably resolve to `true`, so the intended bypass is not guaranteed to work as documented, and the option can also swallow the next CLI token as its numeric value. | high |
| 2 | low | `packages/cli-aws/src/bin.ts:24` | `ensureSystemRequirements()` (from `@webiny/system-requirements`) calls `process.exit()` with no status code when validation fails; `cli-aws`'s `bin.ts` calls it synchronously and does not itself check any return value or exit code. | Any script/CI step invoking the `webiny` (aws) binary and gating on its exit code will see `0` even when the Node/Yarn version check failed and the CLI printed an error and quit without doing anything — a false "success". Root cause is in `@webiny/system-requirements` (already flagged at level 0); `cli-aws` adds nothing to guard against it. | high |

## Duplication
- jscpd: `packages/cli-aws/src/features/PulumiCommand/PulumiCommand.ts:49-62` duplicates `packages/cli-aws/src/features/RefreshCommand/RefreshCommand.ts:41-53` (14 lines) — both handlers build a Pulumi passthrough command, call the corresponding `ProjectSdk` method, pipe `stdin`/`stdout`/`stderr` identically, and wrap failures in `ManuallyReportedError.from`. A shared "run Pulumi passthrough command" helper would remove the duplicate and the duplicated risk of one being fixed without the other.
- Cross-package (not visible to jscpd, which runs per-package): `getRandomColorForString` (`packages/cli-aws/src/features/WatchCommand/getRandomColorForString.ts`) and its sibling package's `colorForString` (`packages/cli-standalone/src/features/terminalPrefix.ts:32-39`) implement the exact same "hash a string, index into a fixed palette" algorithm (identical `hash = (hash<<5)-hash+charCodeAt; hash|=0` formula) with two different hardcoded color arrays. Both hosting-type CLIs independently reinvented the same "deterministic prefix color" utility instead of sharing one (e.g. via `cli-core`).

## Dead code
- `src/index.ts`'s two `export *` barrels re-export every command, deploy-output strategy class, and graceful-error-handler class in the package. Codegraph/grep confirm no consumer outside `cli-aws` imports any of these by name — the package's only real external surface is `registerAwsFeatures` from `bin.ts`. Not "dead" in the sense of being unreachable (they're all wired via DI and reachable from `registerAwsFeatures`), but they are unnecessarily public.

## Convention issues
- Minimal barrel exports violation (per project convention "only export what external consumers need, not internal DI wiring"): `src/index.ts` re-exports the entire `features`/`decorators` tree rather than only `registerAwsFeatures`. Contrast with the sibling `@webiny/cli-standalone`, whose `src/index.ts` exports only `registerStandaloneFeatures` — the correct pattern.
- Everything else (one class per file, `Namespace.Interface` abstractions, `createImplementation`/`createDecorator` usage) is consistent with the rest of the DI-based CLI packages.

## Test gaps
- The package has no `__tests__` directory at all (confirmed via directory search) — zero test files cover any of: the six commands (deploy/destroy/output/pulumi/refresh/watch), the two graceful error handlers, the deploy-telemetry decorator, or the deploy-output strategy classes (`BaseDeployOutput`/`NoDeploymentLogsDeployOutput`/`WithDeploymentLogsDeployOutput`). By contrast, the sibling `cli-standalone` package has at least one test file. The graceful error handlers in particular are pure, easily-testable string-matching functions (`DdbPutItemConditionalCheckFailedGracefulErrorHandler`, `PendingOperationsGracefulErrorHandler`) that currently have no coverage proving their `MATCH_STRING` substrings still match real Pulumi/AWS error text.

## Recommendations
1. Fix the `allow-production` option's declared type to `"boolean"` (matching `IBaseAppParams.allowProduction`) so the production-guard bypass behaves as documented.
2. Trim `src/index.ts` to export only `registerAwsFeatures`, dropping the wholesale `features`/`decorators` barrel, to match the minimal-export pattern already used by `cli-standalone`.
3. Add baseline test coverage — start with the two graceful error handlers (cheap, pure-function tests) and extract/test the shared Pulumi-passthrough logic behind `PulumiCommand`/`RefreshCommand` instead of leaving two untested near-identical handlers.
