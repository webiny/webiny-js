# @webiny/api-website-builder-scheduler

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-website-builder-scheduler` is the glue package that lets Website Builder pages and redirects be published/unpublished on a schedule: it registers `PageNamespaceHandler`/`RedirectNamespaceHandler` (namespace `WebsiteBuilder/Type/page|redirect`) and `Publish/UnpublishPageActionHandler`/`Publish/UnpublishRedirectActionHandler` execution handlers with `@webiny/api-scheduler`, provides `SchedulePublish/UnpublishPage/RedirectUseCase` for creating those schedules, and four `CancelScheduledActionOnChange` event handlers that cancel a pending scheduled action when a page/redirect is manually published, unpublished, or deleted. It is structurally a near-mirror of `@webiny/api-headless-cms-scheduler` (level 8), but drifts from it in two ways: security-relevant drift is tracked privately (SEC-36 addendum), and its `CancelScheduledActionOnChange` handlers read a `Result` value without checking `isFail()` first. Test coverage is minimal (two happy-path tests covering only the publish/unpublish execution handlers).

## Public API
- `SchedulePublishPageUseCase` / `ScheduleUnpublishPageUseCase` / `SchedulePublishRedirectUseCase` / `ScheduleUnpublishRedirectUseCase` (`src/exports/api/website-builder/scheduler.ts`) — registered in DI and re-exported, but codegraph shows no invocation site anywhere in the monorepo beyond this package's own registration/export/tests. In practice, scheduling is created by the admin UI calling `@webiny/api-scheduler`'s generic `scheduleAction` GraphQL mutation directly with a namespace string it computes itself (`app-website-builder-scheduler/src/utils/namespace.ts`'s `WB_PAGE_NAMESPACE`/`WB_REDIRECT_NAMESPACE`, matching this package's `createNamespace()` output) — this package's own use cases are not part of that call path.
- `PageNamespaceHandler` / `RedirectNamespaceHandler`, `PublishPageActionHandler` / `UnpublishPageActionHandler` / `PublishRedirectActionHandler` / `UnpublishRedirectActionHandler` — implementations of `@webiny/api-scheduler`'s `NamespaceHandler`/`ScheduledActionHandler` abstractions, resolved and invoked by `api-scheduler`'s own dispatch loop by namespace, not called directly by any consumer in this package.
- `WebsiteBuilderSchedulerFeature` (`src/WebsiteBuilderSchedulerFeature.ts`) — the DI registration entry point, consumed by `packages/webiny/src/api/website-builder/scheduler.ts` (the composition root that wires website-builder scheduling into a project's backend), mirroring the CMS package's `CmsSchedulerFeature`.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `src/features/SchedulePublishPageUseCase/SchedulePublishPageUseCase.ts`, `ScheduleUnpublishPageUseCase/ScheduleUnpublishPageUseCase.ts`, `SchedulePublishRedirectUseCase/SchedulePublishRedirectUseCase.ts`, `ScheduleUnpublishRedirectUseCase/ScheduleUnpublishRedirectUseCase.ts`, `PublishActionHandler/*`, `UnpublishActionHandler/*` | Security finding SEC-36 — see private notes (SEC-36 addendum). | — | high |
| 2 | medium | `src/features/CancelScheduledActionOnChange/CancelScheduledActionOnPageDeleteEventHandler.ts:34`, `CancelScheduledActionOnRedirectDeleteEventHandler.ts:34` (same pattern present in `CancelScheduledActionOnPagePublishEventHandler.ts` and `CancelScheduledActionOnPageUnpublishEventHandler.ts`, confirmed via the jscpd clone matching the identical block) | Each handler does `const actionsResult = await this.listScheduledActions.execute({...}); const actions = actionsResult.value.items;` with no `actionsResult.isFail()` check. `ListScheduledActionsUseCase.execute()` (`packages/api-scheduler/src/features/ListScheduledActions/ListScheduledActionsUseCase.ts:39-41`) returns `Result.fail(new NotAuthorizedError())` whenever the current identity fails its own `canRead("action")` permission check, in which case `.value` is `undefined`. | An identity that can delete/publish/unpublish a Website Builder page or redirect (i.e. has `wb.page`/`wb.redirect` permission) but has no `scheduler.action` permission triggers a `TypeError: Cannot read properties of undefined (reading 'items')` inside this "after" event handler on every such page/redirect delete, publish, or unpublish — the exact same permission combination is entirely plausible in a real tenant where scheduler access is granted separately from content access. | medium |

## Duplication
Within the package (confirmed by jscpd, 7 clone pairs, all in `src/features/`):
- `SchedulePublishPageUseCase.ts`, `ScheduleUnpublishPageUseCase.ts`, `SchedulePublishRedirectUseCase.ts`, `ScheduleUnpublishRedirectUseCase.ts` share an identical body (construct params, call `scheduleAction.execute`, map `Result`), differing only in the namespace constant and `ScheduledActionType{Publish,Unpublish}`.
- `CancelScheduledActionOnPagePublishEventHandler.ts`, `CancelScheduledActionOnPageUnpublishEventHandler.ts`, `CancelScheduledActionOnPageDeleteEventHandler.ts`, and `CancelScheduledActionOnRedirectDeleteEventHandler.ts` share the identical "list by namespace/targetId, loop, cancel, swallow errors" skeleton (including the missing `isFail()` check above).

Drift vs. `@webiny/api-headless-cms-scheduler` (level 8): the four `Schedule*UseCase` classes mirror the CMS equivalents; security-relevant drift is tracked privately (SEC-36 addendum).

## Dead code
- `SchedulePublishPageUseCase`, `ScheduleUnpublishPageUseCase`, `SchedulePublishRedirectUseCase`, `ScheduleUnpublishRedirectUseCase` — codegraph: no consumers beyond this package's own DI registration, its public re-export, and its own tests. Medium confidence they are unreachable in production: this package exposes no GraphQL/REST route of its own, and the only wired path that creates a scheduled action is `api-scheduler`'s generic `scheduleAction` mutation, called directly by `app-website-builder-scheduler`'s frontend components with a namespace string it computes independently.

## Convention issues
None found — DI naming (implementation files named after the class, abstraction/implementation split), one abstraction/implementation per file, and minimal barrel exports (`src/exports/api/website-builder/scheduler.ts` and `src/index.ts` each re-export only what's needed) are all followed consistently, matching the sibling CMS package.

## Test gaps
Only `__tests__/pageActionHandlers.test.ts` and `__tests__/redirectActionHandlers.test.ts` exist, and both cover only the happy path of the four `Publish/UnpublishPageActionHandler`/`Publish/UnpublishRedirectActionHandler` classes. Entirely untested: all four `Schedule*UseCase` classes, `PageNamespaceHandler`/`RedirectNamespaceHandler`'s title-resolution logic, and all four `CancelScheduledActionOnChange` event handlers — which is exactly where the missing-`isFail()` bug (#2 above) lives untested.

## Recommendations
1. Address the security finding tracked privately (SEC-36 addendum: website builder).
2. Add the missing `actionsResult.isFail()` check to all four `CancelScheduledActionOnChange` handlers before accessing `.value.items`, and add a test exercising the `NotAuthorizedError` path.
3. Add unit tests for the four `Schedule*UseCase` classes and the `NamespaceHandler` implementations, since they currently have zero coverage despite being the package's main use-case-layer logic.
