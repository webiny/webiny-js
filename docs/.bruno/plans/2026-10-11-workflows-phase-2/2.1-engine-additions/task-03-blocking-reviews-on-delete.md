### Task 3: Blocking reviews on the delete-blocked error (D115 engine part)

R57, D115, D133. The engine's `Workflows/Workflow/HasActiveReviews` keeps the exact count and gains every blocking review (content reference, title, step position and name). The engine does not filter by access; each app's delete wrapper keeps the first 5 the caller can read, checking at most 50 (Tasks 6b, 12, 17, R76). The list is not capped in v1 (A36): a workflow with very many in-progress reviews returns all of them in the error. The repository already confirms every in-progress hit from primary storage (R18); listing reuses that walk, and the count is its length.

**Files:**
- Modify: `packages/api-workflows/src/domain/workflow/types.ts`
- Modify: `packages/api-workflows/src/domain/workflow/errors.ts`
- Create: `packages/api-workflows/src/domain/review/toBlockingReview.ts`
- Modify: `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`
- Modify: `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`
- Modify: `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts`
- Modify: `packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts`

**Interfaces:**
- Consumes: `ReviewData`, `ReviewRepository` (Task 2 state), `WorkflowHasActiveReviewsError`.
- Produces:
  - `WorkflowBlockingReview { reviewId; model; targetId; targetRevisionId; title; stepPosition: number; stepCount: number; stepName: string }` (`domain/workflow/types.ts`).
  - `WorkflowHasActiveReviewsErrorData { count: number; reviews: WorkflowBlockingReview[] }`.
  - `toBlockingReview(review: ReviewData): WorkflowBlockingReview` (pure; position is 1-based, from `currentStepId`).
  - `ReviewRepository.Interface.listInProgressByWorkflow(workflowId: string): Promise<Result<ReviewData[], ReviewPersistenceError>>`; `countInProgressByWorkflow` delegates to it.

- [ ] **Step 1: Write the failing test**

In `packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts` replace

```ts
        expect(blocked.error.data).toEqual({ count: 2 });
```

with

```ts
        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(data.count).toBe(2);
        expect([...data.reviews].sort((a, b) => a.reviewId.localeCompare(b.reviewId))).toEqual([
            {
                reviewId: "review-1",
                model: "cms.article",
                targetId: "article-1",
                targetRevisionId: "article-1#0001",
                title: "Article 1",
                stepPosition: 1,
                stepCount: 2,
                stepName: "Legal review"
            },
            {
                reviewId: "review-2",
                model: "cms.article",
                targetId: "article-2",
                targetRevisionId: "article-2#0001",
                title: "Article 1",
                stepPosition: 1,
                stepCount: 2,
                stepName: "Legal review"
            }
        ]);
```

and add `import type { WorkflowHasActiveReviewsErrorData } from "~/domain/workflow/errors.js";` to the file's imports. (The fixture title is always "Article 1"; both reviews sit on the first step, "Legal review", of two.)

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts 2>&1 | tail -50`
Expected: FAIL, `data.reviews` is `undefined`, so the spread throws `TypeError: data.reviews is not iterable` (the exact wording depends on the Node version).

- [ ] **Step 3: Add the blocking review type, mapper and error data**

Append to `packages/api-workflows/src/domain/workflow/types.ts`:

```ts
/**
 * A review that blocks deleting its workflow (D115): the content reference, its title and where
 * the review stands. The engine lists all of them; the app wrapper keeps the first 5 the caller
 * can read (D133, R57).
 */
export interface WorkflowBlockingReview {
    reviewId: string;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    /** 1-based position of the current step ("Step n of N"). */
    stepPosition: number;
    stepCount: number;
    stepName: string;
}
```

In `packages/api-workflows/src/domain/workflow/errors.ts`, change the type import to `import type { WorkflowBlockingReview, WorkflowIdentity } from "./types.js";` and replace the `WorkflowHasActiveReviewsErrorData` interface and the class doc comment with:

```ts
export interface WorkflowHasActiveReviewsErrorData {
    /** Exact number of in-progress reviews, regardless of what the caller can read (D115). */
    count: number;
    /** The engine returns every blocking review; app wrappers keep the first 5 readable (R57). */
    reviews: WorkflowBlockingReview[];
}

/** D81, D115. */
```

(the class body stays unchanged).

Create `packages/api-workflows/src/domain/review/toBlockingReview.ts`:

```ts
import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";
import type { ReviewData } from "./types.js";

/**
 * Where an in-progress review stands, for the delete-blocked error (D115). An in-progress review
 * always has a current step; the first step is the fallback for corrupt data. Pure.
 */
export const toBlockingReview = (review: ReviewData): WorkflowBlockingReview => {
    const index = review.steps.findIndex(step => step.id === review.currentStepId);
    const position = index === -1 ? 1 : index + 1;
    const step = review.steps[position - 1];
    return {
        reviewId: review.id,
        model: review.model,
        targetId: review.targetId,
        targetRevisionId: review.targetRevisionId,
        title: review.title,
        stepPosition: position,
        stepCount: review.steps.length,
        stepName: step?.title ?? ""
    };
};
```

- [ ] **Step 4: List in-progress reviews in the repository**

In `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`, add to `IReviewRepository` after `countInProgressByWorkflow`:

```ts
    /** Every in-progress review of a workflow, confirmed from primary storage (R18). */
    listInProgressByWorkflow(
        workflowId: string
    ): Promise<Result<ReviewData[], ReviewPersistenceError>>;
```

In `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`, replace the `countInProgressByWorkflow` method with:

```ts
    async countInProgressByWorkflow(
        workflowId: string
    ): Promise<Result<number, ReviewPersistenceError>> {
        const listed = await this.listInProgressByWorkflow(workflowId);
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }
        return Result.ok(listed.value.length);
    }

    async listInProgressByWorkflow(
        workflowId: string
    ): Promise<Result<ReviewData[], ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const reviews: ReviewData[] = [];
        let after: string | null = null;
        do {
            const result: Awaited<ListLatestEntriesUseCase.Return<ReviewEntryValues>> =
                await this.listLatestEntries.execute<ReviewEntryValues>(model, {
                    where: {
                        values: {
                            workflowId,
                            state: "inProgress"
                        }
                    },
                    sort: ["createdOn_ASC"],
                    limit: COUNT_PAGE_SIZE,
                    after
                });
            if (result.isFail()) {
                return Result.fail(new ReviewPersistenceError(result.error));
            }

            for (const entry of result.value.entries) {
                const confirmed = await this.readPrimary(model, entry.id);
                if (confirmed.isFail()) {
                    return Result.fail(confirmed.error);
                }
                const review = confirmed.value;
                if (review && review.workflowId === workflowId && review.state === "inProgress") {
                    reviews.push(review);
                }
            }

            const { meta } = result.value;
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        return Result.ok(reviews);
    }
```

- [ ] **Step 5: Return the blocking reviews from DeleteWorkflow**

In `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts`, add `import { toBlockingReview } from "~/domain/review/toBlockingReview.js";` and replace the count block (from `// Finished reviews keep...` to the closing `}` of `if (inProgress.value > 0)`) with:

```ts
        // Finished reviews keep their snapshot and do not block the delete (D81).
        const inProgress = await this.reviewRepository.listInProgressByWorkflow(workflow.id);
        if (inProgress.isFail()) {
            return Result.fail(new WorkflowPersistenceError(inProgress.error));
        }
        if (inProgress.value.length > 0) {
            return Result.fail(
                new WorkflowHasActiveReviewsError({
                    count: inProgress.value.length,
                    reviews: inProgress.value.map(toBlockingReview)
                })
            );
        }
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS (the `countInProgressByWorkflow` repository tests keep passing through the delegation).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then commit:

```
feat(api-workflows): list the blocking reviews on the workflow delete error (D115)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
