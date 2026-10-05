# Workflows Refactor Roadmap

> **For agentic workers:** This is a roadmap, not an executable plan. Each phase gets its own detailed plan in `docs/.bruno/plans/`, written when the previous phase has landed. Execute only detailed phase plans.

**Goal:** Deliver the workflows refactor in `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` as a sequence of independently testable phases.

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` (decision log: `docs/.bruno/workflows/decisions.md`, D1-D86).

## Why phases

The spec spans ten subsystems (platform changes in api-core and api-headless-cms, the workflows domain, CMS/WB target adapters, routing, step types and tasks, AI, notifications, and three admin areas). One plan with real code for all of them would be too large to execute or review. Each phase below ends with working, tested software; later phases build on the public interfaces of earlier ones.

## Phases

| Phase | Scope | Depends on | Spec sections |
|---|---|---|---|
| 0. Prerequisites | Bugs B1-B3; `UpdateEntrySystemUseCase`; filterable `system.workflow` fields; remove the v5 APW audit entry | none | 9.1, 9.4, 9.5, 15 |
| 1. Domain and persistence | New models (`wbyWorkflow` with `models[]` and typed steps, review model with full snapshot and current-step fields, `wbyWorkflowAssignment`, `wbyWorkflowSettings`); review aggregate with identity-free transitions for review steps (request, reach, start, take over, approve, reject, cancel); single save path; viewer flags; permission checker (`editor`, `reassign`) | 0 | 4, 5, 8 |
| 2. Target adapters and CMS hooks | `cms.*` and `wb.page` adapters (typed `TargetContext`, `system.workflow` sync via `UpdateEntrySystemUseCase`, publish rule D79, move rule D84, delete); single CMS handlers: revision-create null (D59), save block (D62, D80), model delete decorator (D64); remove old duplicated CMS/WB handlers | 1 | 4.5, 9.2, 9.3 |
| 3. GraphQL and lists | New GraphQL schema (section 10), four review lists with folder filter and rewritten pagination (D47, D76), query permissions (D78), error shape with `code` and `data` | 1, 2 | 10, 11 |
| 4. Routing | Exclusion settings; candidate resolution (teams, requester, exclusions, read access); rules; round-robin and least-loaded; picks; reassign; assignment log; rule inspector; `listUsers`, `listStepCandidates`, `folderExists`; `teams_in` from phase 0 | 1, 3 | 6 |
| 5. Step types, automation, tasks | `StepType` extension point; automation definitions (public abstractions, D86); task runner with requester identity, stale guard, stuck detection, restart with `runs` history; secret settings; "Send webhook" built-in | 1, 3 | 7.1, 7.2, 7.4 |
| 6. AI step | Workflow AI tool registry with `readTarget` / `updateTargetFields` per adapter; AI step type registered by ai-powerups; "Workflow review" capability; structured output | 2, 5 | 7.3 |
| 7. Notifications | Recipient rules (D44); step transports (e-mail); websocket messages (D60) | 1, 4 | 12 |
| 8. Admin: review experience | Gateways keep error code/data; per-view presenters; review bar, tooltip and dialogs for all states and actions; request dialog with picks; four lists; dashboard widgets; WB "create new revision" on rejected draft; content list selectability on `reviewState`; websocket refetch | 3, 4 | 13.1, 13.3-13.5 |
| 9. Admin: workflow editor and settings | JSON-schema to FormModel adapter; step editor on FormModel with step-type dynamic zones; assignment section, rule list, inspector, pickers; automation and AI step editors; exclusion settings page; permissions UI | 4, 5, 6 | 13.2, 13.6, 13.7 |

Phases 4, 5 and 7 can run in parallel once 3 lands. Phase 6 needs 5. Phases 8 and 9 can run in parallel once their API dependencies exist.

## Cross-phase rules

- Every phase follows the repo conventions in `CLAUDE.md` / `AGENTS.md`: DI features via `createFeature` / `createAbstraction` / `createImplementation`, one abstraction or implementation per file, implementation file named after its class, export name matching the abstraction, namespace types, no inline object types, minimal barrel exports.
- Before every commit run the full chain from `CLAUDE.md` ("Before Commit"), including `yarn format:fix`, `yarn lint:fix`, `yarn adio`, `node scripts/generateTsConfigsInPackages.js`, `yarn webiny sync-dependencies`, and a build of changed packages.
- Workflows assume OpenSearch storage (D63); tests for workflows-related storage behaviour run with `yarn test:os` in addition to the default.
- Never push. Never amend.

## Note on D58

Research for phase 0 found `IdentityContext.withIdentity(identity, cb)` in api-core (`packages/api-core/src/features/security/IdentityContext/abstractions.ts:9`). Wrapping `TaskService.trigger` in `withIdentity(requester, ...)` makes the task's `createdBy` the requester without changing the `TaskService.trigger` signature. Phase 5 should use that instead of adding an `identity` parameter, pending confirmation.
