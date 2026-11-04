# Session Handoff — 2026-10-14 — Workflows phases 4.2-5 built, phase 6 planned

## What was done

66 commits on `bruno/refactor/workflows-flow` (c1489e6ee8..e9642a242a). Everything ran through superpowers subagent-driven development: an implementer and a task review per task, a final review and one fix wave per sub-phase, ledgers in `.superpowers/sdd/`. Targeted test files were run by path on ddb and ddb-os; no package suites.

- **Phase 4.2 (engine operations, packages/api-workflows):** reassign transition and `ReassignReviewStepUseCase`, `InspectRoutingUseCase`, `ListStepCandidatesUseCase` + `redactStepCandidates`, save-time rule user targets, `ListWorkflowUsersUseCase` + `workflows.listUsers`. Final fixes: shared step-config check (`findReviewStepConfigProblem`), `Review.checkReassignTo`, requester guard in `Review.reassign`.
- **Phase 4.3 (CMS) and 4.4 (WB):** folder chains (refuse empty/`#` ids), folder-level read checks, folder existence, five routing wrappers per app, GraphQL on the `cms` and `websiteBuilder` roots, docs. Every CMS and WB wrapper now maps a `viewer.get()` throw to `Workflows/Review/Persistence` (R87).
- **Phase 5 planned and built (5.1-5.5):** plan `docs/.bruno/plans/2026-10-13-workflows-phase-5/` (R131-R163, reviewed in a 4-round loop). Built: `StepType` registry; code-defined `AutomationDefinition` with a zod `settingsSchema` (settings stored as entered, parsed on every use, editor schema via `io: "input"`); `listStepTypes` from the registry and `listAutomationDefinitions`; `taskId`/`runs` on steps; `reachRun`/`fail`/`restart`; `canRestartByPermission`; SEC-68 fix (GraphQL `triggerTask` refuses private definitions); `WorkflowBypassService` (AsyncLocalStorage, save block only); `ReviewTaskAbortService`; trigger before save; the private `workflowsStepRun` runner with a pure stale guard, waits, post-run re-guard, fixed failure reasons; cancel/delete abort; stuck detection (5-minute grace); `RestartReviewStepUseCase`; CMS and WB restart wrappers + GraphQL; automation developer guide `docs/.bruno/workflows/automations.md`.
- **Phase 6 (AI) planning:** `docs/.bruno/plans/2026-10-14-workflows-phase-6/` — answers (`00-answers.md`), contract `00-shared.md` (R164-R178, reviewed in a 5-round loop, now clean), 11 small sub-phases, 21 tasks. Task files 1-12 written and reviewed (chunks 1-3); Tasks 13-15 written and committed as drafts, review pending; Tasks 16-21 not written.

## Key decisions

- User answers phase 5: no shipped webhook automation and no secret settings (credentials stay in the developer's code); code-defined automation with zod settings; trigger before save with bounded wait and abort on save failure; one private runner with per-automation `maxIterations`; save-block-only bypass; SEC-68 is a platform bug.
- R161: automations (and AI) run attributed to the requester with authorization off (D36); developers must scope their own code.
- User answers phase 6: reuse `workflowsStepRun` through a neutral step runner; the workflow author picks the model, the editor lists only models with a configured connection (`ConfiguredAiModelsService`: settings presets ∩ `Ai.listModels()`); bounded `updateTargetFields` (CMS top-level + nested object fields, no dynamic zones/refs; WB `properties.title` + `properties.seo.*`, full merged write); 200000-char input cap + timeout, no truncation; e2e test in ai-powerups (no package cycle).
- Phase 6 contract rulings worth remembering: both `aiPowerups` and `advancedPublishingWorkflow` gate the workflows-dependent ai-powerups pieces; cancel during an LLM call works through `StepRunStaleCheckService.isStale` (returns a Result, 5 s throttle in the AI runner); the write path fails closed when the stale read fails; the pre-run output write is opt-in via `StepRunner.singleRun` (automation unchanged).
- User: all subagents run on Sonnet; implementers commit with separate `-m` arguments so the trailer is its own paragraph; any workflows type error is real (check per package with `yarn check:test:types -p <folder> --report cli`).

## Current state

- Branch: `bruno/refactor/workflows-flow`, 288 commits ahead of `origin/next`, not pushed (never push).
- Tests: targeted files green on ddb and ddb-os for every task (no package suites by user rule).
- Build / lint / format: green at the last code commit (ca9a436d2c); later commits are docs only.
- Working tree clean.

## What might come next

- Resume phase 6 planning from `.superpowers/sdd/p6-plan/notes.md` ("PAUSE" section): chunk 4 review of Tasks 13-15 (deviations listed there), fix, re-review, commit; then chunk 5 (Tasks 16-21: AI step type, AI runner, e2e, docs); delete `00-outline-draft.md`; then implement 6.1 with SDD on Sonnet, stopping per sub-phase.
- Open user decisions: `workflowsStepRun` `selfCleanup: "never"` (task records kept forever); GraphQL abort of private tasks by background-task permission holders fails the step.
- Pre-merge list: commit `3a9b1871cf` names only "Claude Sonnet 5.5"; the 7 commits `3a8ed2e7b1..363fc843fd` carry the trailer inside the subject; earlier: 7 Sonnet-named commits, squash `3a6d12b936`, type errors in api-aco/api-audit-logs/api-core vs next (background-tasks errors confirmed pre-existing), background-task Lambda loads CmsWorkflowsFeature; mark SEC-68 fixed in `docs/.reports/security.md`.
- Still open from before: variants/experiments go live unreviewed (waiting on variants owner), CMS deleteMultiple OS bug for never-published entries, `test:pg:os` never run, pure data helpers decision.
- Historic design files (`2026-10-06-workflows-ui-design-brief.md`, `workflows/design/*`) still mention "Send webhook" and secret fields — revisit in the admin phases.
