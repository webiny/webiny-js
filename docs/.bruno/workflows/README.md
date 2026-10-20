# Workflows: overview

Advanced Publishing Workflows (API and admin) as rebuilt on `bruno/refactor/workflows-flow`: workflows with typed steps (people review, automation, AI), reviewer routing, notifications, the workflow editor and the reviewer exclusions settings. This file is the map; it describes the code after phase 9c and the admin layers refactor.

## Documents

- `api.md`: the API as built: packages and registration, domain and storage, review lifecycle, use cases, permissions, GraphQL, errors, routing and step runs, app adapters and hooks, tests; sections 11-14 record what phases 8b-9c added.
- `app.md`: `app-workflows` as built in phases 8a, 8b, 9a, 9b and 9c and the admin layers refactor (shared review core, the data layer of use cases, area repositories and gateways with per-app gateways behind routing gateways, glue, review flows, restart, live change messages, GraphQL usage), the workflow editor of 9a and 9b, the Reviewer exclusions page and the role-form permission element of 9c.
- `integrations.md`: the CMS and Website Builder packages (API and admin): what each registers, how content binds to a workflow, the rules while a review is in progress, the target context, UI integration points.
- `infrastructure.md`: infrastructure in other packages that workflows builds on (AI providers and ai-powerups, background tasks, ACO folders, teams and users, mailer, tenant settings, webhooks) and how workflows uses it.
- Developer guides: `automations.md` (writing an automation), `ai-tools.md` (AI steps and `WorkflowAiTool`s), `notifications.md` (what is sent to whom, writing a `NotificationTransport`).
- `decisions.md`: every decision (D1 onwards), newest at the bottom; superseded entries stay as history.
- `open-questions.md`: questions raised during the design; answered ones moved into `decisions.md`.
- `bugs.md`: bugs outside the rewrite found during discovery (B1-B4) and their status.
- `routing.md`: the product brief for reviewer routing (input, not discovery).
- `variants-review-gap.md`: page experiments and variants versus the review rules (open).
- Design and plans: the spec `/docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`, the UI brief `/docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md`, the roadmap `/docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` and one plan folder per phase under `/docs/.bruno/plans/`. Claude Design files live in `design/` (local only, not tracked).

## Packages

| Package | Role | Size (src, without tests) |
|---|---|---|
| `api-workflows` | The engine: models, review aggregate, internal use cases, routing, step types and step runs, notifications, permissions building blocks, the shared `workflows` GraphQL root and types | 426 files, ~18.5k LOC |
| `app-workflows` | Shared admin core: review core (8a, 8b), the workflow editor (9a, 9b), the Reviewer exclusions page and the permission element (9c) | 607 files, ~33.4k LOC |
| `api-headless-cms-workflows` | `cms.*` target adapter, CMS hooks, wrapper use cases and the `cms` GraphQL operations | 152 files, ~6.5k LOC |
| `app-headless-cms-workflows` | CMS gateways, entry editor and list integration, Content Reviews, trash guard, editor mounting | 92 files, ~3.0k LOC |
| `api-website-builder-workflows` | `wb.page` target adapter, page hooks, wrapper use cases and the `websiteBuilder` GraphQL operations | 124 files, ~4.8k LOC |
| `app-website-builder-workflows` | WB gateways, page editor and list integration, Content Reviews, trash guard, editor mounting | 94 files, ~2.4k LOC |

The AI step lives in `ai-powerups` (`src/api/features/WorkflowReview/`). Everything is gated by the `advancedPublishingWorkflow` licence flag; the AI step also needs `aiPowerups`. All code is DI-native (`createFeature`, `createAbstraction`, MobX presenters on the admin side).

## Phases as built

| Phase | What it built | Plan |
|---|---|---|
| 0 | Prerequisites: bugs B1-B4, `UpdateEntrySystemUseCase`, filterable `system.workflow` fields, the `teams_in` user filter | `plans/2026-10-05-workflows-phase-0-prerequisites.md` |
| 1a | The four private models, the identity-free review aggregate, the single save path, workflow validation and the optimistic save check, domain events | `plans/2026-10-09-workflows-phase-1a/` |
| 1b | Permission building blocks and viewer flags for the app wrappers | `plans/2026-10-10-workflows-phase-1b/` |
| 2 | Target adapters (`cms.*`, `wb.page`), app wrapper use cases, CMS and WB hooks | `plans/2026-10-11-workflows-phase-2/` |
| 3 | Per-app GraphQL, the shared configuration operations, the five review lists | `plans/2026-10-13-workflows-phase-3/` |
| 4 | Routing: rules, strategies, picks, reassign, exclusions, assignment log, inspector, candidates | `plans/2026-10-13-workflows-phase-4/` |
| 5 | Step types, automation definitions, the step run task, failure, stuck detection and restart | `plans/2026-10-13-workflows-phase-5/` |
| 6 | The AI step in ai-powerups, the AI tool registry and the target editor port | `plans/2026-10-14-workflows-phase-6/` |
| 7 | Notifications: recipients, transports, e-mail and websocket messages | `plans/2026-10-15-workflows-phase-7/` |
| 8a | Admin review experience for people steps (shared core, per-app gateways, bar, dialogs, Content Reviews, widgets) | `plans/2026-10-16-workflows-phase-8a/` |
| 8b | Admin for automation and AI steps, restart, Failed steps tab, live change messages, kept run tasks, blocking-reviews query | `plans/2026-10-17-workflows-phase-8b/` |
| 9a | The workflow editor foundation | `plans/2026-10-18-workflows-phase-9a/` |
| 9b | The assignment editor and Test routing | `plans/2026-10-18-workflows-phase-9b/` |
| 9c | Reviewer exclusions settings page and the role-form permission element | `plans/2026-10-19-workflows-phase-9c/` |
| Admin layers | The admin data layer per operation: one use case per operation, one repository and one gateway per area, per-app gateways behind routing gateways, the workflow-list cache in `ReviewRepository`, tests by layer | `plans/2026-10-19-workflows-admin-layers/` |

The roadmap has the full scope of each phase. The branch merges only when every phase is done.

## How it works

- A workflow binds one namespace (`cms.<modelId>` or `wb.page`) and holds ordered steps of a type: `review` (people), `automation` or `ai`.
- Requesting a review of a revision snapshots the steps into a review (private model `wbyWorkflowReview`) and reaches step 1. A people step is routed to an owner (rules, strategy, pick) or to the team pool; an automation or AI step runs in a background task as the requester.
- The owner approves (the next step is reached at once) or rejects (final for the revision). A failed automation or AI step can be restarted; the requester or a user with `reassign` can cancel or restart, a user with `reassign` can reassign.
- A revision with an active review cannot be saved (a new revision starts clean); while the review is in progress the content cannot be moved, trashed or deleted; the revision publishes only once its review is approved. Each review save writes `system.workflow` onto the revision for lists.
- Every app operation goes through that app's wrapper use case, which checks the identity, the `workflows` permission (`editor`, `reassign`) and the target access; the engine's use cases are internal (D132).
- Review events drive notifications (e-mail through transports, websocket messages to the admin).

## Where to read what

| Question | Read |
|---|---|
| Why something is the way it is | `decisions.md` (search the D number cited in code comments), then the spec |
| Engine structure, GraphQL, errors, permissions | `api.md` |
| CMS or WB specifics, hooks, binding | `integrations.md` |
| Admin screens and presenters | `app.md` |
| Writing an automation, an AI tool or a transport | `automations.md`, `ai-tools.md`, `notifications.md` |
| What a phase delivered | the phase's plan folder and the roadmap |

The ten discovery questions of the first snapshot (2026-10-01) were answered in `decisions.md`; its gap analyses and refactor proposals were superseded by the spec and are not kept here.
