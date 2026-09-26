# @webiny/cli-core

> Level 3 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/cli-core` is the framework that assembles the `webiny` CLI itself: it builds the `@webiny/di` container (`createCliContainer.ts`), wires yargs command/option registration (`GetCliRunnerService`), and ships the base set of commands (build, config, extension, info, upgrade, deps-sync, Wcp login/logout/whoami/link-project) plus the `Cli/Command` and `cliCommandDecorator` extension points used by hosting packages like `cli-aws`. It is consistently idiomatic (one class per file, `Namespace.Interface`, `createImplementation`/`createDecorator` used correctly) and its own logic is mostly small delegate classes, but it has a confirmed runtime bug (an unimported global used in a real command), a second correctness bug in the upgrade command, and almost no test coverage (1 test file for 120 source files) to have caught either. It also reimplements `@webiny/logger` from scratch via a direct `pino` wrapper (`services/LoggerService/LoggerService.ts`) rather than depending on the shared package, which higher-level packages should not copy.

## Public API
- `Cli` (`src/Cli.ts`) — `Cli.init()`/`.run()` is the actual CLI entry point; consumed by `bin.ts`-style entrypoints in `cli-aws` and `cli-server` (each passes a `register` callback into `createCliContainer`).
- `CliCommandFactory`, `GlobalCliOption`, `ErrorHandler`, `LoggerService`, `UiService` abstractions (`src/abstractions/*`) — the extension points hosting packages (`cli-aws`) and extension authors (`defineExtension`-based `Cli/Command`, `cliCommandDecorator`) register against; re-exported narrowly via `src/exports/cli.ts` and `src/exports/cli/command.ts` (only `Logger`, `Ui`, `CliCommandFactory` are exposed externally — good, minimal barrel).
- `CliCommand` / `CliCommandDecorator` extensions (`src/extensions/*`) — thin `defineExtension` wrappers reused by `webiny.config.tsx` authors across the monorepo, same pattern as `@webiny/project`'s other extension points.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | packages/cli-core/src/features/Wcp/LinkProjectCommand.ts:76,119 | `open(wcpAppUrl)` is called but `open` (the `open` npm package used correctly by `LoginCommand.ts` and `OpenCommand.ts` in the same package) is never imported in this file. TypeScript doesn't flag it because the project's `tsconfig` includes the `"dom"` lib, whose ambient `window.open` type satisfies the compiler; at runtime under Node there is no global `open`. | Running `webiny link-project` and answering "yes" to either "you're not part of any organization, log in and create one" or "no projects in this org, create one now" throws `ReferenceError: open is not defined`, crashing the command instead of opening the browser. | high |
| 2 | low | packages/cli-core/src/features/UpgradeCommand/UpgradeCommand.ts:113 | `debug: true` is hardcoded in the params passed to `upgradeCommandHandler.handle(...)`, ignoring `params.debug` (which is declared on `UpgradeCommandParams` but never wired to a yargs option). | Every invocation of `webiny upgrade` runs the downstream `npx webiny/webiny-upgrades-v6` process with `--debug` forced on, regardless of user intent; the flag exists in the type but can never be turned off (or explicitly set) by a user. | high |
| 3 | low | packages/cli-core/src/services/GetCliRunnerService/GetCliRunnerService.ts:151 | When a registered command declares a `params` entry named `version` (conflicts with the global `--version` option), the code calls `ui.error(...)` then bare `process.exit()` (no exit code), instead of `process.exit(1)` used everywhere else in this same `fail` handler. | A misconfigured extension command named with a `version` param exits with status 0 despite reporting an error, so CI/scripts treating exit code as success/failure won't detect the failure. | medium |

## Duplication
- jscpd flags `packages/cli-core/src/features/Wcp/LogoutCommand.ts:4-16`, `WhoAmICommand.ts:3-15`, and `LinkProjectCommand.ts:7-19` as clones (13 duplicated lines each): all three repeat the identical constructor/`getProjectSdkService`+`uiService`/`wcp` unwrapping boilerplate. Low-impact (small, DI-boilerplate), but a shared base or helper (`resolveWcp(projectSdk)`) would remove it.
- `services/LoggerService/LoggerService.ts` duplicates the entire log-level/pino-stream/log-file-naming logic already implemented once in `@webiny/logger` (confirmed at level 0: that package has no consumers because this package reimplements it standalone, with a different config path resolution based on `findUpSync("webiny.config.tsx")` rather than the shared package's project-root logic).

## Dead code
None found. Every abstraction and service checked (`DefaultAppsService`, `IsCi`, global options, graceful error handlers) has a live registration in `createCliContainer.ts` and/or a hosting-package override; codegraph shows real consumers for the exported `defineExtension`-based extension points.

## Convention issues
None found. DI implementations are one-per-file, named by class (`DefaultLoggerService`, `DefaultUiService`, etc.), namespaces match (`LoggerService.Interface`), and the two barrel files (`exports/cli.ts`, `exports/cli/command.ts`) only re-export what extension authors/hosting packages need — no internal DI wiring leaks through them.

## Test gaps
Only one test file exists in the whole package: `packages/cli-core/__tests__/UiService.test.ts`. None of the following have any test coverage: `createCliContainer`/`Cli` bootstrap, `GetCliRunnerService`'s yargs wiring (param/option registration, the `version`-name-conflict guard, the `fail` handler's error-message branching), any of the Wcp commands (login/logout/whoami/link-project — including the `open` bug above, which a basic handler-execution test would have caught), `BuildCommand`/`buildRunners/*`, `DepsSync` (`DependencyTree`, `BuildDependencyTree`, `createDependencyTree`), `ensureSameWebinyPackageVersions`, and `UpgradeCommand`/`UpgradeCommandHandler`.

## Recommendations
1. Fix the `open` import bug in `LinkProjectCommand.ts` (add `import open from "open";`) — this is a shipped, reachable crash in an interactive command path.
2. Add handler-level tests for at least the Wcp commands and `BuildCommand`/`buildRunners`, since this package has effectively zero coverage outside `UiService`, and the missing-`open`-import bug is exactly the class of error a smoke test would catch.
3. Replace the hand-rolled `pino`-based `DefaultLoggerService` with a thin adapter over `@webiny/logger`, and fix `UpgradeCommand.ts:113` to actually pass through `params.debug` instead of a hardcoded `true`.

## Security findings
None found.
