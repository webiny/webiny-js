# @webiny/api-headless-cms-scheduler

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-headless-cms-scheduler` is the glue package that lets Headless CMS entries be published/unpublished on a schedule: it registers a `NamespaceHandler` and `ScheduledActionHandler` implementations (`Cms/Entry/{modelId}` namespace) with `@webiny/api-scheduler`, provides `SchedulePublishEntryUseCase`/`ScheduleUnpublishEntryUseCase` for creating those schedules, and wires four event handlers that cancel a pending scheduled action when an entry/revision is manually published, unpublished, or deleted. The package is small, consistently follows the DI use-case/feature pattern, and its own schedule-creation use cases do run a CMS `AccessControl.canAccessEntry` check before calling into `api-scheduler`. A security-related gap in the execution-side handlers is tracked privately (SEC-36 addendum). Two of the four entry-delete cancellation handlers are wired to the same underlying event and do overlapping work. Test coverage is a single happy-path test.

## Public API
- `CmsSchedulerFeature` (`src/CmsSchedulerFeature.ts`) — the feature's DI registration entry point, consumed by `packages/webiny/src/api/cms/scheduler.ts` (the composition root that wires CMS scheduling into a project's backend).
- `SchedulePublishEntryUseCase` / `ScheduleUnpublishEntryUseCase` (`src/exports/api/cms/scheduler.ts`) — codegraph confirms `packages/webiny/src/api/cms/scheduler.ts` as the external caller (4 references total, otherwise internal to this package plus its own test).
- `PublishEntryActionHandler` / `UnpublishEntryActionHandler` / `NamespaceHandler` — implementations of `@webiny/api-scheduler`'s `ScheduledActionHandler`/`NamespaceHandler` abstractions; registered only, not called directly by consumers — `api-scheduler`'s own dispatch loop resolves and invokes them by namespace.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `src/features/PublishActionHandler/PublishEntryActionHandler.ts`, `UnpublishActionHandler/UnpublishEntryActionHandler.ts`, `NamespaceHandler/NamespaceHandler.ts` | Security finding — see private notes (SEC-36 addendum). | — | high |
| 2 | low | `src/features/CancelScheduledActionOnEntryChange/CancelScheduledActionOnEntryDeleteEventHandler.ts:15-58` and `CancelScheduledActionOnRevisionDeleteEventHandler.ts:15-52` | Both classes implement the same `EntryAfterDeleteEventHandler` interface/event (imported from the same `.../DeleteEntry/events` module) with no discriminator, and both get registered in `CmsSchedulerFeature`. The "entry delete" handler already cancels every schedule whose `targetId` starts with `${entryId}#` (i.e. all revisions), which is a superset of the "revision delete" handler's exact `targetId: entry.id` match. | Every single entry-delete event runs two separate `listScheduledActions`/`cancelScheduledAction` round-trips where the second is always redundant with the first, doing unnecessary DB reads/writes on every delete. Not incorrect, just wasted work registered as if it were two distinct concerns. | medium |

## Duplication
- Within the package (confirmed by jscpd): `PublishEntryActionHandler.ts` and `UnpublishEntryActionHandler.ts` share ~27-30% duplicated lines (the fetch-model → fetch-entry → fetch-published-entries → branch-on-scenario skeleton). `SchedulePublishEntryUseCase.ts` and `ScheduleUnpublishEntryUseCase.ts` are ~31-39% duplicated — identical structure differing only in the `pw` permission flag (`"p"` vs `"u"`) and `ScheduledActionType`. A small shared helper (e.g. "load model+entry+published state" and "check-access-then-schedule") would remove most of this.
- The four `CancelScheduledActionOn*` handlers are near-identical boilerplate (list by namespace/targetId, loop, cancel, swallow errors) — reasonable given each binds to a different domain event, but see Bug #2 for the one pair that's genuinely redundant rather than just similarly-shaped.

## Dead code
None found — every exported use case/handler has a confirmed registration point or external caller (codegraph).

## Convention issues
None found — abstraction/implementation split, one class per file, and DI registration all follow the documented pattern.

## Test gaps
- Only one test exists (`__tests__/actionHandlers.test.ts`, happy-path publish/unpublish). No test exercises: `SchedulePublishEntryUseCase`/`ScheduleUnpublishEntryUseCase`'s `AccessControl.canAccessEntry` rejection path, any of the four `CancelScheduledActionOn*` event handlers, the "different revision is published" branches in `PublishEntryActionHandler`/`UnpublishEntryActionHandler`, or the `NamespaceHandler`'s title-resolution path.

## Recommendations
1. Address the security gap tracked privately (SEC-36 addendum).
2. Drop or merge `CancelScheduledActionOnRevisionDeleteEventHandler` with `CancelScheduledActionOnEntryDeleteEventHandler` since they react to the same event and the latter's query already covers the former's case.
3. Extract the shared "resolve model → resolve entry → resolve published entries" logic out of `PublishEntryActionHandler`/`UnpublishEntryActionHandler`, and the shared "check access → scheduleAction" logic out of the two `Schedule*EntryUseCase`s, then add tests for the access-denied and multi-revision branches.
