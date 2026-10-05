# Workflows Refactor Roadmap

> **For agentic workers:** This is a roadmap, not an executable plan. Each phase gets its own detailed plan in `docs/.bruno/plans/`, written when the previous phase has landed. Execute only detailed phase plans.

**Goal:** Deliver the workflows refactor in `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` as a sequence of independently testable phases.

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` (decision log: `docs/.bruno/workflows/decisions.md`, D1-D86).

## Why phases

The spec spans ten subsystems (platform changes in api-core and api-headless-cms, the workflows domain, CMS/WB target adapters, routing, step types and tasks, AI, notifications, and three admin areas). One plan with real code for all of them would be too large to execute or review. Each phase below ends with working, tested software; later phases build on the public interfaces of earlier ones.

## Phases

| Phase | Scope | Depends on | Spec sections |
|---|---|---|---|
| 0. Prerequisites | Bugs B1-B4; `UpdateEntrySystemUseCase`; filterable `system.workflow` fields; remove the v5 APW audit entry | none | 9.1, 9.5 (APW removal), 15 |
| 1a. Models and aggregate | New models (`wbyWorkflow` with `models[]` and typed steps, review model with full snapshot and current-step fields, `wbyWorkflowAssignment`, `wbyWorkflowSettings`); review aggregate with identity-free transitions for review steps (request, reach, start, take over, approve, reject, cancel); single save path; domain events carrying enough data for future audit logs | 0 | 4, 5.1, 5.2, 9.5 (event data) |
| 1b. Permissions and viewer flags | Shared permission checker (`editor`, `reassign`, full access); server-side checks on every review operation; viewer flags | 1a | 5.3, 8 |
| 2. Target adapters and CMS hooks | `cms.*` and `wb.page` adapters (typed `TargetContext`, `system.workflow` sync via `UpdateEntrySystemUseCase`, publish rule D79, move rule D84, delete); single CMS handlers: revision-create null (D59), save block (D62, D80), model delete decorator (D64); delete the old duplicated CMS/WB handlers | 1a | 4.5, 9.2, 9.3 |
| 3. GraphQL and lists | New GraphQL schema (section 10), four review lists with folder filter and rewritten pagination (D47, D76), query permissions (D78), error shape with `code` and `data`; delete the old GraphQL schema | 1b, 2 | 10, 11 |
| 4. Routing | Exclusion settings; candidate resolution; rules; round-robin and least-loaded; picks; reassign; assignment log; rule inspector; `listUsers`, `listStepCandidates`, `folderExists` | 3 | 6 |
| 5. Step types, automation, tasks | `StepType` extension point; automation definitions (public abstractions, D86); task runner as requester, stale guard, stuck detection, restart with `runs`; secret settings; "Send webhook" built-in | 3 | 7.1, 7.2, 7.4 |
| 6. AI step | Workflow AI tool registry with `readTarget` / `updateTargetFields` per adapter; AI step type registered by ai-powerups; "Workflow review" capability; structured output | 2, 5 | 7.3 |
| 7. Notifications | Recipient rules (D44); step transports (e-mail); websocket messages (D60) | 3 | 12 |
| 8a. Admin: review experience for review steps | Gateways keep error code/data; per-view presenters; review bar, tooltip and dialogs (start, take over, approve, reject, cancel, reassign); request dialog with picks; four lists; dashboard widgets; WB "create new revision" on rejected draft; content list selectability on `reviewState`; delete the old admin review UI | 3, 4 | 13.1, 13.3-13.5 |
| 8b. Admin: automation, AI and live updates | Failed/running states, restart, `runs` history, AI issues display, websocket refetch | 5, 6, 7, 8a | 13.4, 12 |
| 9a. Admin: editor foundation | JSON-schema to FormModel adapter; step editor on FormModel with step-type dynamic zones; automation step editor; delete the old editor | 3, 5 | 13.2 |
| 9b. Admin: assignment editor | Assignment section, rule list, inspector, `WorkflowUserPicker`, `WorkflowTeamPicker`, folder picker | 4, 9a | 13.2 |
| 9c. Admin: settings, AI editor, permissions | Exclusion settings page; AI step editor; workflows permission UI (custom access) | 1b, 4, 6, 9a | 13.2, 13.6, 13.7 |

Parallelism: once 3 lands, phases 4, 5 and 7 can run in parallel. Phase 6 needs 5. Phase 8a needs 4; 8b needs 5, 6, 7. Phases 9a-9c follow the API pieces they edit.

## Cutover

The rewrite replaces code in place on this branch; nothing is released between phases (D1, D17). Each phase deletes the old code it replaces (noted in the table). Between phases 2 and 8a the old admin UI is expected to be broken against the new API; phase acceptance is the phase's own tests, not the old UI. After 9c, a final sweep removes anything left of the old domain, GraphQL and admin.

## Cross-phase rules

- Every phase follows the repo conventions in `CLAUDE.md` / `AGENTS.md`: DI features via `createFeature` / `createAbstraction` / `createImplementation`, one abstraction or implementation per file, implementation file named after its class, export name matching the abstraction, namespace types, no inline object types, minimal barrel exports.
- Before every commit run the full chain from `CLAUDE.md` ("Before Commit"), including `yarn format:fix`, `yarn lint:fix`, `yarn adio`, `node scripts/generateTsConfigsInPackages.js`, `yarn webiny sync-dependencies`, and a build of changed packages.
- Workflows assume OpenSearch storage (D63); tests for workflows-related storage behaviour run with `yarn test:os` in addition to the default.
- Never push. Never amend.

## D58 mechanism (decided, D87)

Tasks run as the requester by wrapping `TaskService.trigger` in `IdentityContext.withIdentity(requester, ...)` (`packages/api-core/src/features/security/IdentityContext/abstractions.ts:9`). `TaskService.trigger` keeps its interface. Implemented in phase 5.
