# @webiny/project-aws — Extensions, features and services

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
This slice covers `packages/project-aws/src/{extensions,features,apps,abstractions,services,utils,exports}` — the non-Pulumi half of the package: the `<ProjectAws>` extension tree that wires ~25 deployment lifecycle hooks (build/watch gates, admin env vars, auto-install, blue/green, telemetry/encryption checks) on top of `@webiny/project`'s abstractions, plus the small `app-lambda-watch` machinery that hot-swaps deployed Lambda code during local development. Overall the code is small, readable, and mostly single-purpose per file, consistent with the rest of the package's DI style. Health is good but not exercised by tests (only `routePath.ts` and `Smtp.tsx` have coverage), and it has one real functional bug (an unfinished CLI command), a couple of copy-paste-driven duplications, and one security finding (logged separately). It confirms rather than adds to the level-2 `IsRemotePulumiBackendService`/`PulumiLoginService` env-var mismatch: `ValidateProductionPulumiState.ts` calls `IsRemotePulumiBackendService.execute()` directly with no local re-implementation or additional env-var variant of its own.

## Public API
- `ProjectAws` (`extensions/ProjectAws.tsx`) — the JSX extension tree assembling all AWS-specific hooks; rendered from the package's top-level `project.ts`/`admin.ts`/`api.ts` (outside this slice).
- `apps/create*App`/`createAdminAppConfig`/`createReactAppConfig` (`apps/index.ts`) — consumed by the generated project's `webiny.config.ts` files under `_templates/appTemplates/*` (e.g. `createAdminAppConfig()` is the literal entry point for `admin/webiny.config.ts`).
- `AdminStackOutputService`/`ApiStackOutputService`/`CoreStackOutputService` (`abstractions/services/*`, implemented in `services/*`) — consumed throughout this slice (env-var setting, deployment gates, S3 upload) and by the Pulumi slice.
- `ApiGqlClient`/`InvokeLambdaFunction` (`abstractions/*`, implemented in `features/*`) — used by `AutoInstallAfterApiDeploy` to call the deployed GraphQL API from the CLI.
- `exports/infra*.ts` — re-exports the above abstractions plus the `*Pulumi` feature hooks (`AdminPulumi`, `ApiPulumi`, `CorePulumi`, `SetAdminCustomDomains`, `SetApiCustomDomains`) as the package's documented extension-authoring surface for consumers building custom Pulumi extensions.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `extensions/ProjectAws/BlueGreenDeployments/SetPrimaryVariantCliCommand.ts:65-67` | The registered `set-variant` CLI command's `handler` is an empty function with a `// TODO: Finish this.` comment; the command is fully wired (`<CliCommand src={...} />` in `ProjectAws.tsx:68`) and validates its `--primary`/`--secondary` options, but running it performs no actual variant switch. | A user runs `yarn webiny set-variant --env=dev --primary=blue --secondary=green` expecting the blue/green router's primary variant to change; the command exits successfully having done nothing, with no error or warning that the feature is unimplemented. | high |
| 2 | low | `extensions/ProjectAws/BlueGreenDeployments/EnsureVariantBeforeDeploy.ts:3` | The implementation class is named `PrintDeploymentInfoAfterDeployImpl` (copy-pasted from the neighboring `PrintDeploymentInfoAfterDeploy.ts`) even though it implements `BeforeDeploy.Interface` and is exported as `EnsureVariantBeforeDeploy`. Purely cosmetic — TypeScript doesn't care — but it will confuse anyone stepping through a stack trace or searching by class name. | N/A (naming only, no runtime effect). | high |
| 3 | medium | `packages/project-aws/src/extensions/ProjectAws/AutoInstall/AutoInstallAfterApiDeploy.ts` | Security finding SEC-13 — see private notes. | — | high |

## Duplication
- `extensions/ProjectAws/SetAdminEnvVars/SetAdminEnvVarsBeforeBuild.ts:5-23` and `.../SetAdminEnvVarsBeforeWatch.ts:5-23` are near-identical wrappers (confirmed by jscpd) around the shared `SetAdminEnvVars` class — acceptable, since each implements a different DI abstraction (`AdminBeforeBuild` vs `AdminBeforeWatch`), but the whole 20-line body could be a single generic decorator factory instead of two copies.
- `extensions/ProjectAws/EnsureApiDeployedBeforeAdminWatch.ts:16-28` / `EnsureApiDeployedBeforeWatch.ts:16-28`, and `EnsureApiDeployedBeforeAdminBuild.ts:16-31` / `EnsureApiDeployedBeforeWatch.ts:16-31` (all confirmed by jscpd) share the same "check stack output, otherwise throw a `GracefulError` with a deploy command hint" logic three times over, differing only in the target hook interface and a couple of strings. Same pattern as above — could collapse to one parametrized helper.
- Not caught by jscpd (files aren't textually similar enough): `apps/createAdminAppConfig.ts:7-14` and `extensions/ProjectAws/SetAdminEnvVars/SetAdminEnvVars.ts:22-25` independently set overlapping admin env vars (`PORT`, `WEBINY_ADMIN_ENV`, `WEBINY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS`) from two different execution paths — the `AdminBeforeBuild`/`AdminBeforeWatch` hook chain vs. the `commands.build()/watch()` closure invoked from the generated `admin/webiny.config.ts` (confirmed live via `packages/project-aws/_templates/appTemplates/admin/webiny.config.ts` → `createAdminAppConfig()`). They already disagree on one var: `WEBINY_ADMIN_DEBUG` is only set in `createAdminAppConfig.ts`. Low risk today because the hook runs first and env values happen to be idempotent, but the two lists can silently drift further apart since nothing keeps them in sync.

## Dead code
None found. `BackgroundTasks` (`extensions/BackgroundTasks.tsx`) and `ModelFieldCompression` (`extensions/Cms/ModelFieldCompression.tsx`) look unregistered from within this slice (neither appears in `extensions/definitions.ts` or `extensions/index.ts`), but both are in fact imported and wired in `src/api.ts` (outside this slice), so they are live.

## Convention issues
- `extensions/ProjectAws/BlueGreenDeployments/EnsureVariantBeforeDeploy.ts:3` — class name doesn't match its export/abstraction (see Bug #2); a one-abstraction-per-file / clear-naming violation carried over from copy-paste.
- `extensions/ProjectAws/BlueGreenDeployments/PrintDeploymentInfoAfterDeploy.ts:10-17` exports the `IEnvironment` interface at module scope for what is purely an internal reduce accumulator type; it isn't consumed anywhere else in the slice and should be un-exported (minor barrel-export hygiene issue, not a functional problem).

## Test gaps
Only two files in this entire slice have tests: `__tests__/routePath.test.ts` and `extensions/Mailer/Smtp.test.ts`. Everything else — all ~25 lifecycle hook classes (production-state validation, admin env var wiring, auto-install, blue/green gating, encryption/telemetry enforcement) and the `apps/*`/`services/*`/`features/*` helpers — has zero test coverage. Of particular concern given no tests exist to catch regressions:
- `ValidateProductionPulumiState.ts` — the production "don't deploy with local state files" safety gate (also implicated in the level-2 env-var mismatch finding).
- `SetAdminEnvVars.ts` — the env var duplication noted above could silently regress further with no test asserting the two code paths agree.
- `AutoInstallAfterApiDeploy.ts` — untested install/credential-handling logic (see security finding).

## Recommendations
1. Finish (or remove/hide) the `set-variant` CLI command (Bug #1) — as shipped it's a silent no-op that could mislead operators managing a blue/green rollout.
2. Address the security finding recorded in `docs/.reports/security.md` for this package.
3. Collapse the three "ensure X deployed before Y" hooks and the two `SetAdminEnvVars*` wrappers into a single parametrized implementation each, and reconcile `SetAdminEnvVars.ts` with `createAdminAppConfig.ts` so admin env vars are set from one place instead of two independently maintained lists.
