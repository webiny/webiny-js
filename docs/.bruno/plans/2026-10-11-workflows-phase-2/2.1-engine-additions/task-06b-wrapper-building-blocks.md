Superseded in part: `keepReadableBlockingReviews` became `ReadableBlockingReviewsService` (5ab9e893b0).

### Task 6b: Shared wrapper building blocks

D132 ("api-workflows provides the shared building blocks the wrappers use"), D115, D134, R46, R57, R76, R78. The CMS and Website Builder wrappers (Tasks 12, 14b, 17, 18b) share three app-neutral pieces; they live in api-workflows as pure domain helpers (no DI, no identity):

- `keepReadableBlockingReviews`: the D115 listing for the delete-blocked error. It keeps the first 5 blocking reviews the caller can read, checks at most 50 (a failed or throwing check counts as unreadable), and leaves the count to the caller (it stays exact).
- `belongsToApp` / `isAppWorkflow`: "every model of this workflow is one of the app's namespaces", the basis of R46 (store validation, no rebind, list and get filtering). Each app passes its own namespace predicate.
- `getDeleteCancelReason`: the cancel reason recorded when content is trashed or deleted with a review in progress (D134).

The per-app wrapper classes stay per app (R45, D133). The folder-level check is not app-neutral for api-workflows (it needs api-aco); it is shared from api-headless-cms-workflows instead (Task 7, R78).

**Files:**
- Create: `packages/api-workflows/src/domain/workflow/keepReadableBlockingReviews.ts`
- Create: `packages/api-workflows/src/domain/workflow/isAppWorkflow.ts`
- Create: `packages/api-workflows/src/domain/review/getDeleteCancelReason.ts`
- Create: `packages/api-workflows/__tests__/domain/wrapperBuildingBlocks.test.ts`

**Interfaces:**
- Consumes: `WorkflowBlockingReview` (Task 3), `WorkflowValues`, `ReviewActiveOnTrashAction` (Task 6).
- Produces:
  - `MAX_BLOCKING_REVIEWS = 5`, `MAX_BLOCKING_REVIEW_CHECKS = 50`, `BlockingReviewReadCheck = (review: WorkflowBlockingReview) => Promise<boolean>`, `keepReadableBlockingReviews(reviews: WorkflowBlockingReview[], canRead: BlockingReviewReadCheck): Promise<WorkflowBlockingReview[]>`.
  - `AppNamespacePredicate = (model: string) => boolean`, `belongsToApp(models: string[], isAppNamespace: AppNamespacePredicate): boolean`, `isAppWorkflow(workflow: WorkflowValues, isAppNamespace: AppNamespacePredicate): boolean`.
  - `REVIEW_CANCEL_REASON_CONTENT_TRASHED = "content trashed"`, `REVIEW_CANCEL_REASON_CONTENT_DELETED = "content deleted"`, `getDeleteCancelReason(action: ReviewActiveOnTrashAction): string`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/domain/wrapperBuildingBlocks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";
import {
    keepReadableBlockingReviews,
    MAX_BLOCKING_REVIEW_CHECKS
} from "~/domain/workflow/keepReadableBlockingReviews.js";
import { belongsToApp, isAppWorkflow } from "~/domain/workflow/isAppWorkflow.js";
import { getDeleteCancelReason } from "~/domain/review/getDeleteCancelReason.js";
import { createWorkflowValues } from "~tests/__helpers/fixtures.js";

const createBlockingReviews = (count: number): WorkflowBlockingReview[] => {
    return Array.from({ length: count }, (_, index) => {
        return {
            reviewId: `review-${index + 1}`,
            model: "cms.article",
            targetId: `article-${index + 1}`,
            targetRevisionId: `article-${index + 1}#0001`,
            title: `Article ${index + 1}`,
            stepPosition: 1,
            stepCount: 1,
            stepName: "Step 1"
        };
    });
};

const isCms = (model: string): boolean => model.startsWith("cms.");

describe("keepReadableBlockingReviews (D115)", () => {
    it("keeps the first five readable reviews in order", async () => {
        const reviews = createBlockingReviews(12);
        // Every odd review is unreadable.
        const readable = await keepReadableBlockingReviews(reviews, async review => {
            return Number(review.reviewId.split("-")[1]) % 2 === 0;
        });

        expect(readable.map(review => review.reviewId)).toEqual([
            "review-2",
            "review-4",
            "review-6",
            "review-8",
            "review-10"
        ]);
    });

    it("checks at most 50 reviews (R76)", async () => {
        const reviews = createBlockingReviews(80);
        let checks = 0;

        const readable = await keepReadableBlockingReviews(reviews, async () => {
            checks++;
            return false;
        });

        expect(readable).toEqual([]);
        expect(checks).toBe(MAX_BLOCKING_REVIEW_CHECKS);
    });

    it("counts a failed check as unreadable", async () => {
        const reviews = createBlockingReviews(3);

        const readable = await keepReadableBlockingReviews(reviews, async review => {
            if (review.reviewId === "review-2") {
                throw new Error("Storage is down.");
            }
            return true;
        });

        expect(readable.map(review => review.reviewId)).toEqual(["review-1", "review-3"]);
    });
});

describe("isAppWorkflow (R46)", () => {
    it("accepts only workflows whose every model is the app's", () => {
        expect(belongsToApp(["cms.article", "cms.author"], isCms)).toBe(true);
        expect(belongsToApp(["cms.article", "wb.page"], isCms)).toBe(false);
        expect(isAppWorkflow(createWorkflowValues(), isCms)).toBe(true);
        expect(isAppWorkflow(createWorkflowValues({ models: ["wb.page"] }), isCms)).toBe(false);
        expect(isAppWorkflow(createWorkflowValues({ models: [] }), isCms)).toBe(false);
    });
});

describe("getDeleteCancelReason (D134)", () => {
    it("names why the review was cancelled", () => {
        expect(getDeleteCancelReason("trash")).toBe("content trashed");
        expect(getDeleteCancelReason("delete")).toBe("content deleted");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/domain/wrapperBuildingBlocks.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/workflow/keepReadableBlockingReviews.js`.

- [ ] **Step 3: Implement the helpers**

Create `packages/api-workflows/src/domain/workflow/keepReadableBlockingReviews.ts`:

```ts
import type { WorkflowBlockingReview } from "./types.js";

/** At most this many blocking reviews are listed to the caller (D115). */
export const MAX_BLOCKING_REVIEWS = 5;

/** At most this many blocking reviews are checked for readability (R76). */
export const MAX_BLOCKING_REVIEW_CHECKS = 50;

/** The app's read check for one blocking review's target, as the caller. */
export type BlockingReviewReadCheck = (review: WorkflowBlockingReview) => Promise<boolean>;

/**
 * The first blocking reviews the caller can read, at most `MAX_BLOCKING_REVIEWS`, for the
 * delete-blocked error (D115, R57). Checks at most `MAX_BLOCKING_REVIEW_CHECKS` in the engine's
 * order, so a workflow with many unreadable reviews costs a bounded number of reads; a check that
 * throws counts as unreadable. The caller keeps the exact count.
 */
export const keepReadableBlockingReviews = async (
    reviews: WorkflowBlockingReview[],
    canRead: BlockingReviewReadCheck
): Promise<WorkflowBlockingReview[]> => {
    const readable: WorkflowBlockingReview[] = [];
    for (const review of reviews.slice(0, MAX_BLOCKING_REVIEW_CHECKS)) {
        if (readable.length === MAX_BLOCKING_REVIEWS) {
            break;
        }
        let allowed = false;
        try {
            allowed = await canRead(review);
        } catch {
            allowed = false;
        }
        if (allowed) {
            readable.push(review);
        }
    }
    return readable;
};
```

Create `packages/api-workflows/src/domain/workflow/isAppWorkflow.ts`:

```ts
import type { WorkflowValues } from "./types.js";

/** Whether a namespace id belongs to the app, e.g. `cms.<modelId>` or `wb.page`. */
export type AppNamespacePredicate = (model: string) => boolean;

/** Every model is one of the app's namespaces; an empty list is left to the engine's validation. */
export const belongsToApp = (models: string[], isAppNamespace: AppNamespacePredicate): boolean => {
    return models.every(isAppNamespace);
};

/** A stored workflow of the app (R46): bound to at least one model, all of them the app's. */
export const isAppWorkflow = (
    workflow: WorkflowValues,
    isAppNamespace: AppNamespacePredicate
): boolean => {
    return workflow.models.length > 0 && belongsToApp(workflow.models, isAppNamespace);
};
```

Create `packages/api-workflows/src/domain/review/getDeleteCancelReason.ts`:

```ts
import type { ReviewActiveOnTrashAction } from "./errors.js";

export const REVIEW_CANCEL_REASON_CONTENT_TRASHED = "content trashed";
export const REVIEW_CANCEL_REASON_CONTENT_DELETED = "content deleted";

/** The reason recorded when a review is cancelled because its content is trashed or deleted (D134). */
export const getDeleteCancelReason = (action: ReviewActiveOnTrashAction): string => {
    return action === "trash"
        ? REVIEW_CANCEL_REASON_CONTENT_TRASHED
        : REVIEW_CANCEL_REASON_CONTENT_DELETED;
};
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40` Expected: no errors.

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then commit:

```
feat(api-workflows): add shared building blocks for the app wrappers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
