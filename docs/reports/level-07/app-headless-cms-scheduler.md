# @webiny/app-headless-cms-scheduler

> Level 7 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/app-headless-cms-scheduler` is the thin admin-UI integration layer that wires `@webiny/app-scheduler`'s generic "Schedule On" dialog and list view into the Headless CMS content-entries browser and entry editor: it registers a "Schedule publish/unpublish" menu item in both the entries browser (`Browser/MenuItem.tsx`) and the entry editor (`Editor/MenuItem.tsx`), decorates the entries-list presenter (`ContentEntriesPresenterSchedulingDecorator`) so scheduled-action badges refresh as the visible rows change, and exposes a small `ScheduledActionsPresenter` that caches fetched scheduled actions by target entry id. The package is small (~1k lines), architecturally consistent with the rest of the CMS admin app (MVP presenter + DI feature/abstraction/implementation pattern, decorators used correctly to compose behavior onto `ContentEntriesPresenter`), and has no internal duplication (`jscpd`: 0 clones). The main gaps are a real async-race in `ScheduledActionsPresenter` (out-of-order responses can overwrite fresher data) and a complete absence of automated tests.

## Public API
- `MenuItem` (`components/Browser/MenuItem.tsx`, `components/Editor/MenuItem.tsx`) — registered into `ContentEntryListConfig.Browser.Entry.Action`/the entry-editor menu via `BrowserConfig.tsx`/`EditorConfig.tsx`; these are the package's UI entry points, consumed only by the CMS admin app's config wiring (`index.tsx`), not exported for reuse elsewhere.
- `ContentEntriesPresenterSchedulingDecorator` (`presentation/scheduledActions/ContentEntriesPresenterSchedulingDecorator.ts`) — a `ContentEntriesPresenter.createDecorator`; registered once from this package's `index.tsx` onto `@webiny/app-headless-cms`'s content-entries list presenter.
- `useScheduledActionsPresenter` (`hooks/useScheduledActionsPresenter.ts`) — thin hook wrapper around the DI-resolved `ScheduledActionsPresenter`; used by both `MenuItem` components and (transitively) by the browser's `CellLive`/`ScheduledTag` cell renderers to look up a given entry's pending schedule.
- `usePermissions` (`hooks/usePermissions.ts`) — wraps `@webiny/app-headless-cms`'s `usePermission().canPublish/canUnpublish("cms.contentEntry")`; used by both `MenuItem` components to decide whether to render the "Schedule" menu item at all.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/app-headless-cms-scheduler/src/presentation/scheduledActions/ScheduledActionsPresenter.ts:62-103` | Neither `fetchModel()` nor `fetchEntry()` guards against out-of-order network responses: `loadForModel`/`loadForEntry` reassign `_lastLoad` and immediately invoke the new fetch, but the previous fetch's in-flight promise is not cancelled or superseded — whichever `await this.listGateway.execute(...)`/`await this.getGateway.execute(...)` resolves last simply overwrites `_scheduledActions` via `runInAction(() => this._scheduledActions.replace(...))`/`.set(...)`. | The list-presenter decorator calls `loadForModel` every time the visible rows change (`ContentEntriesPresenterSchedulingDecorator.ts:39-51`, on a MobX `reaction`), which can fire in quick succession while paginating/filtering/sorting. If an earlier `fetchModel` call's paginated fetch (it loops `while (after)` across pages, `ScheduledActionsPresenter.ts:67-80`) is still in flight when a newer one starts and finishes first, the older, now-stale result can land afterwards and silently overwrite the newer one, showing outdated "scheduled" badges until the next row change. | medium |
| 2 | low | `packages/app-headless-cms-scheduler/src/presentation/scheduledActions/ScheduledActionsPresenter.ts:85-87,100-101` | Fetch failures are caught and only `console.error`'d; there is no user-visible error state or retry, so a failed load leaves whatever was previously in `_scheduledActions` (possibly stale or empty) with no indication to the admin that the "scheduled" badges may be wrong. | If `listScheduledActions`/`getScheduledAction` fails once (network blip, permission change), the entries list silently keeps showing the last-known (or no) scheduling state with no way for the user to know it's out of date short of a manual refresh action that also isn't exposed. | low |

## Duplication
`jscpd` reports zero clones within the package (0/936 lines duplicated). No reimplementation of lower-level utilities was found; the package correctly delegates to `@webiny/app-scheduler`'s `useScheduleDialog` for the actual dialog/gateway logic rather than reimplementing it, consistent with that package's own report noting `app-headless-cms-scheduler` as one of its 5 documented external call sites.

## Dead code
None found. Every exported symbol (`MenuItem` x2, the decorator, the two hooks, `isScheduleRedundant`, `createNamespace`) is wired into `index.tsx`'s `BrowserConfig`/`EditorConfig` registration or consumed by a sibling file within the package.

## Convention issues
None significant — the DI naming (`ScheduledActionsPresenter`/`ScheduledActionsPresenterImpl`), one-abstraction-per-file, and MVP presenter conventions used elsewhere in the CMS admin app are followed consistently. `usePermissions`'s `canPublish`/`canUnpublish` checks are coarse, model-level checks (via `@webiny/app-headless-cms`'s `usePermission()`), matching the same granularity used by the rest of the CMS entries browser's action menu — consistent with, not a deviation from, the surrounding codebase's convention.

## Test gaps
The package has zero test files (`find packages/app-headless-cms-scheduler -iname "*.test.*"` and `__tests__` are both empty). Nothing exercises `ScheduledActionsPresenter`'s fetch/race behavior, `ContentEntriesPresenterSchedulingDecorator`'s reaction wiring, or `isScheduleRedundant`'s publish/unpublish redundancy logic (which has several distinct branches worth covering: scheduled-publish made redundant by a live newer version vs. the legitimate "live and scheduled" case, and scheduled-unpublish made redundant once nothing is live).

## Recommendations
1. Guard `ScheduledActionsPresenter.fetchModel()`/`fetchEntry()` against out-of-order responses (e.g. a per-call sequence token checked before committing the result to `_scheduledActions`), since the presenter is refreshed reactively and reasonably likely to have overlapping in-flight calls.
2. Add unit tests for `ScheduledActionsPresenter` (including a race-condition regression test) and for `isScheduleRedundant`'s branches, since this package currently has no automated coverage at all.
3. Surface fetch failures from `ScheduledActionsPresenter` beyond a `console.error` (e.g. a `hasError`/`lastError` observable the badge UI can check), so a failed reload doesn't silently leave stale scheduling state displayed.
