# @webiny/app-serverless-cms

> Level 10 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/app-serverless-cms` is the single admin-app composition root: its `<Admin>` component (`src/Admin.tsx`) wraps `@webiny/app-admin`'s base `<Admin>` and unconditionally renders every optional feature module Webiny ships (File Manager, Headless CMS, Audit Logs, Record Locking, Website Builder, Scheduler, Workflows, Websockets, Webhooks, Background Tasks, etc.) into one tree; this is the component both hosting-type project templates (`project-aws-template`, `project-standalone-template`) import to build their generated Admin app. Architecturally it's just composition — no business logic of its own — so overall health is fine, but because it renders every feature's UI unconditionally, it is the place where a UI/backend registration mismatch (features with no corresponding backend package installed) becomes user-visible; a concrete instance of that is documented below.

## Public API
- `Admin` / `AdminProps` (`src/Admin.tsx`) — the admin app composition root. Consumed by exactly 2 places per codegraph: `packages/project-aws/_templates/appTemplates/admin/src/App.tsx` and `packages/project-standalone-template/template/appTemplates/admin/src/App.tsx` (i.e. every generated project's Admin app, both hosting types).
- `src/index.tsx` re-exports ~30 more symbols from `@webiny/app-admin` (`useApp`, `Dashboard`, `Layout`, `Provider`, `Compose`, `Plugins`, `Navigation`, `Tags`, `UserMenu`, composition helpers like `makeComposable`/`makeDecoratable`, etc.) — these are consumed by third-party/first-party extension authors building on top of the generated admin app, not by this package itself.

## Bugs

**Main-session verification (refuted):** the backend packages are pulled in transitively. `@webiny/api-event-handler-core` (a dependency of both composition roots) depends on `api-headless-cms-scheduler`, `api-headless-cms-workflows`, `api-website-builder-workflows` and `api-website-builder-scheduler`; `api-event-handler-standalone` brings `api-scheduler`, `api-scheduler-standalone` and `background-tasks-standalone`; `api-event-handler-standalone-sql` brings `api-audit-logs-sql`. The "missing backend" rows below are therefore not bugs; the only valid observation is that these dependencies are implicit rather than declared by the template.
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | ~~high~~ refuted | packages/app-serverless-cms/src/Admin.tsx:59 (`<WbScheduler />`, imported from `@webiny/app-website-builder-scheduler`) | `Admin.tsx` unconditionally renders the Website Builder "schedule publish/unpublish" UI for every generated project, but `@webiny/api-website-builder-scheduler` (the matching backend namespace-handler package) is not a dependency of `project-aws-template/package.json`, `project-standalone-template/package.json`, nor the standalone hosting type's generated API app (`project-standalone-template/template/appTemplates/api/graphql/package.json`) — confirmed by reading all three manifests in full. By contrast the analogous CMS-side feature (`CmsScheduler`, backed by `@webiny/api-headless-cms-scheduler`) *is* wired into both. | A user in any newly generated Webiny project opens a Website Builder page/redirect and uses "Schedule publish/unpublish" from the UI; the backend package that would actually process that scheduled action was never installed, so the schedule silently has no effect (or the underlying GraphQL call errors) once deployed. | high |
| 2 | ~~high~~ refuted | packages/app-serverless-cms/src/Admin.tsx:39-61 (`AuditLogs`, `CmsScheduler`, `CmsWorkflows`, `WebsiteBuilderWorkflows`, `SchedulerModule`, `BackgroundTasks`) | For the standalone hosting type specifically, `project-standalone-template/template/appTemplates/api/graphql/package.json` lists only `api-event-handler-standalone-sql`, `api-aco`, `api-core`, `api-file-manager`, `api-headless-cms`, `api-headless-cms-aco`, `api-mailer`, `api-record-locking`, `api-website-builder`, `api-websockets`, `api-workflows`. It has none of `api-audit-logs`, `api-headless-cms-scheduler`, `api-headless-cms-workflows`, `api-website-builder-workflows`, `api-scheduler`, or `@webiny/background-tasks`, yet `Admin.tsx` renders all of the corresponding UI screens (`AuditLogs`, `CmsScheduler`, `CmsWorkflows`, `WebsiteBuilderWorkflows`, `SchedulerModule`, `BackgroundTasks`) regardless of hosting type. | A developer scaffolds a new standalone (self-hosted) project; the Admin app shows menu items for Audit Logs, content-entry/page scheduling, review workflows, and background tasks, but none of the GraphQL operations behind them exist in the deployed schema, so each screen errors on load or the mutation call fails. | high |

## Duplication
`jscpd` reports zero clones within this package (`jscpd-report.json`: `duplicates: []`). No internal duplication found.

## Dead code
Not established with confidence within budget: `src/index.tsx` re-exports roughly 30 symbols from `@webiny/app-admin`; checking each individually for external consumers was out of scope for this pass. No obviously-unused re-export was spotted by inspection.

## Convention issues
`src/index.tsx` re-exports the near-entirety of `@webiny/app-admin`'s public surface (types and values alike) rather than curating the subset `app-serverless-cms` itself needs consumers to reach through it — this runs against the repo's "minimal barrel exports" convention (only export what external consumers need). Medium confidence this is a real issue rather than an intentional convenience re-export, since there's no doc/comment explaining the choice.

## Test gaps
The package has no `__tests__` directory at all. `Admin.tsx`'s `createLegacyPlugins` wiring and the 20+-component composition tree are entirely unverified by automated tests — a broken import or ordering issue here would only surface as a runtime crash in a deployed project, not in CI.

## Recommendations
1. Close the UI/backend registration gap: either add the missing backend packages (`api-website-builder-scheduler` for both hosting types; `api-audit-logs`, `api-headless-cms-scheduler`, `api-headless-cms-workflows`, `api-website-builder-workflows`, `api-scheduler`, `background-tasks` for the standalone template specifically) to the relevant manifests, or make `Admin.tsx` render these feature blocks conditionally based on which backend packages are actually present/feature-flagged.
2. Trim `src/index.tsx`'s re-export of `@webiny/app-admin` to the symbols this package's own consumers actually need, per the repo's minimal-barrel-exports convention.
3. Add a minimal smoke test that renders `<Admin>` and asserts it doesn't throw, to catch composition/import breakage before it reaches a generated project.
