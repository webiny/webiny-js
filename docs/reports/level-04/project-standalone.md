# @webiny/project-standalone

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/project-standalone` is the "standalone" (non-AWS) hosting-type implementation for `@webiny/project`: it supplies the workspace builder, build/watch/serve wiring, a local dev proxy that fronts the api + admin dev servers on one port, and the `Infra.Sqlite`/`Infra.Postgres`/`Infra.FileStorage`/`Infra.ApiUrl` extensions used to configure a self-hosted deployment, plus the deploy-artifact packaging (external-dependency copy, unused-DB-driver pruning, `start.mjs`/`package.json` emission). The package is small, consistently idiomatic (one DI abstraction/decorator per file, extensive inline rationale comments) and overall healthy; its dev-proxy and port-reservation logic is well tested, but most of the rest of the package (deploy packaging, server spawning, workspace building, extensions) has no test coverage at all, and two exported "app" helpers are unused dead code left over from copying the AWS package's shape.

## Public API
- `registerStandaloneProjectFeatures(container)` (`src/registerStandaloneProjectFeatures.ts:12`) — the composition-root entry point that wires all of this package's DI decorators/implementations into a `@webiny/project` container; consumed by `@webiny/cli-standalone`'s `GetProjectSdkService`.
- `Infra`, `Admin`, `Api`, `Project`, `Cli` namespace objects (`src/infra.ts`, `admin.ts`, `api.ts`, `project.ts`, `cli.ts`) — re-export `@webiny/project`/`@webiny/cli-core` extension components plus this package's own `Infra.Sqlite`/`Infra.Postgres`/`Infra.FileStorage`/`Infra.ApiUrl`, for use in a project's `webiny.config.tsx`; consumed by the standalone `create-webiny-project` templates (`packages/create-webiny-project/_templates/standalone/{sqlite,postgres}/webiny.config.tsx`).
- `createAdminAppConfig()` (`src/apps/createAdminAppConfig.ts:10`) — wires `@webiny/build-tools`' `createBuildAdmin`/`createWatchAdmin` for the admin app's `webiny.config.ts`; consumed by `@webiny/project-standalone-template`'s admin app template.
- `DevProxy` / `reserveDevProxyPorts` / `pointAppsAtDevProxy` / `isDevProxyEnabled` (`src/serve/devProxy/*`) — the single-port dev proxy used internally by `StandaloneServe`/`StandaloneWatch`; not consumed outside this package.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | packages/project-standalone/src/utils/getStandaloneTemplatesFolderPath.ts:6-11 | `import.meta.resolve(...)` either returns a string or throws (per Node's ESM resolver); it never returns a falsy value, so the `if (!templatePackage)` guard and its custom error message are unreachable dead code. | If the `@webiny/project-standalone-template` package is genuinely missing, the caller sees Node's raw `ERR_MODULE_NOT_FOUND` instead of the friendlier message the author intended, but nothing crashes incorrectly. | medium |

## Duplication
jscpd found no clones within the package (no `jscpd-project-standalone/jscpd-report.json` duplicate entries). No cross-package duplication of lower-level utilities (`build-tools`, `cli-core`, `global-config`, `project`) was found; the package consistently delegates to those packages' services/abstractions rather than reimplementing them.

## Dead code
- `createAdminApp` / `IAdminApp` (`src/createAdminApp.ts`) and `createApiApp` / `IApiApp` (`src/createApiApp.ts`) — codegraph: no consumers. Neither file is re-exported from `src/index.ts`, and a repo-wide search for subpath imports (`@webiny/project-standalone/createAdminApp.js` / `.../createApiApp.js`) found none. These appear to be leftovers copied from `@webiny/project-aws`'s `src/apps/{createAdminApp,createApiApp}.ts` (which *are* consumed by that package's `webiny.application.ts` templates), but the standalone hosting type has no equivalent template wiring them in.

## Convention issues
None found — DI abstractions/decorators each live in their own file, follow `Namespace.Interface`/`createImplementation`/`createDecorator` consistently, and no inline object types replace named interfaces.

## Test gaps
`__tests__/` contains only `DevProxy.test.ts` and `reserveDevProxyPorts.test.ts` (551 lines, thorough coverage of proxy routing, header rewriting, SSE/websocket handling, and port reservation/URL logic). Everything else in the package is untested: `StandaloneBuildAppWorkspaceService`, `BuildStandaloneProjectWorkspace`, `GenerateApiDbConnection` (placeholder substitution), `PruneUnusedDbDriver`/`CopyExternalDependencies`/`EmitDeployEntry` (deploy packaging), `StandaloneServe`/`StandaloneWatch`/`ServeWithBuildChecks`/`builtChecks`, `spawnApiServer`/`spawnAdminServer`/`spawnDevProxy`/`findFreePort`/`stopWithParent`, and all of the `extensions/*` (`Sqlite`, `Postgres`, `FileStorage`, `ApiUrl`) render output.

## Recommendations
1. Remove the unused `createAdminApp.ts`/`createApiApp.ts` files (or wire them in if some template was supposed to use them) to stop the dead AWS-shaped code from drifting further from what this hosting type actually needs.
2. Add tests for the deploy-packaging chain (`GenerateApiDbConnection`, `PruneUnusedDbDriver`, `CopyExternalDependencies`, `EmitDeployEntry`) — this is the code that assembles the artifact users actually deploy, and a regression here (e.g. pruning the wrong driver) would only surface at runtime in production.
3. Simplify or remove the unreachable falsy-check in `getStandaloneTemplatesFolderPath` and replace it with a `try/catch` around `import.meta.resolve` if a friendlier error message is actually wanted.
