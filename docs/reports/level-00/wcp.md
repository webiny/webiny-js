# @webiny/wcp

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/wcp` is the client for Webiny Control Panel (WCP) licensing: it decrypts the `WCP_PROJECT_ENVIRONMENT`/`WCP_PROJECT_LICENSE` env vars (base64+JSON "encryption", not real crypto), fetches a project's license from the WCP API, and exposes an `ILicense` object with one `canUseXxx()` gate per paid feature (AACL, teams, folder-level permissions, audit logs, record locking, AI powerups, A/B testing, collaboration, file-manager threat detection, etc.). It also exposes small URL helpers (`getWcpApiUrl`/`getWcpGqlApiUrl`/`getWcpAppUrl`) and a `NullLicense` fallback used when no license is present. It is a small, self-contained, dependency-free (level 0) package and is generally healthy; the main risk is that it has zero automated tests despite gating dozens of paid features across the monorepo.

## Public API
- `ILicense` / `License` / `License.fromEnvironment()` / `License.fromLicenseDto()` (`src/License.ts`, `src/types.ts`) — the core licensing object. Implemented independently by `NullLicense` (this package), and re-implemented (as a delegating wrapper) by `ReactLicense` in `packages/app-admin/src/features/wcp/ReactLicense.ts`. Consumed directly by `packages/api-core/src/features/wcp/WcpLicenseLoader.ts` (27 call sites across api-* packages and their test handlers) and by `packages/project/src/services/WcpService/GetProjectLicense.ts`, `packages/project/src/decorators/GetFeatureFlagsWithLicense.ts`.
- `NullLicense` (`src/NullLicense.ts`) — safe no-license default; used by `License.fromLicenseDto`/`fromEnvironment` and instantiated directly elsewhere (e.g. `WcpLicenseLoader`).
- `getWcpProjectLicense`, `getWcpProjectEnvironment` (`src/licenses.ts`, `src/getWcpProjectEnvironment.ts`) — fetch/decrypt entry points, consumed by `WcpLicenseLoader` and `packages/project/src/services/WcpService/GetProjectLicense.ts`.
- `encrypt` / `decrypt` (`src/encryption.ts`) — used outside this package in `packages/project/src/services/InitProjectSdkService/applyWcpEnvVars.ts` and `packages/api-core/__tests__/wcp/utils.test.ts`.
- `getWcpApiUrl` / `getWcpGqlApiUrl` / `getWcpAppUrl` (`src/urls.ts`) — used by `packages/project/src/services/WcpService/WcpService.ts`.
- `createTestWcpLicense` (`src/testing/createTestWcpLicense.ts`) — test fixture, 55 call sites across the monorepo's test suites (api-core, api-aco, api-audit-logs, api-file-manager*, etc.). Heavily relied upon; not dead code.
- `WCP_FEATURE_LABEL` (`src/index.ts`) — feature-id-to-label map, used as the type constraint for `canUseFeature()`.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low-medium | `packages/wcp/src/License.ts:104-106` | `canUseFileManagerThreatDetection()` reads `features.fileManager?.options.threatDetection` directly, without first checking `features.fileManager.enabled` (i.e. without going through `canUseFeature("fileManager")`). Every other option-gated capability in the same file (`canUseTeams`, `canUseFolderLevelPermissions`, `canUseHcmsFieldPermissions`, `canUsePrivateFiles` guard on `canUseAacl()`; `canUseComments`/`canUseActivityLog` guard on `canUseCollaboration()`) checks the parent `enabled` flag first. | If a WCP license payload ever has `fileManager.enabled: false` with `fileManager.options.threatDetection: true` left over (e.g. a downgraded plan where the API doesn't zero out nested options), `canUseFileManagerThreatDetection()` returns `true` and `packages/api-file-manager-s3` enables threat-detection scanning for a project not entitled to it. There is no comment (unlike the deliberate `canUseAiPowerups()` design, which documents ignoring the parent flag) explaining this is intentional, so it reads as an oversight rather than a deliberate design choice. `createTestWcpLicense` always sets both flags together, so this path is untested either way. | medium |

## Duplication
- jscpd (`{JSCPD}`) reports **0 clones** for this package (674 lines, 9 files, 0% duplication).
- Minor in-package repetition: the 4-line guard `if (!this.canUseAacl()) { return false; } return this.license.package.features.advancedAccessControlLayer.options.<x>;` is repeated verbatim (with only `<x>` changing) across `canUseTeams`, `canUseFolderLevelPermissions`, `canUseHcmsFieldPermissions`, and `canUsePrivateFiles` in `packages/wcp/src/License.ts:62-94`. Below jscpd's clone threshold and idiomatic for this kind of feature-gate class, so low priority.
- Cross-package: `packages/app-admin/src/features/wcp/ReactLicense.ts` re-implements the entire `ILicense` surface as a pass-through delegate wrapping another `ILicense`. This isn't logic duplication (every method is a one-line forward), but it means any new `ILicense` method added in this package requires a matching mechanical addition there — worth a mention for whoever extends `ILicense` next.
- `encrypt`/`decrypt` (`src/encryption.ts`) reimplement a "base64(JSON.stringify(x))" pattern that also appears (for different purposes — pagination cursors) in `packages/utils/src/cursor.ts`, `packages/api-opensearch/src/cursors.ts`, and `packages/db-dynamodb/src/utils/cursor.ts`. Likely unavoidable here since `wcp` is dependency-level 0 and can't import `@webiny/utils`; noted only for awareness, not a real issue.

## Dead code
None found. Every exported symbol (`License`, `NullLicense`, `encrypt`/`decrypt`, `getWcpProjectLicense`, `getWcpProjectEnvironment`, the URL helpers, `createTestWcpLicense`, `WCP_FEATURE_LABEL`) has confirmed external callers via codegraph.

## Convention issues
- `packages/wcp/src/types.ts:42` uses `export declare type WcpProjectEnvironment = {...}` and `:53` `export declare type EncryptedWcpProjectLicense = string;`. `declare` has no effect on a type alias in a regular (non-ambient) `.ts` file; it's dead syntax likely left over from a copy-paste of an ambient declaration file. Harmless but confusing.
- `packages/wcp/src/License.ts:108` marks `canUseWorkflows()` `public` while every other method in the same class (and in `NullLicense`) omits the modifier (TS defaults to public). Inconsistent, not functionally meaningful.
- The DI "one abstraction/implementation per file" and "impl file matches class name" conventions from `AGENTS.md`/CLAUDE.md don't apply here — this package predates/doesn't use the `@webiny/di` `createImplementation` pattern; it's a plain class/function library, which is consistent with its level-0 status.

## Test gaps
- **The package has no `__tests__` directory at all.** `src/testing/createTestWcpLicense.ts` is a fixture consumed by 55 tests in *other* packages, but nothing in `packages/wcp` itself is tested. Untested behaviour includes:
  - Every `canUseXxx()` gate on `License` (25+ methods), including the AACL/collaboration parent-flag guard logic and the asymmetric `canUseFileManagerThreatDetection()` path flagged above.
  - `License.fromEnvironment()` / `getWcpProjectLicense()` — the `WCP_PROJECT_LICENSE` env-var override path, the fetch-failure paths (`response.ok === false`, thrown exceptions), and JSON-decrypt failure paths.
  - `getWcpProjectEnvironment()`'s decrypt-failure throw path.
  - `encrypt`/`decrypt` round-tripping and their throw-on-malformed-input paths.
  - `getWcpApiUrl`/`getWcpGqlApiUrl`/`getWcpAppUrl` env var overrides.

## Recommendations
1. Add unit tests for `License`/`NullLicense` (all `canUseXxx()` gates, especially the AACL/collaboration-nested and file-manager-threat-detection paths) and for `licenses.ts`/`getWcpProjectEnvironment.ts` error paths — currently zero coverage for a package that gates licensing/paid features monorepo-wide.
2. Decide and document whether `canUseFileManagerThreatDetection()` should check `fileManager.enabled` like its sibling AACL/collaboration gates do, or add a comment (mirroring `canUseAiPowerups()`) explaining why it deliberately doesn't.
3. Clean up the stray `declare` keyword on the two type aliases in `src/types.ts` for clarity (cosmetic, low priority).
