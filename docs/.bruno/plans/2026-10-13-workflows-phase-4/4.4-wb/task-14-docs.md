### Task 14: Align comments, the roadmap, the spec and earlier plan notes with phase 4

Spec 4.3, 6, 10; D20, D45, D48, D63, D69, D104, D117, D118, D128, D133, D136, D137; R109, R111, R112, R114-R130; A44, A46-A50. Comments and docs that still describe phase 4 as future work, the roadmap's phase 4 row (with "done" notes, as phase 3's Task 13 did for phase 3), the spec's assignment log (4.3), routing (6) and GraphQL surface (10) with the names actually built (R109, R124), the decision range (D137), the decisions whose operations were built or refined (D48, D69, D118, D128), and the earlier plans' notes that hand items to phase 4. No behaviour change.

**Files:**
- Modify (each only if the earlier phase 4 task left the wording, see Step 2): `packages/api-workflows/src/WorkflowsFeature.ts`, `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts`, `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts`, `packages/api-workflows/src/features/review/ReviewTargetReadAccess/abstractions.ts`, `packages/api-workflows/src/domain/assignment/types.ts`, `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts`, `packages/api-workflows/src/domain/review/Review.ts`, `packages/api-workflows/src/domain/review/types.ts`, `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`, `packages/api-workflows/src/domain/workflow/canPickReviewer.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/assignments.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts`
- Modify: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `docs/.bruno/workflows/decisions.md`
- Modify: `docs/.bruno/plans/2026-10-13-workflows-phase-3/00-shared.md`
- Modify: `docs/.bruno/plans/2026-10-11-workflows-phase-2/00-shared.md`
- Modify: `docs/.bruno/plans/2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md`
- Modify: `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`

**Interfaces:**
- Consumes: what Tasks 1-13 landed: the names in `../00-shared.md` R109-R130 and A46-A50 and the 4.1-4.4 task files (`RoutingStepAssignmentResolver`, `RoutingEvaluatorService`, `ReviewTargetFolderChain`, `ReviewTargetReadAccess.canUserReadInFolder`, `ReassignReviewStepUseCase`, `InspectRoutingUseCase`, `ListStepCandidatesUseCase`, `ListWorkflowUsersUseCase`, the per-app wrappers and GraphQL fields of R124, `workflows.listUsers`).
- Produces: no code behaviour change.

- [ ] **Step 1: Find the stale wording (the "failing test")**

Run:

```
grep -rni "phase 4" packages/api-workflows/src packages/api-headless-cms-workflows/src packages/api-website-builder-workflows/src packages/api-workflows/__tests__ packages/api-headless-cms-workflows/__tests__ packages/api-website-builder-workflows/__tests__
grep -rn "A44" packages/api-headless-cms-workflows/__tests__ packages/api-website-builder-workflows/__tests__
```

Expected hits, minus what Tasks 1-13 already rewrote: `WorkflowsFeature.ts` ("written from phase 4"), `ReviewLifecycleFeature.ts` ("Phase 4 registers its `StepAssignmentResolver`"), `StepAssignmentResolver/abstractions.ts` ("phase 4 replaces it"), `PoolStepAssignmentResolver.ts` (Task 1 rewords it to "Replaced by the routing resolver (phase 4)" and Task 3 deletes the file; a hit means the file is still there, which Task 3 must fix, not this task), `ReviewTargetReadAccess/abstractions.ts` ("Phase 4 asks it"), `domain/assignment/types.ts` ("Written from phase 4"), `AssignmentRepository.ts` ("phase 4: latest record per candidate"), `Review.ts` ("arrives in phase 4"), `WorkflowValidator.ts` ("validated in phase 4 (A7)"), `canPickReviewer.ts` ("routing (phase 4)"), and only if Task 1 did not rewrite them, WB `__tests__/__helpers/assignments.ts` ("before phase 4 (A44)") and CMS `__tests__/__helpers/seeds.ts` ("(A44)"). Any other hit is future-tense phase 4 wording: rewrite it the same way (describe what the code does now, cite the ruling).

Also run `grep -rn 'rule id, "strategy"' -i packages/api-workflows/src`. Expected: at most the `ReviewStepAssignment` comment in `domain/review/types.ts` (handled in Step 2); Task 1 replaced the others (R109).

- [ ] **Step 2: Code comments**

Each replacement below applies only when the file still contains the quoted text; when an earlier task already rewrote it, leave the file as it is.

In `packages/api-workflows/src/WorkflowsFeature.ts` replace

```ts
        // Assignment log (written from phase 4, read by the get-review wrappers)
```

with

```ts
        // Assignment log (written after each review save, R117; read by the get-review wrappers)
```

In `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts` replace

```
 * match wins and none matching means nothing to load, sync or read (R28, R50). Phase 4 registers
 * its `StepAssignmentResolver` after `WorkflowsFeature`; the last registration wins on resolve.
```

with

```
 * match wins and none matching means nothing to load, sync or read (R28, R50).
 * `ReviewTargetFolderChain` (R114) resolves the same way (last match wins); no match while a
 * folder rule needs it sends the step to the pool (R116). The step resolver is
 * `RoutingStepAssignmentResolver` (pick, rules, strategy, pool; spec 6, R110).
```

In `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts` replace

```
 * Decides who holds a review step when it is reached (spec 5.2, 6). 1a registers a pool-only
 * resolver; phase 4 replaces it with picks, rules and strategies.
```

with

```
 * Decides who holds a review step when it is reached (spec 5.2, 6): `RoutingStepAssignmentResolver`
 * tries the pick, the rules, the step's strategy and then the pool (R110); any failure goes to the
 * pool (R116).
```

In `packages/api-workflows/src/features/review/ReviewTargetReadAccess/abstractions.ts` replace

```
 * no match means no access (R50). Phase 4 asks it for candidates and reassign; the engine never
 * asks it about the caller, whose checks are the app wrappers'. Not to be confused with the 1b
```

with

```
 * no match means no access (R50). Routing asks it for picks, rule targets and strategy candidates,
 * reassign for the chosen user, the step-candidate list for every member and the inspector for
 * folder-level access (R111, R112, R120, R121); the engine never asks it about the caller, whose
 * checks are the app wrappers'. Not to be confused with the 1b
```

In `packages/api-workflows/src/domain/assignment/types.ts` replace (Task 1's wording)

```ts
/** One assignment-log record (spec 4.3, D20, D45, D127). Written from phase 4. */
```

with

```ts
/** One assignment-log record (spec 4.3, D20, D45, D127), written after the review save (R117). */
```

If Task 1 left the older line `/** One assignment decision (spec 4.3, D20, D45, D127). Written from phase 4. */` instead, replace that one with the same new line.

In `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts` replace

```ts
    /** Records of any of these users (phase 4: latest record per candidate, D20). */
```

with

```ts
    /** Records of any of these users (least-loaded tie-break: latest record per candidate, D20). */
```

In `packages/api-workflows/src/domain/review/Review.ts` replace

```
     * Reassign is possible on an `awaiting` or human-owned `inReview` step (D33). The transition
     * arrives in phase 4 and must use the same guard; who may reassign (`reassign`) is checked by
     * the app wrapper with `canReassignByPermission` (D132, R41).
```

with

```
     * Reassign is possible on an `awaiting` or human-owned `inReview` step (D33); `reassign` uses
     * the same guard (R119). Who may reassign (`reassign`) is checked by the app wrapper with
     * `canReassignByPermission` (D132, R41).
```

In `packages/api-workflows/src/domain/review/types.ts`, only if it is still there, replace

```ts
/** "Why this owner" (D127). Sources: rule id, "strategy", "picked", "pool", "poolStart", "takeOver", "reassign". */
```

with

```ts
/**
 * "Why this owner" (D127). Sources: "picked", "rule", "roundRobin", "leastLoaded", "pool",
 * "poolStart", "takeOver", "reassign"; `ruleId` names the rule that decided (R109).
 */
```

In `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts` replace

```ts
        // Spec 6: team targets must be among the step's teams. User targets need team lookups
        // and are validated in phase 4 (A7).
```

with

```ts
        // Spec 6: team targets must be among the step's teams. User targets need a user lookup
        // and are validated by `StoreWorkflowUseCase` (R122).
```

In `packages/api-workflows/src/domain/workflow/canPickReviewer.ts` replace

```
 * target, D77; which users may be picked, D33/D61) belong to the app wrappers (request) and to
 * routing (phase 4).
```

with

```
 * target, D77; which users may be picked, D33/D61) belong to the app wrappers (request) and to
 * routing, which validates the pick when the step is reached (R112).
```

In `packages/api-website-builder-workflows/__tests__/__helpers/assignments.ts` replace

```
 * Two assignment-log records of the review's only step, written straight to the repository:
 * nothing writes the log before phase 4 (A44).
```

with

```
 * Two assignment-log records of the review's only step, written straight to the repository so the
 * test controls them exactly (routing writes its own records after each save, R117).
```

In `packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts` replace

```
 * Two assignment records of the only step (A44): an outcome (the pool) and, a minute later, a
```

with

```
 * Two assignment records of the only step, written straight to the repository so the test controls
 * them exactly (routing writes its own records, R117): an outcome (the pool) and, a minute later, a
```

Re-wrap any changed comment to 100 columns if `yarn format:fix` does not.

- [ ] **Step 3: The spec**

In `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`:

1. In the status line (line 3) replace

```
updated 2026-10-13 (D135:
```

with

```
updated 2026-10-13 (D137: least loaded counts load per app; D135:
```

and replace `Consolidates decisions D1-D136` with `Consolidates decisions D1-D137`.

2. In section 4.3 replace

```
`source` (rule id, strategy, picked, reassign, pool, poolStart, takeOver), `by` (actor for reassign and take over) [D127], `reason` (for skips and fall-through, e.g. "pick excluded", "rule target invalid", "no read access").
```

with

```
`source` (`picked`, `rule`, `roundRobin`, `leastLoaded`, `pool`, `poolStart`, `takeOver`, `reassign`), `ruleId` (the rule that decided, also when a team-target rule narrowed the candidates for the strategy or the pool), `by` (actor for reassign and take over) [D127], `reason` (for skips and fall-through, fixed texts: "Not a member of the step's teams.", "Excluded from reviews.", "The requester cannot review.", "Cannot read this content.", "No eligible candidate; the step went to the pool.", "Routing failed; the step went to the pool.", "The resolved owner is the requester, who cannot review their own content."; an exclusion's own reason never goes into a record [D89, D97]; a step routed to its pool by configuration has no reason), `kind` (`outcome` for the decision, `skip` for each person passed over).
```

3. In section 6 replace

```
`leastLoaded` runs one query (`currentOwnerId_in: candidates`, `currentStepState: inReview`, active), groups by owner, ties go to the least recently assigned per the assignment log [D20, D63].
```

with

```
`leastLoaded` counts each candidate's active in-review reviews (`currentOwnerId_in: candidates`, `currentStepState: inReview`) in the review's app only (CMS: every `cms.*` namespace; Website Builder: `wb.page`); fewest wins, ties go to the least recently assigned per the same app's assignment log (never assigned counts as least recent), then user id order [D20, D63, D137].
```

4. In section 6 replace

```
The engine asks the target adapter of the review's namespace whether a candidate can read the target (e.g. `canUserRead(userId, target)`); the app supplies the permission logic.
```

with

```
The engine asks the target adapter of the review's namespace whether a candidate can read the target (`canUserRead(userId, target)`); without a target revision (the rule inspector) it asks for folder-level access instead (`canUserReadInFolder(userId, model, folderId)`: model read and folder content read, no entry). The app supplies the permission logic. Read checks run lazily, in the order a source needs them.
```

5. In section 6 replace

```
Every decision writes an assignment-log record and sets the step's `assignmentSource`. Start from the pool and take over also write a record (sources `poolStart`, `takeOver`), so rotation, tie-breaks and "who holds this and why" stay explainable.
```

with

```
Every decision writes an assignment-log record and sets the step's `assignmentSource`. Start from the pool, take over and reassign also write a record (sources `poolStart`, `takeOver`, `reassign`), so rotation, tie-breaks and "who holds this and why" stay explainable. Records are written after the review is saved; a failed write is logged and never fails the request. The folder chain comes from a per-app port (`ReviewTargetFolderChain`, ACO `GetAncestors` without folder-level permissions).
```

5a. In section 6 replace

```
4. Pool: `awaiting`, logged with `userId: null` and the reason [D45].
```

with

```
4. Pool: `awaiting`, logged with `userId: null` and, when something failed or nobody was eligible, the reason; a step routed to its pool by configuration (no pick, no matching rule, strategy `none`) has none [D45].
```

5b. In section 6 replace

```
Candidates are members of `candidateTeamIds` (default: the step's teams), minus the requester, minus active exclusions, minus users without read access to the target (folder access and model read) [D21, D61].
```

with

```
Candidates are members of `candidateTeamIds` (default: the step's teams), minus the requester, minus active exclusions, minus users without read access to the target (folder access and model read) [D21, D61]. Strategy candidates that are excluded or the requester are dropped without a record; each candidate refused for read access gets a skip record; nobody readable sends the step to the pool with "No eligible candidate; the step went to the pool." [A50].
```

5c. In section 6 replace

```
- Folder: the target's current folder and its ancestors (ACO `GetAncestors`, includes the folder itself), evaluated at step reached so later steps see the folder as it is then. `includeDescendants` matches if the rule folder is in that chain.
```

with

```
- Folder: the target's current folder and its ancestors (ACO `GetAncestors`, includes the folder itself), evaluated at step reached so later steps see the folder as it is then. The folder is the review's `targetContext.folder`: moves are refused while a review is in progress, so it is the target's current folder; its ancestors are read at step reached through the per-app folder port, so a moved parent is seen as it is then [R130]. `includeDescendants` matches if the rule folder is in that chain.
```

5d. In section 6 replace

```
A rule whose user target is currently excluded is skipped like any invalid target; the trace and the rule inspector mark it "Skipped" with the exclusion reason [D118].
```

with

```
A rule whose user target is currently excluded is skipped like any invalid target; the trace and the rule inspector (editor only) mark it "Skipped" with the exclusion reason ("Excluded from reviews." when it has none) and list the person among the skipped people, with the pick and the strategy candidates refused read access. The assignment-log record keeps the fixed "Excluded from reviews." [D118, D89, D97, R129].
```

6. In section 10, in the root `workflows` bullet replace

```
the shared configuration operations (`getSettings`, `updateSettings`, `listStepTypes`; later users, transports, automation definitions, AI tools).
```

with

```
the shared configuration operations (`getSettings`, `updateSettings`, `listStepTypes`, `listUsers(search, ids, limit)` → `{ users: { id, displayName }[], missingIds }`; later transports, automation definitions, AI tools).
```

7. In section 10, in the root `cms` bullet replace

```
`listCmsEntryWorkflowModels(search, limit, after)`; `storeCmsEntryWorkflow(data, savedOn)`,
```

with

```
`listCmsEntryWorkflowModels(search, limit, after)`, `listCmsEntryStepCandidates(workflowId, stepId, modelId, revisionId)`, `listCmsEntryReviewStepCandidates(reviewId, stepId)`, `inspectCmsEntryRouting(stepConfig, modelId, requesterId, folderId)`, `cmsEntryFolderExists(id, type)`; `storeCmsEntryWorkflow(data, savedOn)`,
```

and replace

```
`rejectCmsEntryReviewStep` (each `reviewId, stepId`, approve and reject also `comment`), `cancelCmsEntryReview(reviewId)`,
```

with

```
`rejectCmsEntryReviewStep` (each `reviewId, stepId`, approve and reject also `comment`), `reassignCmsEntryReviewStep(reviewId, stepId, userId)`, `cancelCmsEntryReview(reviewId)`,
```

8. In section 10, in the root `websiteBuilder` bullet replace

```
`cancelWebsiteBuilderPageReviewsForDelete(pageId, action)`); there is no WB model list.
```

with

```
`cancelWebsiteBuilderPageReviewsForDelete(pageId, action)`, `listWebsiteBuilderPageStepCandidates(workflowId, stepId, revisionId)`, `listWebsiteBuilderPageReviewStepCandidates(reviewId, stepId)`, `inspectWebsiteBuilderPageRouting(stepConfig, requesterId, folderId)`, `websiteBuilderPageFolderExists(id)` (the type is always `wb:page`), `reassignWebsiteBuilderPageReviewStep(reviewId, stepId, userId)`); there is no WB model list.
```

9. In section 10 replace

```
- `listStepCandidates(workflowId, stepId)` for Request review, `listStepCandidates(reviewId, stepId)` for Reassign (from the review snapshot) → `{ id, displayName, excluded, excludedReason }`; `excludedReason` only for `editor` / `reassign`; no workload counts [D48, D97, D104, D128]
```

with

```
- `listStepCandidates(workflowId, stepId, target revision)` for Request review (write access to the target; the workflow must belong to the app, another app's workflow is not found [R128]; read access checked per candidate), `listStepCandidates(reviewId, stepId)` for Reassign (`reassign` and read access; from the review snapshot) → every member of the step's teams except the requester, sorted by name: `{ id, displayName, excluded, excludedReason }` (excluded: an active exclusion or no read access); `excludedReason` only for `editor` / `reassign`; no workload counts [D48, D97, D104, D128]
```

and replace

```
- `listUsers` [D48]; also accepts a list of ids and reports which do not exist, so the editor can show saved targets as "Deleted user" [D117]
```

with

```
- `listUsers(search, ids, limit)` → `{ users: { id, displayName }[], missingIds }` [D48, D104]; also accepts a list of ids (up to 200) and reports which do not exist, so the editor can show saved targets as "Deleted user" [D117]
```

and replace

```
- `folderExists(id, type)` → boolean [D69, D133]
```

with

```
- `folderExists(id, type)` → boolean, `editor` only; the type must be the app's (`cms:<modelId>` of a bindable model; Website Builder takes only the id, `wb:page`) [D69, D133]
```

and replace

```
- start (`StartReviewStep`), take over (`TakeOverReviewStep`, `notifyPreviousOwner = true`) [D111], reassign (`reviewId`, `userId`), approve (`comment?`), reject (`comment`), restart, cancel review
```

with

```
- start (`StartReviewStep`), take over (`TakeOverReviewStep`, `notifyPreviousOwner = true`) [D111], reassign (`ReassignReviewStep`: `reviewId`, `stepId`, `userId`; the chosen user is validated like a pick, the current owner is refused), approve (`comment?`), reject (`comment`), restart, cancel review
```

- [ ] **Step 4: The roadmap**

In `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`:

1. In the **Spec** line replace `D1-D136` with `D1-D137`.
2. In the phase 4 row replace `Exclusion settings (unique user D105, last save wins D106); candidate resolution` with `Exclusion settings (unique user D105, last save wins D106; in place before phase 4); candidate resolution`.
3. In the phase 4 row replace `round-robin and least-loaded; picks;` with `round-robin and least-loaded (least loaded counts per app, D137); picks;`.
4. In the phase 4 row replace `assignment log;` with `assignment log (written after the save, also for start, take over and reassign);`.
5. In the phase 4 row replace

```
shared `listUsers` incl. lookup by ids (D117); per-app wrappers and GraphQL for each
```

with

```
save-time validation of rule user targets (1a A7); shared `listUsers` incl. lookup by ids (D117); per-app wrappers and GraphQL for each (CMS on `cms`, WB on `websiteBuilder`, `listUsers` on `workflows`). Done: `docs/.bruno/plans/2026-10-13-workflows-phase-4/`
```

- [ ] **Step 5: Decisions**

In `docs/.bruno/workflows/decisions.md`:

1. After the line `_Refined by D133: \`folderExists\` is per app and takes the folder \`type\`._` (end of D69) add a new line:

```
_Built in phase 4: `cmsEntryFolderExists(id, type)` and `websiteBuilderPageFolderExists(id)` (the type is always `wb:page`), `editor` only._
```

2. After the line `_Refined by D133: \`listStepCandidates\` is per app; the wrapper checks write access or \`reassign\` and redacts \`excludedReason\`._` (end of D128) add a new line:

```
_Built in phase 4: `listCmsEntryStepCandidates` / `listWebsiteBuilderPageStepCandidates` (request; they also take the target revision, so read access is checked per candidate; the workflow must belong to the app, another app's workflow is not found, R128) and `listCmsEntryReviewStepCandidates` / `listWebsiteBuilderPageReviewStepCandidates` (reassign)._
```

3. After the line `_Refined by D133: \`listUsers\` is a shared configuration operation in api-workflows (\`editor\`); \`listStepCandidates\` is per app. The \`workflows.*\` names above are capability names, not final operations._` (end of D48) add a new line:

```
_Built in phase 4 (R123): `workflows.listUsers(search, ids, limit)` returns `{ id, displayName }` only (D104), ids up to 200 with `missingIds` (D117)._
```

4. After the D118 paragraph (ending `From design answer QBZ-41.`) add a new line:

```
_Built in phase 4 (R129): the inspector's trace and its skipped-people list show the exclusion's own reason ("Excluded from reviews." when it has none); assignment-log records keep the fixed text (D89, D97)._
```

- [ ] **Step 6: Earlier plan notes**

In `docs/.bruno/plans/2026-10-13-workflows-phase-3/00-shared.md`:

1. Add after the "For agentic workers" blockquote:

```
> **Status note (after phase 4):** routing, the assignment-log writes, reassign, `listUsers`, `inspectRouting`, `listStepCandidates`, `folderExists` and the save-time check of rule user targets landed in phase 4 (`docs/.bruno/plans/2026-10-13-workflows-phase-4/`, R109-R130); the "Not in this phase" items marked (4) are done there.
```

2. At the end of A44 append: ` Phase 4 writes them after each save (R117); tests that need exact records still seed them.`
3. At the end of the "Not in this phase" bullet `- Writing assignment records (4). Phase 3 only reads and redacts them.` append ` Done in phase 4 (R117).`

In `docs/.bruno/plans/2026-10-11-workflows-phase-2/00-shared.md`:

1. In R62 replace `` `excludedReason` lands with `listStepCandidates` (phase 4).`` with `` `excludedReason` redaction done in phase 4, in the per-app step-candidate wrappers (R120).``
2. At the end of R50 append: ` Phase 4 consumes it (R111, R112, R119, R120) and adds \`canUserReadInFolder\` for the inspector (R121).`
3. At the end of the "Not in this phase" bullet that starts `- Routing: candidates' read access through \`ReviewTargetReadAccess\`` append ` Done in phase 4.`

In `docs/.bruno/plans/2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md`, at the end of the bullet that starts `- Routing, candidates (read access through the app's target adapter, D61, D133), reassign transition` append ` Done in phase 4 (R111, R112, R119, R120).`

In `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`:

1. At the end of A7 append: ` Done in phase 4 (R122).`
2. At the end of A12 append: ` Phase 4: round-robin takes the latest \`outcome\` record with a user (R115).`
3. At the end of the bullet that starts `- Routing: pick validation on step reached, rules, strategies` append ` Done in phase 4.`

- [ ] **Step 7: Verify**

Run the first grep from Step 1 again. Expected: no hits.
Run: `grep -n "D137" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` Expected: hits in the spec status line and section 6, and in the roadmap Spec line and phase 4 row.
Run: `grep -n "websiteBuilderPageFolderExists\|reassignCmsEntryReviewStep\|reassignWebsiteBuilderPageReviewStep\|listUsers(search" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` Expected: hits in section 10.
Run: `grep -n "R128\|R129\|R130\|A50" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/workflows/decisions.md` Expected: hits in spec sections 6 and 10 and in the D118 and D128 notes.
Run (comments only; one file per changed source area, one at a time):

```
yarn test packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts 2>&1 | tail -20
yarn test packages/api-website-builder-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts 2>&1 | tail -20
yarn test packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts 2>&1 | tail -20
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
docs: align workflows comments, earlier plan notes, roadmap and spec with phase 4

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
