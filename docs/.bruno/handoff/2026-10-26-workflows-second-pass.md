# Session Handoff — 2026-10-26 — Workflows second review pass (stages 1–5)

## What was done

- Second review of every part PR of the workflows umbrella (#6079) in review order, stages 1–5: shared base API (#6056–#6071, #6073, #6083, #6086), engine (#6037–#6041), API integrations (#6042, #6043, #6050, #6072), admin base (#6051–#6055, #6075) and the admin workflows app (#6044–#6047). About 95 commits on the part branches, all pushed; PR bodies' file counts and `[skip ci]` updated.
- Reviews ran in a scratch stacked worktree (umbrella + every part merged), source and tests by subagents, findings verified and fixed one by one, fixes split back to their part by path.
- Notable fixes:
  - Background tasks: private task runs are visible in GraphQL; only triggering a private definition is refused (D188).
  - Engine: `ReviewTargetSyncError` fixed message + `source`; unique routing rule ids per step (`duplicateRuleId`); `RoutingDependencyError` keeps the wrapped cause; target review lists filter by `state`/`targetRevisionId` in storage; round robin reads its last assignee with one `hasUser` (`userId_not: null`) query; step run task stores only fixed/public error fields; automation runs re-check scope; request candidates need `allowManualPick`; save refuses a deleted team target (D174, teams on).
  - ACO (base, approved): `listFolderLevelPermissions` loads the identity's teams once per call.
  - Inbox notifications: AI/automation decisions now notify the requester (decided from `fact.actor`).
  - ai-powerups: a step model dropped from the catalog gets the model-not-available reason.
  - Admin: revisions drawer honours the decoratable `usePermission`; picker search reset on remount; editor leave guard covers unapplied drawer edits, typed automation settings survive reloads, cleared error marks stay cleared, per-field rule errors, automation cards select on Enter/Space/click only, loaded non-`#RRGGBB` colours never block; reviews treat TargetSync as done for every action (D189), conflicts survive a bar refresh, steps popover opens on click/keyboard only, Load more keeps its place, failed trash-cancels show inline and can be retried.
  - Many vacuous/duplicate tests fixed or removed; helper files split to one abstraction per file.
- Suites green at the end: api-workflows 1705, CMS workflows 506, WB workflows 408, ai-powerups 368, app-workflows 3074, app CMS 338, app WB 340, notifications-integrations 6.

## Key decisions

- D188 (private task runs visible), D189 (TargetSync is done for every review action) in `docs/.bruno/workflows/decisions.md`.
- Left as decided: #6045 M1–M3 (rule-id renaming / stored values that cannot occur), #6039 sequential `checkConfig` (settings/catalog cached), #6042/#6043 review list folder filter uses the request-time folder (comment added), #6047 `vi.mock` of internal modules.
- Workflows always need teams: no teams-off tests.
- CMS null compares (`_not: null`) are reliable on DDB, OpenSearch and SQL (memory saved).

## Current state

- Checked out: `bruno/refactor/workflows-flow` (untouched). All part branches pushed except this docs commit.
- Scratch stack: `/private/tmp/claude-501/-Users-brunozoric-work-webiny-webiny-js/d9f04d08-4ba1-4316-a6c3-43e87e2e5b09/scratchpad/stack` (all parts merged), part worktrees at `scratchpad/part-*`.
- Lint/format clean on all changed packages. Full api-workflows suite takes ~8.5 min (normal).

## What might come next

- Stage 6: #6048 (app-headless-cms-workflows), #6049 (app-website-builder-workflows) — source + tests, same method.
- Stage 7: #6076 (webiny exports), #6074 (cli-core), #6077 (repo/CI/scripts), #6078 (docs).
- Possible base CMS issue: reading an entry right after `MoveEntryUseCase` in the same request context returned the old folder in tests (request cache?) — not investigated.
- Then: user squash-merges parts into the umbrella; umbrella CI.
