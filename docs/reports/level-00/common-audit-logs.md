# @webiny/common-audit-logs

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

A pure data package: it defines the `Action`/`Entity`/`App` types and the `ActionType` enum, then a static `apps` array enumerating every app/entity/action combination the Audit Logs feature knows how to display and filter (APW, File Manager, Headless CMS, Mailer, Security, Website Builder, AI). There is no logic to speak of beyond building that array from a few shared `commonActions`/`publishActions`/`trashBinActions` objects to avoid repeating `{ type, displayName }` literals. Health is fine; it's a config catalog and it reads as one.

## Public API

- `apps: App[]` (`src/apps.ts:42`) — consumed by `api-audit-logs` (`config.ts`, `utils/getAuditObject.ts`, `types.ts`) to validate/label incoming audit events, and by `app-audit-logs` (`utils/transformRawAuditLog.ts`, `views/Logs/Filters/FilterByApp.tsx`, `FilterByEntity.tsx`, `FilterByAction.tsx`) to drive the admin UI's filters and labels.
- `ActionType` enum (`src/apps.ts:3`) — re-exported by `app-audit-logs/src/types.ts` and used directly in `views/Logs/Table/styled.tsx` to color-code rows (`YELLOW_ACTIONS`/`RED_ACTIONS`).
- `Action` / `Entity` / `App` interfaces (`src/types.ts`) — the shape both consumer packages type their audit-log records against.

## Bugs

None found — there is no branching logic in this package to break; the risk (if any) is data-entry mistakes in the static catalog, and nothing inconsistent was found (every `app`/`type` used across `api-audit-logs`/`app-audit-logs` traces back to an entry here).

## Duplication

No intra-package clones (jscpd: 0 duplicates). The package itself already exists specifically to avoid apps/entities/actions being duplicated between `api-audit-logs` and `app-audit-logs`, and it uses `commonActions`/`publishActions`/`trashBinActions` internally to avoid repeating the same `{ type, displayName }` object literals across entities.

## Dead code

None — `apps`, `ActionType`, and all three types are consumed by both downstream packages.

## Test gaps

No tests, but there's essentially no behavior to test — this is a static data export. N/A beyond noting that if `api-audit-logs`/`app-audit-logs` rely on every referenced `app`/entity `type` string having a matching catalog entry, a lightweight cross-check (e.g. "every ActionType value used in `app-audit-logs` styling exists in some entity's actions list") would catch a future typo, but that check belongs in the consumer package, not here.

## Convention issues

None meaningful.

## Recommendations

1. No action needed on correctness grounds; the package is small, static, and consistent.
2. If the catalog grows further, consider grouping the per-app entity/action definitions into separate small objects merged into `apps` (each app already reads as a discrete unit) purely for readability — not urgent at current size (~200 lines).
3. None further; this is a low-risk, low-maintenance package.
