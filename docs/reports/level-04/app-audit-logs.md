# @webiny/app-audit-logs

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/app-audit-logs` is the admin-app extension that renders the "Audit Logs" screen: a filterable/sortable list backed by a MobX Repository/Gateway/UseCase DI feature, a per-row `Preview` drawer with a Payload tab plus pluggable custom tabs (AI prompt/response tabs are shipped in the same package), and a small RBAC schema wired through `app-admin`'s permissions API. It follows the monorepo's DI-feature and MVP conventions cleanly and correctly reuses `common-audit-logs`' static app/entity/action catalog instead of re-encoding it. Overall health is fair: there is no error handling for a failed `listAuditLogs` GraphQL call (the list gets stuck in a permanent loading state), the Preview drawer's Payload tab can crash on malformed JSON and — like every tab in this drawer — shows stale content when the user switches between rows without closing it (consumer-side manifestation of admin-ui's `CodeEditor` `defaultValue` bug, level 2). The package has no tests at all.

## Public API
- `AuditLogs` (`src/index.tsx`) — the top-level extension component (menu item, route, permissions, DI feature registration); consumed once by the admin app project layer that assembles all `app-*` extensions (not itself part of this package).
- `AuditLogsListConfig` / `AuditLogsListWithConfig` (`src/config/list/AuditLogsListConfig.tsx`) — the `react-properties`-based configuration surface (`Browser.Filter`, `Browser.FiltersToWhere`, `Details.Tab`) used internally by `LogsModule`/`AiPromptPreviewTabs` to register filters and preview tabs; not consumed outside the package (per codegraph, no external callers).
- `useAuditLogsList` (`src/hooks/useAuditLogsList.ts`) — internal list-state hook, 1 consumer (`LogsView.tsx`).
- Types/`ActionType` re-export (`src/types.ts`) — thin wrapper re-exporting `@webiny/common-audit-logs`'s `ActionType`.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | packages/app-audit-logs/src/hooks/useAuditLogsList.ts:84-97 | The `useCase.execute(variables).then(...)` chain in the data-loading `useEffect` has no `.catch()`, and `setLoading(false)` is only called inside the success branch. | If the `listAuditLogs` query fails for any reason (a GraphQL/network error, or the gateway's own `throw new Error(envelope.error.message)` in `ListAuditLogsGateway.ts`), the promise rejects, is never caught, and `isListLoading` stays `true` forever — the Logs table shows a permanent loading spinner with no error message, and browser consoles show an unhandled promise rejection. | high |
| 2 | medium | packages/app-audit-logs/src/views/Logs/Preview/Preview.tsx:28 | `PayloadTab` re-parses `auditLog.content` inline with a bare `JSON.parse(auditLog.content)`, instead of reading `presenter.vm.content` (already computed by `AuditLogDetailsPresenter.parseContent()`, which wraps the same parse in try/catch and falls back to `{}`). | Any audit log row whose stored `content` is not valid JSON (e.g. truncated/legacy data) throws inside `PayloadTab`'s render, which — unlike the presenter's own safe path — is unguarded here, propagating as a render error for the whole Preview drawer content. | high |
| 3 | medium | packages/app-audit-logs/src/views/Logs/Preview/Preview.tsx (PayloadTab, Preview) and src/views/Logs/Preview/tabs/{SystemPromptTab,UserPromptTab,LlmResponseTab}.tsx | All four Preview tabs pass their per-row text straight into `@webiny/admin-ui`'s `CodeEditor` `value` prop, but `Preview`'s `<Tabs.Tab key="payload" .../>` (and the sibling custom tabs) keep the same React key across row switches, so `PayloadTab`/`SystemPromptTab`/etc. are updated with new props rather than remounted. Per the level-2 admin-ui audit, `CodeEditor` renders Monaco with the uncontrolled `defaultValue`, which only applies on mount. | Confirmed from the consumer side: `LogsView.tsx` renders a single `<Preview auditLog={selectedAuditLog} .../>` element (no key on `auditLog.id`), so selecting a different row while the drawer stays open re-renders the same `PayloadTab`/tab components with a new `auditLog`, but the Monaco editor keeps showing the previous row's JSON/prompt/response until the drawer is closed and reopened. | high |

## Duplication
- `FilterByCreatedBy.tsx` and `FilterByInitiator.tsx` are near-duplicates (per jscpd: 24+13+14 duplicated lines) — same `LIST_USERS` fetch, same `getValidFilterValue` helper, same `Select` wiring; the only real differences are the bound field name (`createdBy` vs `data.initiator`) and label. `FilterByInitiator` turns out to be dead code (see Dead code), so the duplication is with an unused file.
- `FilterByAction.tsx`/`FilterByApp.tsx`/`FilterByEntity.tsx` share the same `getValidFilterValue` helper (`value === "all" || value === ""` → `undefined`) copy-pasted verbatim into four filter files instead of a shared module in `src/views/Logs/Filters/`.
- `FiltersToWhere.tsx` (`src/config/list/Browser/FiltersToWhere.tsx`) is a byte-for-byte copy of the same tiny `Property`-wrapper component that also exists in `app-file-manager`, `app-website-builder`, and (with an added `modelIds` option) `app-headless-cms`. Low-value to consolidate given its size (14 lines), but any future `app-*` package adding list filtering should reuse rather than re-copy it.

## Dead code
- `src/views/Logs/Filters/FilterByInitiator.tsx` (`FilterByInitiator`) is not re-exported from the `Filters/index.tsx` barrel and not registered in `LogsModule.tsx` (which only wires `FilterByApp`, `FilterByEntity`, `FilterByAction`, `FilterByCreatedBy`, `FilterByEntityId`, `FilterByCreatedOn`). codegraph: no consumers besides its own internal calls. It also binds to `"data.initiator"`, a field that doesn't exist in `IFilterFormData` (`app`, `entity`, `entityId`, `action`, `createdBy`, `createdOn_gte/lte`), confirming it was never finished/wired up.

## Convention issues
None found beyond what's already noted above; the package's DI feature files (`abstractions.ts`/`<Name>.ts`/`feature.ts` per feature folder) and namespace-typed interfaces follow the repo-wide pattern consistently.

## Test gaps
- The package has zero test files (`__tests__` does not exist anywhere under `packages/app-audit-logs`). In particular, none of the following have any coverage: `transformRawAuditLog` (action/entity label lookup and link-building), the filter cross-reset logic in `FilterByApp`/`FilterByEntity`/`FilterByAction`/`FilterByEntityId`, `AuditLogDetailsPresenter`'s JSON parsing, or the error path in `useAuditLogsList`/`ListAuditLogsGateway` (bug #1 above would have been caught by a basic "gateway rejects" test).

## Recommendations
1. Add a `.catch()` (or wrap in try/catch) around `useCase.execute(variables)` in `useAuditLogsList.ts`, setting `loading` to `false` and surfacing an error state/toast — this is the highest-impact fix since it currently produces a silently-stuck UI on any backend failure.
2. In `Preview.tsx`, have `PayloadTab` read `presenter.vm.content` (already safely parsed) instead of re-parsing `auditLog.content` inline, and consider keying the Preview drawer's tab content (or the `Tabs` itself) by `auditLog.id` so `CodeEditor` remounts per row instead of relying on Monaco's `defaultValue` refreshing.
3. Delete the orphaned `FilterByInitiator.tsx`, or finish wiring it if an "Initiator" filter distinct from "Created by" was actually intended; either way its duplicated fetch-and-select logic with `FilterByCreatedBy.tsx` should not ship unused.
