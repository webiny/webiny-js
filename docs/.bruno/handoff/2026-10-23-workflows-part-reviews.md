# Session Handoff — 2026-10-23 — Workflows part reviews finished

## What was done

- Finished reviewing every part PR of the workflows umbrella (#6079): #6039 (issues 8–11), #6040,
  #6041, #6042, #6043, #6050, #6072, the admin stage (#6051, #6055, #6075, #6052, #6053, #6054) and
  the app-workflows parts (#6044, #6045, #6046, #6047, #6048, #6049), plus #6076/#6074/#6077. #6078
  (docs) needs no code review. About 47 commits on the part branches, all pushed; PR bodies' file
  counts refreshed and `[skip ci]` removed from every PR that changed.
- **Engine knows no app or model:** new `WorkflowModelParser` extension point (`parse(model)` →
  `{ app, modelId } | null`) and `WorkflowModelParserService`; CMS and WB packages register their
  parsers (WB page model id comes from `PAGE_MODEL_ID`). `WorkflowValidator` takes an
  `isKnownModel` check (`Model "x" is not supported.`); routing's `modelId` condition and
  least-loaded app grouping use the parser; `getNamespaceApp` / `getNamespaceModelId` deleted.
  Notification links (#6072) are built from the parsed model too.
- **#6039:** barrels export only abstraction tokens; least-loaded tie-break history capped at 5
  pages; `AutomationOutcome` members are named interfaces.
- **#6040:** assignment entry names are read with the entries in `ListReviewAssignmentsUseCase`
  (one `ListUsers` `id_in` call); the per-entry resolver and `ResolveReviewUserName` are gone; the
  review list filter is the CMS's own `CmsEntryReviewListWhere`.
- **#6041 (tests):** failed stuck-step re-read test, one `ListUsers` fake, global reset of every
  shared test fake (`__tests__/setup/resetTestFakes.ts` via `setupFiles`), fake editor read copies,
  loose assertions tightened, frozen clock, `toChunks` / `forEachWithConcurrency` unit tests,
  small-page routing history tests. Full api-workflows ddb suite: 159 files, 1687 tests green.
- **#6042/#6043:** cancel-for-delete answers `ok([])` when item-level delete fails; folder
  permission listing uses `path_startsWith: "root/"` (the storage refuses a type-only list — it
  failed in production with FLP on); FLP test fakes now enforce that contract.
- **#6050 (ai-powerups):** shared `toLoggedAiError` (name, message, status code; key-like text
  redacted) used by the runner and `AiStepType.reach`; runner tests prove the resolved model, the
  stop conditions and no runner writes.
- **Admin:** app-admin keeps a cleared string that has a default and drops 3 unused jsonSchema
  type exports; pickers keep keyboard focus after a chip is removed and reset the parent search
  after a pick; role form ids per instance (`useId`); step forms show errors the server would
  report (automation required, AI tools error with no options, field error under a failed picker
  list); the CMS entry form tracks a new entry's review after its first save.

## Key decisions

- `forEachWithConcurrency` stays as an accepted exception to no-IO-in-loops (assignment record
  creates, task cleanups); `ActiveReviewGuard` cancelling once per target after a bulk confirm
  (R205) is accepted too. Both recorded in memory.
- Existence leaks (NotFound vs NotAuthorized revealing that a record exists) are not a concern in
  this closed system; never raise them (memory `feedback_existence_leaks_ok.md`).
- R83 stands: new revisions created as published need no review (comment added on
  `NullReviewStateOnRevisionCreate`). Revision descriptions stay editable during a review. D106
  (exclusions last save wins) and QBZ-1 / Q19 editor rules confirmed as intended.
- Reviewers must read the stacked worktree, never single part branches (old server files there are
  deleted in the stack).

## Current state

- Checked out: `bruno/refactor/workflows-flow` (untouched, clean).
- Parts: all pushed; PR file counts match; scratch stacked worktree in the session scratchpad
  (re-create with `git worktree add --detach <dir> bruno/feat/workflows-umbrella` + merge every
  `bruno/feat/workflows-*` part, then `yarn` and `yarn build`).
- Tests: targeted runs green per change; full api-workflows ddb suite green once; other packages'
  full suites not run. Builds, oxlint, oxfmt, adio and webiny package validation clean.

## What might come next

- User squash-merges the parts into the umbrella; umbrella CI once all are in.
- Optional: `StoreWorkflow` user-lookup failure as `WorkflowLookupError`.
- Known, left as is: `listUsers` scans all users on plain DynamoDB; one `folderExists` call per
  unlisted folder in the editor's reference resolution (needs a server batch); automation scopes
  (`cms.*`, `wb.*`) still match on the string prefix; experiment variants publishing on page
  publish (base WB) are outside workflows v1.
