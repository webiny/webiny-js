# @webiny/build-tools

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

Plain-JS (no TypeScript, no `tsconfig`) collection of build/watch/test tooling used by essentially every package and app in the monorepo: rsbuild/rspack configs and factories for building admin apps (`createBuildAdmin`/`createWatchAdmin`), serverless functions (`createBuildFunction`/`createWatchFunction`), and library packages (`createBuildPackage`/`createWatchPackage`, with tsc compilation, `.d.ts` alias rewriting, and ESM-import-extension validation), plus a `PackageJson` helper, a workspace symlinker, and test-preset resolution used by `vitest.setup.ts` across many packages. It is depended on (directly, via `webiny.config.js`) by ~148 packages, so bugs here have very wide blast radius. Overall the code is solid and well-commented, but there is one real, high-impact inconsistency between what the package's own `.d.ts` promises and what the admin/function build factories actually do with their arguments (see Bugs #1), plus a couple of smaller issues.

## Public API

- `createBuildPackage`/`createWatchPackage` (`packages/createBuildPackage.js`, `packages/createWatchPackage.js`) — the config→options currying actually plumbs both objects through (`prepareOptions`), so `overrides.tsConfig` really is applied. Used by essentially every library package's `webiny.config.js`.
- `createBuildAdmin`/`createWatchAdmin`/`createBuildFunction`/`createWatchFunction` (`bundling/admin/*.js`, `bundling/function/*.js`) — used by admin apps and serverless function packages (e.g. `project-aws`/`project-standalone-template` app templates, `~148` packages import from `@webiny/build-tools` in their `webiny.config.js`).
- `PackageJson` (`utils/PackageJson.js`) — used outside the package too, e.g. `packages/project/src/services/GetAppPackagesService/GetAppPackagesService.ts` imports it directly via `@webiny/build-tools/utils/PackageJson.js`.
- `linkWorkspaces` (`workspaces/linkWorkspaces.js`) — used by the repo-root `scripts/linkWorkspaces.js` (run as part of `yarn`/postinstall workspace linking).
- `getPresets` (`testing/presets.js`) — used by `vitest.setup.ts` in several packages (e.g. `common-audit-logs`) to resolve storage-specific test presets.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | high | `bundling/admin/createBuildAdmin.js:4-6`, `createWatchAdmin.js:3-5`, `bundling/function/createBuildFunction.js:4-6`, `createWatchFunction.js:3-5` vs. `index.d.ts:16-53` | All four factories are `() => async ({ cwd }) => {...}` — the **outer call silently ignores whatever argument is passed to it**, and the inner function only ever reads `cwd`. But every real caller (e.g. `packages/project-aws/_templates/appTemplates/api/graphql/webiny.config.ts`) writes `createBuildFunction({ cwd: import.meta.dirname })`, and `index.d.ts` documents `BuildAppConfig`/`BuildFunctionConfig` — including `overrides`, `openBrowser`, `logs`, `debug`, `sourceMaps` — as if they configure the factory at this call. | Any `webiny.config.ts` that tries to use the documented `overrides`/`debug`/`logs`/`sourceMaps` options on `createBuildFunction`/`createBuildAdmin` (e.g. `createBuildFunction({ cwd, overrides: { entry: "custom.ts" } })`) has that config **silently dropped** — it never reaches `createRsbuildConfig`, which only ever receives `{ cwd }` re-supplied later by `packages/project/src/features/BuildApp/PackagesBuilder/worker.ts:35-52` (`config.commands.build(options)`, where `options` is built independently by the worker, not from what was written in the config file). The `cwd` passed at config-definition time happens not to matter only because the worker recomputes its own `cwd` from the package path and calls the returned function with that — but that's incidental, and none of `overrides`/`debug`/`logs` from the `.d.ts` contract ever gets used by these four functions at all (contrast with `createBuildPackage`/`createWatchPackage`, which do plumb `overrides` through via `prepareOptions`). | high |
| 2 | medium | `workspaces/linkWorkspaces.js:23-30` | In `symlink()`, the "skip if already correctly linked" check does `const resolved = dest; if (resolved === src) return;` — `resolved` is just reassigned from `dest` (the link's own path), never the symlink's actual target (which would need `await fs.readlink(dest)`). Since `dest` (an absolute `node_modules/@webiny/<pkg>` path) can never equal `src` (a relative path computed via `path.relative`), this comparison is always false. | Every run of `linkWorkspaces` (invoked by `scripts/linkWorkspaces.js` during `yarn`) deletes (`rimraf.sync`) and recreates every single package symlink under `node_modules`, even when nothing changed — the intended fast-path that should no-op on an up-to-date symlink never triggers. Not data-lossy, but defeats the purpose of the check and adds unnecessary filesystem churn on every install across the whole monorepo. | high |
| 3 | low | `testing/presets.js:25-29` | In `getStorage`, `const args = yargs(argv); const argsValue = args.storage;` — `yargs(argv)` returns the yargs builder/`Argv` object, not parsed arguments; parsed values require `.argv`/`.parseSync()`. `args.storage` is therefore always `undefined` (confirmed by direct execution), so this branch never contributes a value. | No observable behavior difference today because the two fallback branches below it (regex match on `--storage=x` at line 33-43, and index-based `--storage x` lookup at line 47-57) already cover the real CLI invocations, but the code is dead/misleading — a future edit relying on "yargs already handles `--storage`" would be wrong. | high |

## Duplication

No jscpd report exists for this package (no `src/` directory — it's plain JS at the package root, not scanned by the clone tool). No obvious internal duplication was found while reading; `buildDirect`/`buildWithSafeReplace` in `packages/buildPackage.js:43-93` share the "clear dist contents" loop verbatim (lines 47-51 and 80-83) but this is a small, intentional near-duplicate (safe-replace additionally handles the staging-dir swap) rather than a maintenance risk worth extracting.

## Dead code

`utils/PackageJson.backup.ts` (45 lines) is an unused, never-built leftover — the package has no `tsconfig*` anywhere (confirmed: `find packages/build-tools -iname "tsconfig*"` returns nothing), so this `.ts` file is never compiled or imported by anything; the real, used implementation is the plain-JS `utils/PackageJson.js` right next to it (44 lines, structurally identical). Its own top comment ("We'll use this class once the package is converted to TS!") confirms it's an intentional-but-abandoned placeholder.

## Convention issues

- `utils/PackageJson.backup.ts` duplicates `utils/PackageJson.js` under a different, non-standard filename (`.backup.ts` is not a recognized extension pattern anywhere else in the repo) — per `AGENTS.md`'s "one abstraction per file" spirit, a stale parallel copy like this should be removed rather than left beside the live version.
- `packages/buildPackage/typescript/runTsc.js:13` throws a plain object literal (`throw { message: ... }`) instead of an `Error`, losing the stack trace and breaking `instanceof Error` checks anywhere upstream that might rely on them (nothing in this package catches/normalizes it before it propagates to the CLI entry point).

## Test gaps

No `__tests__` directory exists anywhere in the package. Given ~148 packages depend on it directly, and it contains non-trivial logic (`buildWithSafeReplace`'s staging-dir swap, `replaceTscAliases`'s regex-based `.d.ts` alias rewriting, `validateEsmImports`'s AST-based import scanning, the currying bug in Bugs #1), none of this has any automated regression coverage — issues here are currently only caught by developers noticing broken builds.

## Recommendations

1. Fix the `createBuildAdmin`/`createWatchAdmin`/`createBuildFunction`/`createWatchFunction` factory signatures (Bugs #1) so the documented `overrides`/`debug`/`logs`/`sourceMaps` options actually reach `createRsbuildConfig`, or update `index.d.ts` to stop promising configuration the runtime ignores — this is the highest-impact finding given the package's reach.
2. Fix the dead symlink-equality check in `linkWorkspaces.js` (Bugs #2) by comparing against `await fs.readlink(dest)` instead of `dest` itself, so `yarn` workspace linking stops needlessly rebuilding every symlink.
3. Delete `utils/PackageJson.backup.ts` (confirmed dead, never built) and remove/replace the dead yargs branch in `testing/presets.js` (Bugs #3) to avoid misleading future maintainers.
