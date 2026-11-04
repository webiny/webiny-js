# Session Handoff — 2026-10-22 — Workflows PR split, reviews and no queries in loops

## What was done

- **Split the workflows refactor** (`bruno/refactor/workflows-flow`, PR #5973, left untouched) into an
  umbrella PR #6079 (`bruno/feat/workflows-umbrella` → `next`) and 45 part PRs (#6037–#6078, #6083,
  #6086) merging into it, one per package (api-workflows and app-workflows split by area). The
  umbrella body lists the parts in review order (7 stages, 44 items). The user squash-merges each
  part into the umbrella with `[skip ci]` and removes the marker from titles of PRs it re-reviews.
- **Fixes during the split/review of early parts:** CMS `system.workflow` knowledge moved out of
  api-headless-cms into a `CmsEntrySystemField` extension point (types augmented by
  api-headless-cms-workflows, storage/OpenSearch fields built from registrations) and exported via
  `exports/api/cms/entry.ts` and the `webiny` package; WB pages got page-owned GraphQL types
  (`WbPageSystem`, `WbPageLive`); background-tasks private-task rules moved from GraphQL resolvers
  into `*Visible*` use cases + `PrivateTaskDefinitions`.
- **#6037 review (domain):** shared per-condition routing predicates; `PersistenceError` base class;
  approve comment trimmed; `Review.reach`/`reachRun` guard the step type; notification transport
  helpers moved to `features/notifications/shared`; `DropActorRecipient` interface.
- **#6038 review (review features):** repository `create`/`update` (no resurrection of deleted
  reviews); read-only `GetActiveTargetReviewUseCase` for save block/publish rules; `Review`
  owns running/all task ids; `RequestReview` uses `GetBoundWorkflowUseCase`; keyset review list
  cursor (`lastChangedOn` + ids); `XAbstraction` aliases in features/review; review events split
  into one `events.ts` per feature (`shared/events.ts` for the union and step-failed).
- **No queries in loops** (plan `docs/.bruno/plans/2026-10-21-workflows-no-n-plus-one.md`, done):
  review lists use read filters (models, own-only by author, denied folders) + one batch confirm per
  page; folder rules only for models with active reviews (`ListReviewedModelsUseCase`, one
  distinct-values query); routing reads target and folder once and reuses `ListUsers` results;
  blocking reviews/delete paths/delete workflow batched (`listByTargets`, `getMany`,
  `DeleteMultipleEntries` in chunks of 50); request-scoped `ReviewTeamLoader` (dataloader);
  least-loaded ties one query; oxlint `no-await-in-loop` is an error for the three workflows
  packages' src, intentional loops annotated with reasons.
- **Base fixes made with approval:** CMS `DeleteMultipleEntriesUseCase` events now carry only the
  deleted entries (#6061); api-opensearch-aws test harness skips batch deletes of missing records
  (#6086); api-aco gained a comment about per-record team loading (#6060).
- **#6039 review (issues 1–7 of 11):** stuck-step detection re-reads the review before failing (race
  that overwrote a run's decision); `CurrentUserTeams` cache keyed by tenant; `WorkflowLookupError`
  for editor lookup failures; `WorkflowEditorAccess` shared by 8 config use cases; shared member
  loading in routing + `toStepMembersParams`. Issue 4 (websocket `errorMessage`) is intended by R196.
- 128 commits on the parts this session; every change tested with the affected test files only
  (ddb and ddb-os,ddb where storage-facing), builds and oxfmt/oxlint clean at each step.

## Key decisions

- Never touch `bruno/refactor/workflows-flow`; all work goes to the part branches via a scratch
  stacked worktree outside the repo, split by path, and verified by re-stacking (must equal the
  tested tree).
- No storage/IO in loops (memory `feedback_no_queries_in_loops.md`); batch by ids or push checks
  into query filters; review list read access = CMS list semantics (Q77–Q80 in the plan).
- Extend workflows, not base; base changes only with explicit approval (the three above).
- Folder rules cover only models with active reviews, tied by comments to the lists' `isActive`.
- `CandidateFolderReadRules` copies ACO `GetDefaultPermissionsWithTeams` (kept in step, tested).
- Websocket notification logs may include the error message (R196); mail/lookup logs never.
- The `XAbstraction` alias rename applies to features/review only (#6038 scope).

## Current state

- Branch checked out: `bruno/refactor/workflows-flow` (untouched, clean).
- Parts: 45 branches `bruno/feat/workflows-*`; unpushed: api-workflows-core (1), -domain (2),
  -features (5), -tests (4) — the #6039 review fixes.
- Tests: targeted runs green (no full suite run); build and lint green.
- Umbrella CI only meaningful once all parts are merged.

## What might come next

- Push the 4 branches above, refresh PR file counts.
- #6039 review issues 8–11: barrels exporting `I*` interfaces and internal wiring (ListNotificationTransports,
  WorkflowAiTool, AutomationDefinition, StepRunner); least-loaded tie history scan unbounded in pages
  (cap it); AI step `checkConfig` reads the model list per changed AI step; `AutomationOutcome`
  inline object types.
- Optional: `StoreWorkflow` user-lookup failure as `WorkflowLookupError` for consistency.
- Continue reviewing parts in umbrella order (#6040 onward).
- Known: api-core `ListUsers` scans all users on plain DynamoDB (left as is); ACO folder permission
  listing is one type at a time and loads teams per record (commented in api-aco).
