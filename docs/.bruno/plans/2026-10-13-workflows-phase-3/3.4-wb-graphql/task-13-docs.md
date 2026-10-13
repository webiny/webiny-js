### Task 13: Align comments, the roadmap, the spec and earlier plan notes with phase 3

Comments and docs that still describe phase 3 as future work, the roadmap's phase 3 row (with "done" notes, as phase 2's Task 19 did for phase 2), spec section 10's placement and final names (D136, R88) and the request title (D135), and the earlier plans' notes that hand items to phase 3. No behaviour change.

**Files:**
- Modify: `packages/api-workflows/src/features/review/GetTargetReview/abstractions.ts`
- Modify: `packages/api-workflows/src/domain/review/review.model.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`
- Modify (only if Task 7 left the phase 2 wording): `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/abstractions.ts`
- Modify: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `docs/.bruno/plans/2026-10-11-workflows-phase-2/00-shared.md`
- Modify: `docs/.bruno/plans/2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md`
- Modify: `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`

**Interfaces:**
- Consumes: what Tasks 1-12 landed (names from `../00-shared.md` R88-R108 and the 3.3 / 3.4 task files).
- Produces: no code behaviour change.

- [ ] **Step 1: Find the stale wording (the "failing test")**

Run:

```
grep -rni "phase 3" packages/api-workflows/src packages/api-headless-cms-workflows/src packages/api-website-builder-workflows/src packages/api-website-builder/src packages/api-website-builder-scheduler/src
```

Expected hits (at HEAD before phase 3, minus what Tasks 10 and 12 already rewrote): `GetTargetReview/abstractions.ts` ("phase 3's `getTargetReview` wrappers add the read check"), `domain/review/review.model.ts` ("lists can filter by folder (phase 3)"), both wrapper `feature.ts` files ("Phase 3 puts GraphQL on top of them"), and `GetCmsEntryReview/abstractions.ts` if Task 7 did not rewrite its doc comment. Any other hit is future-tense phase 3 wording: rewrite it the same way (describe what the code does now, cite the ruling).

- [ ] **Step 2: Code comments**

In `packages/api-workflows/src/features/review/GetTargetReview/abstractions.ts` replace the doc comment above `GetTargetReviewUseCase` with:

```ts
/**
 * The active review of a target revision, or `null` (D23). Internal (D132): used by the app
 * adapters' save block and publish rule (R53, R54) and by the per-app target review wrappers,
 * which check read access to the target first (`GetCmsEntryTargetReviewUseCase`,
 * `GetWebsiteBuilderPageTargetReviewUseCase`).
 */
```

In `packages/api-workflows/src/domain/review/review.model.ts` replace

```
 * can query them (D19); `targetContext` is an object so lists can filter by folder (phase 3).
```

with

```
 * can query them (D19); `targetContext` is an object field so it stays filterable (the lists
 * hide unreadable targets with the app's read predicate, R94).
```

and re-wrap the comment to 100 columns if `yarn format:fix` does not.

In `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts` replace

```
 * access, then the internal api-workflows use case. Phase 3 puts GraphQL on top of them.
```

with

```
 * access, then the internal api-workflows use case. `CmsWorkflowsSchemaFactory` puts them on the
 * `cms` root of `/graphql` (D136, R88).
```

In `packages/api-website-builder-workflows/src/features/wrappers/feature.ts` replace

```
 * access, then the internal api-workflows use case. Phase 3 puts GraphQL on top of them.
```

with

```
 * access, then the internal api-workflows use case. `WebsiteBuilderWorkflowsSchemaFactory` puts
 * them on the `websiteBuilder` root of `/graphql` (D136, R88).
```

Only if `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/abstractions.ts` still contains `Returns the engine's full review in phase 2. Phase 3 adds the redaction here`, replace its doc comment above `GetCmsEntryReviewUseCase` with:

```ts
/**
 * A CMS review with the reading user's flags (spec 5.3, R62); needs read access to the target.
 * Each step carries its assignment-log entries (D127); per-user skip entries are dropped here, in
 * the wrapper and not in the resolver, for viewers without `editor` / `reassign` (spec 8, D89,
 * D133, R96).
 */
```

- [ ] **Step 3: The spec**

In `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`:

1. In the status line (line 3) replace

```
updated 2026-10-12 (D132:
```

with

```
updated 2026-10-13 (D135: the review title comes from the content and may be changed on request; D136: every workflows GraphQL operation is on the main `/graphql` endpoint; D132:
```

and replace `Consolidates decisions D1-D134` with `Consolidates decisions D1-D136`.
2. In section 10 replace the paragraph `The lists below name capabilities, not final operations; each per-app capability exists once per app. Final names are settled in the plan.` with:

```
The lists below name capabilities; each per-app capability exists once per app. Placement and final names [D136]: everything is on the main `/graphql` endpoint, nothing on `/cms/*`.

- Root `workflows` (`WorkflowsQuery` / `WorkflowsMutation`): the shared configuration operations (`getSettings`, `updateSettings`, `listStepTypes`; later users, transports, automation definitions, AI tools).
- Root `cms` (the existing `CmsQuery` / `CmsMutation`): `listCmsEntryWorkflows`, `getCmsEntryWorkflow(id)`, `getCmsEntryReview(id)`, `getCmsEntryTargetReview(modelId, revisionId)`, `listCmsEntryReviews(list, where, sort, limit, after)`, `listCmsEntryWorkflowModels(search, limit, after)`; `storeCmsEntryWorkflow(data, savedOn)`, `deleteCmsEntryWorkflow(id)`, `requestCmsEntryReview(modelId, revisionId, title, picks)`, `startCmsEntryReviewStep`, `takeOverCmsEntryReviewStep`, `approveCmsEntryReviewStep`, `rejectCmsEntryReviewStep` (each `reviewId, stepId`, approve and reject also `comment`), `cancelCmsEntryReview(reviewId)`, `cancelCmsEntryReviewsForDelete(modelId, entryId, revisionId, action)`.
- Root `websiteBuilder` (the existing `WbQuery` / `WbMutation`): the same set with `WebsiteBuilderPage` in place of `CmsEntry` and no `modelId` (`getWebsiteBuilderPageTargetReview(revisionId)`, `requestWebsiteBuilderPageReview(revisionId, title, picks)`, `cancelWebsiteBuilderPageReviewsForDelete(pageId, action)`); there is no WB model list.
- Operations that take a review id take no model; a request takes the revision id and the server derives the content id from it. Every operation returns `{ data, error }` (lists `{ data, meta: { cursor, hasMoreItems }, error }`).
```

3. In section 10 replace

```
- request review (`RequestReview`: model, target revision id, title, picks `[{ stepId, userId }]`)
```

with

```
- request review (`RequestReview`: model, target revision id, optional title (the content's title when missing, fixed afterwards) [D135], picks `[{ stepId, userId }]`)
```

- [ ] **Step 4: The roadmap**

In `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`:

1. In the **Spec** line replace `D1-D134` with `D1-D136`.
2. In the phase 3 row replace `Per-app GraphQL operations (CMS, WB) over the phase 2 wrappers` with:

```
Per-app GraphQL operations (CMS on the `cms` root, WB on the `websiteBuilder` root of `/graphql`, D136) over the phase 2 wrappers
```

3. In the phase 3 row replace `store conflict and not-found errors (D131)` with `store conflict and not-found errors (D131; engine and wrappers in 1a and 2, exposed with code and data here)`.
4. In the phase 3 row replace

```
error shape with `code` and `data`; delete the old GraphQL schema
```

with

```
error shape with `code` and `data`, also kept by the WB page resolvers and the scheduled page publish and unpublish (A26); request title (D135) and title and reject comment minimums (D100); delete the old GraphQL schema (done in 1a; the stale `system.workflow` GraphQL types replaced in phase 3). Done: `docs/.bruno/plans/2026-10-13-workflows-phase-3/`
```

- [ ] **Step 5: Earlier plan notes**

In `docs/.bruno/plans/2026-10-11-workflows-phase-2/00-shared.md`:

1. Add after the "For agentic workers" blockquote:

```
> **Status note (after phase 3):** GraphQL for every wrapper, `getTargetReview` per app, the review lists, the redaction of assignment details, the D100 validation, the request title, the CMS editor model list and the WB error mapping (A26) landed in phase 3 (`docs/.bruno/plans/2026-10-13-workflows-phase-3/`); the "Not in this phase" items marked (3) are done there.
```

2. At the end of R59 append: ` Phase 3 kept both workflow lists unpaged (R88).`
3. At the end of R62 append: ` Done in phase 3 (R96).`
4. At the end of A26 append: ` Done in phase 3 (R103).`

In `docs/.bruno/plans/2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md`, at the end of A17 append:

```
 Settled in phase 3: the get-review wrappers pass `viewer.permissions` to the pure `redactAssignmentRecords` (R96).
```

In `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`, at the end of A3 append: ` Phase 3 hides unreadable targets with the app's read predicate instead (D76, R94); the field stays filterable.`

- [ ] **Step 6: Verify**

Run the grep from Step 1 again. Expected: no hits.
Run: `grep -n "D136" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` Expected: hits in the spec status line and section 10, and in the roadmap Spec line and phase 3 row.
Run: `yarn test packages/api-workflows 2>&1 | tail -20` Expected: PASS (comments only).
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -20` Expected: PASS.
Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -20` Expected: PASS.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
docs: align workflows comments, earlier plan notes, roadmap and spec with phase 3

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
