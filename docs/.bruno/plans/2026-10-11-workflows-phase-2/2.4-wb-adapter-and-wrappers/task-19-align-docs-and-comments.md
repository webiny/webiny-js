### Task 19: Align feature comments, the 1a/1b notes and the roadmap with phase 2

Comments and docs that still describe phase 2 as future work, plus the one stale reference to a deleted handler. No behaviour change.

**Files:**
- Modify: `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewTargetLoader/abstractions.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewTargetSync/abstractions.ts`
- Modify: `packages/api-workflows/src/domain/review/errors.ts`
- Modify: `packages/api-workflows/src/domain/workflow/canPickReviewer.ts`
- Modify: `packages/api-workflows/src/domain/assignment/assignment.model.ts`
- Modify: `packages/api-website-builder/src/features/experiments/EndExperimentOnPublish/EndExperimentOnPublishHandler.ts`
- Modify: `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`
- Modify: `docs/.bruno/plans/2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`

**Interfaces:**
- Consumes: what Tasks 1-18b landed.
- Produces: no code behaviour change.

- [ ] **Step 1: Find the stale wording (the "failing test")**

Run:

```
grep -rni "phase 2 registers\|in phase 2; 1a ships none\|1a registers none (nothing to sync); phase 2\|phase 2 adapters produce\|app wrapper (phase 2)\|deleted with its review (phase 2)\|ValidateWorkflowStateOnPageBeforePublish" packages/api-workflows/src packages/api-website-builder/src
```

Expected: hits in `ReviewLifecycleFeature.ts` ("Phase 2 registers", matched case-insensitively), `ReviewTargetLoader/abstractions.ts`, `ReviewTargetSync/abstractions.ts`, `domain/review/errors.ts` ("phase 2 adapters produce"), `domain/workflow/canPickReviewer.ts` ("app wrapper (phase 2)"), `domain/assignment/assignment.model.ts` ("Deleted with its review (phase 2)") and `EndExperimentOnPublishHandler.ts`. Then run `grep -rni "phase 2" packages/api-workflows/src packages/api-headless-cms-workflows/src packages/api-website-builder-workflows/src` and fix any other future-tense mention the same way (the `StoreWorkflow` / `DeleteWorkflow` event comments were rewritten by Task 2).

- [ ] **Step 2: Engine comments**

In `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts` replace the doc comment above `ReviewLifecycleFeature` with:

```ts
/**
 * Defaults for the review lifecycle. The app target adapters register one `ReviewTargetLoader`,
 * `ReviewTargetSync` and `ReviewTargetReadAccess` per namespace (`cms.*` in
 * api-headless-cms-workflows, `wb.page` in api-website-builder-workflows); the last registered
 * match wins and none matching means nothing to load, sync or read (R28, R50). Phase 4 registers
 * its `StepAssignmentResolver` after `WorkflowsFeature`; the last registration wins on resolve.
 */
```

In `packages/api-workflows/src/features/review/ReviewTargetLoader/abstractions.ts` replace the doc comment above `ReviewTargetLoader` with:

```ts
/**
 * Loads the content under review (spec 9.3). One implementation per namespace, registered by the
 * app target adapters (`cms.*`, `wb.page`); the last registered match wins (A10).
 */
```

In `packages/api-workflows/src/features/review/ReviewTargetSync/abstractions.ts` replace the doc comment above `ReviewTargetSync` with:

```ts
/**
 * Writes `system.workflow` on the target after every review save (spec 4.5, D52). One
 * implementation per namespace, registered by the app target adapters with
 * `UpdateEntrySystemUseCase` (R63); the last registered match wins, none matching means nothing to
 * sync (R28).
 */
```

In `packages/api-workflows/src/domain/review/errors.ts`, in the doc comment of `ReviewTargetSyncError`, replace `phase 2 adapters produce the underlying errors.` with `the app target adapters' syncs produce the underlying errors.`

In `packages/api-workflows/src/domain/workflow/canPickReviewer.ts`, in the doc comment, replace `belong to the app wrapper (phase 2) and to` with `belong to the app wrappers (request) and to`.

In `packages/api-workflows/src/domain/assignment/assignment.model.ts`, replace `Deleted with its review (phase 2).` with `Deleted with its review (DeleteTargetReviewsUseCase).`

- [ ] **Step 3: The stale WB comment**

In `packages/api-website-builder/src/features/experiments/EndExperimentOnPublish/EndExperimentOnPublishHandler.ts` replace `approval workflow (ValidateWorkflowStateOnPageBeforePublish). So approving + publishing the` with `approval workflow (RequireApprovedReviewOnPagePublish in api-website-builder-workflows). So approving + publishing the` and re-wrap the comment to 100 columns if `yarn format:fix` does not.

- [ ] **Step 4: Earlier plans and the roadmap**

In `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`:
1. In R12 replace `(phase 3 adds the up-to-5 listing, D115)` with `(phase 2 adds the blocking reviews; the app wrappers list up to 5 readable ones, D115, phase 2 R57)`.
2. In R26 append: ` Done in phase 2 (Task 2, R58).`
3. In "Not in this phase", in the GraphQL bullet, delete `delete-blocked listing of up to 5 reviews (D115);`, and change the bullet `- \`actor\` on workflow events (2, R26).` to `- \`actor\` on workflow events (2, R26; landed, phase 2 R58).`

In `docs/.bruno/plans/2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md`, add after the "For agentic workers" blockquote:

```
> **Status note (after phase 2):** the app wrappers, target access checks, `actor` on workflow events and `canUserRead` landed in phase 2 (`docs/.bruno/plans/2026-10-11-workflows-phase-2/`); the "Not in this phase" items marked (2) are done there.
```

In `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`:
1. In the phase 2 row, after `` `actor` in the workflow use case input and events (1a R26, 1b R39); `` insert `delete-blocked error: engine count plus blocking reviews, wrapper keeps 5 readable (D115); `.
2. In the phase 3 row delete `delete-blocked error: engine count plus blocking reviews, wrapper keeps 5 readable (D115); `.
3. In the phase 2 row replace `delete the old duplicated CMS/WB handlers` with `delete the old duplicated CMS/WB handlers (done in 1a; leftovers removed in phase 2)`.

- [ ] **Step 5: Verify**

Run the grep from Step 1 again (case-insensitive). Expected: no hits.
Run: `grep -n "D115" docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` Expected: one hit, in the phase 2 row (plus the decision range in the header if present).
Run: `yarn test packages/api-workflows 2>&1 | tail -20` Expected: PASS.
Run: `yarn test packages/api-website-builder 2>&1 | tail -20` Expected: PASS (comment only).

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` and `@webiny/api-website-builder`), then commit:

```
docs: align workflows comments, 1a/1b notes and roadmap with phase 2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
