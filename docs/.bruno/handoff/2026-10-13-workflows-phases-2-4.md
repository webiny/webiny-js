# Session Handoff — 2026-10-13 — Workflows phases 2.2 to 4.1

## What was done

74 commits on `bruno/refactor/workflows-flow` this session (910dbd5984..007a4e64ae), 489 files. All work ran through superpowers subagent-driven development: one implementer per task, a task review, a final review per sub-phase, one fix wave and a re-review, and a stop for the user between sub-phases. Ledgers live in `.superpowers/sdd/00-<sub-phase>/progress.md`.

- **Phase 2.2 finished (CMS adapter and hooks):** publish, move, trash and delete rules, model delete guards, and the final review's fixes (republish bypass, folder change through update, the full-delete task guard on the task run).
- **Phase 2.3 (CMS wrappers):** twelve CMS wrapper use cases, `CmsEntryReviewGuardService`, R87 (every dependency throw becomes a failed Result).
- **Phase 2.4 (Website Builder adapter and wrappers):** the `wb.page` adapter, page rules, page trash/delete, twelve WB wrappers.
- **Phase 3 (GraphQL and lists), all four sub-phases:**
  - engine: `currentStepType`, the request title (D135), the reject comment minimum (D100), `ListReviewsUseCase` (five lists, read predicate, item cursor, 200-row scan cap), the assignment `kind` plus redaction, and the shared config use cases;
  - `workflows` root on `/graphql` (settings, step types) and the shared `Workflows*` types;
  - CMS operations on the `cms` root (15) and WB operations on the `websiteBuilder` root (14), the editor model list, and the corrected `system.workflow` types;
  - WB page resolvers and the scheduler keep error codes; the OpenSearch long-text `""` → null mapping fix.
- **Phase 4 plan written** (`docs/.bruno/plans/2026-10-13-workflows-phase-4/`, 4 sub-phases, 14 tasks, R109-R130, A46-A50).
- **Phase 4.1 (routing core):**
  - routing on step reach: pick → rules → round-robin or least loaded → pool;
  - assignment records written after the save;
  - `RoutingEvaluatorService`, the `ReviewTargetFolderChain` port, `canUserReadInFolder` (app stubs fail closed until 4.3/4.4);
  - fall-through to the pool on any failure, keeping what was already decided.
- **Cleanup by user rule:** removed every helper function and private method that wrapped a dependency call, across the three workflows packages; `keepReadableBlockingReviews` became `ReadableBlockingReviewsService`.
- **Fixes along the way:** `@webiny/di` set to `^1.1.0` in both app packages (it broke `yarn install`); WB `@webiny/api-workflows` moved to runtime dependencies.
- **Tests:** targeted test files by path, both storages. Last runs: api-workflows 157, CMS workflows 87, WB workflows 82 (4.1 set); full CMS 250 and WB 181 at the end of phase 3.

## Key decisions

- **D135:** the review title comes from the content and can be changed by the requester when requesting (at least 5 characters); it is locked afterwards.
- **D136:** every workflows operation is on `/graphql`: root `workflows` (shared config), `cms` (CMS ops; `modelId` as an argument where needed), `websiteBuilder` (page ops). Nothing on `/cms/*` except the entry's `system.workflow` field.
- **D137:** least loaded counts load per app, and the tie-break looks only at the same app.
- **User rules (saved to memory):**
  - no helper functions or private methods wrapping dependency calls (use cases, services, readers, logger); call them inline, and shared dependency logic becomes a DI service named `...Service`;
  - subagents run targeted test files by path, never whole package suites;
  - OpenSearch runs go one at a time (port 8001 clashes).
- **Phase 3 rulings:** R88-R108. Highlights: R87 extended to every wrapper; R107 validates every `revisionId` argument; R108 target-review semantics (missing or unreadable → NotAuthorized, so existence is not revealed).
- **Phase 4 rulings:** R109-R130, including R116 refined (a failure keeps narrowed teams and gathered skips), R128 (request candidates check the workflow's app), R129 (the inspector shows the exclusion's own reason; records never do), R130 (folder from the review snapshot, ancestors at reach).
- **A45:** the old admin's `system.workflow { state }` selections break. Accepted; admin is rewritten in 8a.

## Current state

- Branch: `bruno/refactor/workflows-flow` (base `next`)
- Tests: targeted files green on ddb and ddb-os (see above); never run as whole suites by rule
- Build: `--no-cache` builds green for the changed packages; `yarn lint` exit 0; format check clean on changed files
- Unpushed commits: 221 ahead of `origin/next` (never push; merges only after all phases)

## What might come next

- **Phase 4.2** (engine operations): reassign, `InspectRoutingUseCase` (must validate unsaved `stepConfig` first), `ListStepCandidatesUseCase` plus `redactStepCandidates`, save-time rule-target validation, `listUsers`. Then 4.3 (CMS) and 4.4 (WB plus docs).
- **Variants:** experiments and variants go live with an approved page without review. Waiting on the variants owner (`docs/.bruno/workflows/variants-review-gap.md`, open question V1).
- **Before merge:**
  - check the type errors in api-aco, api-audit-logs and api-core against `next`;
  - confirm the background-task Lambda loads the CMS workflows feature (the full-delete guard depends on it);
  - squash commit `3a6d12b936` (from 1b, does not build on its own);
  - seven commits name "Claude Sonnet 5.5" as co-author.
- **Open issues:**
  - SEC-68: `triggerTask` runs private task definitions (platform);
  - CMS bug: deleting several entries at once on OpenSearch fails for a never-published entry;
  - `test:pg:os` never run;
  - user to decide on pure data helpers (`toCmsReviewTarget`, `appName` utils).
- `docs/.reports/security.md` was rebuilt (SEC-66/67/68); SEC-1..65 from the audit are missing locally.
