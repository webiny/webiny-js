### Task 6: Align the 1a rules and code comments with D132 and D133

**Files:**
- Modify: `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`
- Modify: `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts`
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
- Consumes: D132, D133; rulings R38, R39, R40, R41, R43 of this plan.
- Produces: no code behaviour change. The 1a shared rules say that the api-workflows use cases stay internal for good, the checks live in the per-app wrappers (phase 2) and, for app-neutral configuration, in the shared configuration operations (phase 3, `editor` only), the engine touches identity only in the two D133 places, and `actor` on workflow events moves to phase 2. No source comment promises a phase 1b check any more, and the feature comments name the per-app wrappers. The roadmap already carries the D132/D133 changes (phase 2 depends on 1a and 1b, the cross-phase rule "no app operation without its wrapper checks"); it was updated with this plan, so this task does not touch it.

- [ ] **Step 1: List what still reads wrong**

Run: `grep -rnw "1b" packages/api-workflows/src docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`
Expected: 17 lines. Under `src` (11): `SaveWorkflowSettings/abstractions.ts`, `GetWorkflowSettings/abstractions.ts`, `GetReview/abstractions.ts`, `RequestReview/abstractions.ts`, `review/shared/types.ts` (2), `StoreWorkflow/abstractions.ts`, `StoreWorkflow/events.ts`, `GetWorkflow/abstractions.ts`, `ListWorkflows/abstractions.ts`, `DeleteWorkflow/events.ts` (`Review.ts` lost its two 1b comments in Task 2). In `00-shared.md` (6): R6, R8 ("viewer flags (1b)", correct, stays), R26, and the "Not in this phase" lines "Permissions and identity", "Viewer flags" (correct, stays) and "`actor` on workflow events". `-w` keeps the session URL (`...01U31bV...`) out of the matches.

- [ ] **Step 2: Update the 1a shared rules**

In `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`:

Replace

```
Transitions are identity-free, so the aggregate is the only guard in 1a.
```

with

```
Transitions are identity-free, so the aggregate is the engine's only guard; permission and target checks run in the app wrappers (D132, D133).
```

Replace

```
Permission checks and identity reading are phase 1b: nothing in 1a reads `IdentityContext` in review transitions or their use cases. Workflow CRUD permission (`editor`) also moves to 1b: the 1a workflow and settings use cases do no permission check.
```

with

```
Nothing in 1a reads `IdentityContext` in review transitions or their use cases, and the workflow and settings use cases do no permission check. Under D132 and D133 this stays so: the api-workflows use cases are an internal engine. Each app's wrapper use cases (phase 2) read the identity, check the `workflows` permission (`editor`; cancel and reassign with the 1b permission-only predicates, 1b R41) and target access, then call these use cases; the shared configuration operations in api-workflows (phase 3) check only `editor`. The engine touches identity in two places only: candidates' read access through the app's target adapter (phase 4) and `withIdentity(requester)` around task triggers (phase 5).
```

Replace

```
Notifications features stay untouched.
```

with

```
Notifications features stay untouched in 1a (1b R40 then removes the copied `editor` check from `ListNotificationTypesUseCase`, D133).
```

Replace

```
Phase 1b adds `actor` to the workflow events.
```

with

```
Phase 2 adds `actor` to the workflow use case input and events, with the per-app workflow store and delete wrappers that build the actor (D132, D133; moved from 1b, 1b R39).
```

Replace

```
- Permissions and identity: `editor` on workflow and settings use cases, review operation checks, shared permission checker, write access to request, read access to review (1b).
```

with

```
- Permissions and identity: shared permission checker, team lookup, viewer, viewer flags and permission-only predicates (1b building blocks); `editor`, review operation checks, write access to request and read access to review in the per-app wrappers (2) and, for app-neutral configuration, the shared configuration operations (3), never in the api-workflows use cases (D132, D133).
```

Replace

```
- GraphQL schema, including
```

with

```
- GraphQL schema (per app, plus the shared configuration operations, D133), including
```

Replace

```
- `actor` on workflow events (1b, R26).
```

with

```
- `actor` on workflow events (2, R26).
```

Replace

```
- Notifications on review events (7); existing notifications features are untouched.
```

with

```
- Notifications on review events (7); existing notifications features are untouched (1b R40 removes the `editor` check from `ListNotificationTypesUseCase`).
```

- [ ] **Step 3: Update the feature comments**

In `packages/api-workflows/src/WorkflowsFeature.ts`, replace

```ts
        // Notifications (unchanged until phase 7)
```

with

```ts
        // Notifications (internal, no permission check, D133; recipient rules arrive in phase 7)
```

In `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`, replace

```ts
        // Entry handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as target adapters in phase 2.
```

with

```ts
        // Entry handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as the `cms.*` target adapter in phase 2, next to the CMS wrapper use cases and GraphQL
        // operations that read the identity and check permissions (D132, D133).
```

In `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts`, replace

```ts
        // Page handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as the `wb.page` target adapter in phase 2.
```

with

```ts
        // Page handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as the `wb.page` target adapter in phase 2, next to the Website Builder wrapper use cases
        // and GraphQL operations that read the identity and check permissions (D132, D133).
```

- [ ] **Step 4: Update the source comments**

In `packages/api-workflows/src/features/settings/SaveWorkflowSettings/abstractions.ts`, replace

```ts
/** Save the whole settings record; last save wins (D106). No `editor` check in 1a (phase 1b). */
```

with

```ts
/**
 * Save the whole settings record; last save wins (D106). Internal (D132): the shared settings
 * operation checks `editor` (D133).
 */
```

In `packages/api-workflows/src/features/settings/GetWorkflowSettings/abstractions.ts`, replace

```ts
/** Read the tenant's workflow settings. No `editor` check in 1a (phase 1b). */
```

with

```ts
/**
 * Read the tenant's workflow settings. Internal (D132): the shared settings operation checks
 * `editor` (D133).
 */
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
    /** Requester or `workflows.reassign`; the app wrapper checks `canCancelByPermission` (D132). */
```

In `packages/api-workflows/src/features/workflow/StoreWorkflow/abstractions.ts`, replace

```ts
 * on updates. No permission check in 1a (`editor` is enforced in phase 1b).
```

with

```ts
 * on updates. Internal (D132): no permission check; each app's store wrapper checks `editor`.
```

In `packages/api-workflows/src/features/workflow/StoreWorkflow/events.ts`, replace

```ts
 * Event payloads. No actor in 1a: workflow use cases take no actor until phase 1b adds one.
```

with

```ts
 * Event payloads. No actor yet: the phase 2 app wrappers add `actor` to the input and events (R26).
```

In `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts`, replace

```ts
/** Delete a workflow unless any of its reviews is in progress. No permission check in 1a. */
```

with

```ts
/**
 * Delete a workflow unless any of its reviews is in progress. Internal (D132): each app's
 * delete wrapper checks `editor`.
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
Expected: 7 lines, all in `00-shared.md` and all correct under D132 and D133: R6 ("1b permission-only predicates, 1b R41"), R8 ("viewer flags (1b)"), R14 ("1b R40"), R26 ("moved from 1b, 1b R39"), "Permissions and identity" ("1b building blocks"), "Viewer flags ... (1b)" and "Notifications on review events" ("1b R40"). No match under `packages/api-workflows/src`.
Run: `grep -rn "phase 1b\|in 1b\|1a (phase" packages/api-headless-cms-workflows/src packages/api-website-builder-workflows/src packages/api-workflows/src`
Expected: no output.
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (comments only).
Run: `yarn test packages/api-headless-cms-workflows packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (comments only).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: not runnable locally (A9); record "not run" and leave it to CI.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows`), then:

```bash
git commit -m "docs(api-workflows): point permission notes at the app wrappers (D132, D133)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
