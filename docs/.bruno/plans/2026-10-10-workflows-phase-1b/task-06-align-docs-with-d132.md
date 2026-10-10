### Task 6: Align the 1a rules, the roadmap and code comments with D132

**Files:**
- Modify: `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `packages/api-workflows/src/features/settings/SaveWorkflowSettings/abstractions.ts`
- Modify: `packages/api-workflows/src/features/settings/GetWorkflowSettings/abstractions.ts`
- Modify: `packages/api-workflows/src/features/review/GetReview/abstractions.ts`
- Modify: `packages/api-workflows/src/features/review/RequestReview/abstractions.ts`
- Modify: `packages/api-workflows/src/features/review/shared/types.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/abstractions.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/events.ts`
- Modify: `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts`
- Modify: `packages/api-workflows/src/features/workflow/DeleteWorkflow/events.ts`
- Modify: `packages/api-workflows/src/features/workflow/GetWorkflow/abstractions.ts`
- Modify: `packages/api-workflows/src/features/workflow/ListWorkflows/abstractions.ts`

**Interfaces:**
- Consumes: D132; rulings R32, R38, R39 of this plan.
- Produces: no code behaviour change. The 1a shared rules say that the api-workflows use cases stay internal for good, the checks live in the app wrappers (phase 2) and app-neutral GraphQL operations (phase 3), and `actor` on workflow events moves to phase 2. The roadmap gains the cross-phase rule "no app operation without its wrapper checks" and phase 2 depends on 1b. No source comment promises a phase 1b check any more.

- [ ] **Step 1: List what still reads wrong**

Run: `grep -rnw "1b" packages/api-workflows/src docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`
Expected: 17 lines. Under `src` (11): `SaveWorkflowSettings/abstractions.ts`, `GetWorkflowSettings/abstractions.ts`, `GetReview/abstractions.ts`, `RequestReview/abstractions.ts`, `review/shared/types.ts` (2), `StoreWorkflow/abstractions.ts`, `StoreWorkflow/events.ts`, `GetWorkflow/abstractions.ts`, `ListWorkflows/abstractions.ts`, `DeleteWorkflow/events.ts` (`Review.ts` lost its two 1b comments in Task 2). In `00-shared.md` (6): R6, R8 ("viewer flags (1b)", correct, stays), R26, and the "Not in this phase" lines "Permissions and identity", "Viewer flags" (correct, stays) and "`actor` on workflow events". `-w` keeps the session URL (`...01U31bV...`) out of the matches.

- [ ] **Step 2: Update the 1a shared rules**

In `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`:

Replace

```
Permission checks and identity reading are phase 1b: nothing in 1a reads `IdentityContext` in review transitions or their use cases. Workflow CRUD permission (`editor`) also moves to 1b: the 1a workflow and settings use cases do no permission check.
```

with

```
Nothing in 1a reads `IdentityContext` in review transitions or their use cases, and the workflow and settings use cases do no permission check. Under D132 this stays so: the api-workflows use cases are an internal engine. The app wrappers (phase 2) and the app-neutral GraphQL operations (phase 3) read the identity, check `workflows` permissions (`editor`; `reassign` and cancel through the viewer flags, 1b R32) and target access, then call these use cases; 1b ships the building blocks (`WorkflowsPermissions`, `CurrentUserTeams`, `CurrentReviewViewer`, `getReviewViewerFlags`).
```

Replace

```
Phase 1b adds `actor` to the workflow events.
```

with

```
Phase 2 adds `actor` to the workflow use case input and events, with the app wrappers that build the actor (D132; moved from 1b, 1b R39).
```

Replace

```
- Permissions and identity: `editor` on workflow and settings use cases, review operation checks, shared permission checker, write access to request, read access to review (1b).
```

with

```
- Permissions and identity: shared permission checker, team lookup, viewer and viewer flags (1b building blocks); `editor`, review operation checks, write access to request and read access to review in the app wrappers (2) and app-neutral GraphQL operations (3), never in the api-workflows use cases (D132).
```

Replace

```
- `actor` on workflow events (1b, R26).
```

with

```
- `actor` on workflow events (2, R26).
```

- [ ] **Step 3: Update the roadmap**

In `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`:

Replace

```
decision log: `docs/.bruno/workflows/decisions.md`, D1-D131
```

with

```
decision log: `docs/.bruno/workflows/decisions.md`, D1-D132
```

Replace

```
delete the old duplicated CMS/WB handlers | 1a | 4.5, 9.2, 9.3 |
```

with

```
delete the old duplicated CMS/WB handlers; `actor` in the workflow use case input and events (1a R26) | 1a, 1b | 4.5, 9.2, 9.3 |
```

After the line

```
- Workflows assume OpenSearch storage (D63); tests for workflows-related storage behaviour run with `yarn test:os` in addition to the default.
```

add

```
- No app operation without its wrapper checks (D132). Every GraphQL operation (phase 3) and every app handler that acts for a user goes through an app wrapper use case (or, for app-neutral operations, a phase 3 operation) that reads the identity, checks `workflows` permissions and target access, and authorizes cancel and reassign by the viewer flags (1b R32). Only those wrappers and AI/automation tasks (phase 5, with an `ai` or `automation` actor) call the api-workflows use cases.
```

- [ ] **Step 4: Update the source comments**

In `packages/api-workflows/src/features/settings/SaveWorkflowSettings/abstractions.ts`, replace

```ts
/** Save the whole settings record; last save wins (D106). No `editor` check in 1a (phase 1b). */
```

with

```ts
/** Save the whole settings record; last save wins (D106). Internal (D132): the caller checks `editor`. */
```

In `packages/api-workflows/src/features/settings/GetWorkflowSettings/abstractions.ts`, replace

```ts
/** Read the tenant's workflow settings. No `editor` check in 1a (phase 1b). */
```

with

```ts
/** Read the tenant's workflow settings. Internal (D132): the caller checks `editor`. */
```

In `packages/api-workflows/src/features/review/GetReview/abstractions.ts`, replace

```ts
/** Get one review. Viewer flags and read permissions arrive in phase 1b. */
```

with

```ts
/**
 * Get one review. Internal (D132): no read check; the app wrapper checks target access and adds
 * the viewer flags (`getReviewViewerFlags`).
 */
```

In `packages/api-workflows/src/features/review/RequestReview/abstractions.ts`, replace

```ts
    /** The requester. 1a takes it explicitly; phase 1b checks permissions and identity. */
```

with

```ts
    /** The requester, built by the app wrapper, which also checks write access (D77, D132). */
```

In `packages/api-workflows/src/features/review/shared/types.ts`, replace

```ts
/** Input of step transitions. 1a takes the actor explicitly; 1b adds permission checks. */
```

with

```ts
/**
 * Input of step transitions. Internal (D132): the app wrapper builds the actor and team ids
 * (`CurrentReviewViewer`) and checks target access.
 */
```

and replace

```ts
    /** Requester or a user with `workflows.reassign`; checked in phase 1b. */
```

with

```ts
    /** Requester or a user with `workflows.reassign`; the app wrapper checks `canCancel` (D132). */
```

In `packages/api-workflows/src/features/workflow/StoreWorkflow/abstractions.ts`, replace

```ts
 * on updates. No permission check in 1a (`editor` is enforced in phase 1b).
```

with

```ts
 * on updates. Internal (D132): no permission check; the app wrapper checks `editor`.
```

In `packages/api-workflows/src/features/workflow/StoreWorkflow/events.ts`, replace

```ts
 * Event payloads. No actor in 1a: workflow use cases take no actor until phase 1b adds one.
```

with

```ts
 * Event payloads. No actor yet: phase 2 adds `actor` to the use case input and events (R26).
```

In `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts`, replace

```ts
/** Delete a workflow unless any of its reviews is in progress. No permission check in 1a. */
```

with

```ts
/**
 * Delete a workflow unless any of its reviews is in progress. Internal (D132): the app wrapper
 * checks `editor`.
 */
```

In `packages/api-workflows/src/features/workflow/DeleteWorkflow/events.ts`, replace

```ts
 * Event payloads. `workflow.savedBy` is the last editor, not the person deleting; phase 1b adds
 * an `actor` to the workflow events.
```

with

```ts
 * Event payloads. `workflow.savedBy` is the last editor, not the person deleting; phase 2 adds
 * an `actor` to the workflow events (R26).
```

In `packages/api-workflows/src/features/workflow/GetWorkflow/abstractions.ts`, replace

```ts
/** Get one workflow by id. No permission check in 1a (phase 1b). */
```

with

```ts
/** Get one workflow by id. Internal (D132): no permission check. */
```

In `packages/api-workflows/src/features/workflow/ListWorkflows/abstractions.ts`, replace

```ts
/** List workflows, optionally by bound model. No permission check in 1a (phase 1b). */
```

with

```ts
/** List workflows, optionally by bound model. Internal (D132): no permission check. */
```

- [ ] **Step 5: Verify nothing still promises a 1b check**

Run: `grep -rnw "1b" packages/api-workflows/src docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`
Expected: 5 lines, all in `00-shared.md` and all correct under D132: R6 ("1b R32", "1b ships the building blocks"), R8 ("viewer flags (1b)"), R26 ("moved from 1b, 1b R39"), "Permissions and identity" ("1b building blocks") and "Viewer flags ... (1b)". No match under `packages/api-workflows/src`.
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (comments only).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: not runnable locally (A9); record "not run" and leave it to CI.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "docs(api-workflows): point permission notes at the app wrappers (D132)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
