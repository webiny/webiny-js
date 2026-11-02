### Task 1: `currentStepType` on the review

Spec 4.2, 11, D112, R93. The failed steps list (Task 3) filters on "the current step is an AI or automation step". The step type lives inside `steps[]`, which no list can filter on, so the review gets a top-level `currentStepType` text field next to `currentStepId` / `currentStepState`. The review model is unreleased, so the field is added without a migration; a stored review written before this task reads `currentStepType: null`.

The aggregate keeps it where it keeps `currentStepId`: `prepareForSave` (the only place `currentStepId` changes) sets it to the current step's `type`, and to `null` when the review is cancelled. `Review.request` starts it at `null` like `currentStepId`.

**Files:**
- Modify: `packages/api-workflows/src/domain/review/types.ts`
- Modify: `packages/api-workflows/src/domain/review/review.model.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`
- Test: `packages/api-workflows/__tests__/review/CurrentStepType.test.ts`

**Interfaces:**
- Consumes: `Review` (`request`, `reach`, `approve`, `reject`, `cancel`, `prepareForSave`, `toData`), `ReviewRepository` (`get`, `save`), `ReviewModelProvider.get()`, `CreateEntryUseCase.execute(model, { id, values })` (`@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js`), `RequestReviewUseCase`, `GetReviewUseCase`, `CancelReviewUseCase`; test fixtures `createRequestedReview`, `createStartedReview`, `createReviewStep`, `createWorkflow`, `poolResolution`, `toSaveData`, `createReviewContext`, `createRequestInput`.
- Produces:
  - `ReviewData.currentStepType: string | null` (the current step's `type`, e.g. `"review"`, `"ai"`, `"automation"`; `null` without a current step).
  - `ReviewEntryValues.currentStepType: string | null` (stored field `currentStepType`, text, top-level, filterable).

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/review/CurrentStepType.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import {
    createRequestedReview,
    createReviewStep,
    createStartedReview,
    createWorkflow,
    expectOk,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import type { Workflow } from "~/domain/workflow/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewModelProvider } from "~/domain/review/abstractions/ReviewModelProvider.js";
import {
    ReviewEntryMapper,
    type ReviewEntryValues
} from "~/features/review/shared/ReviewEntryMapper.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

/** "legal" is a review step, "editorial" an AI step (the aggregate does not validate types). */
const createMixedWorkflow = (): Workflow => {
    return createWorkflow({
        steps: [
            createReviewStep({ id: "legal", title: "Legal review" }),
            { ...createReviewStep({ id: "editorial", title: "AI check" }), type: "ai" }
        ]
    });
};

describe("Review currentStepType (D112, R93)", () => {
    it("is null until the first save prepares the review, then the current step's type", () => {
        const review = createRequestedReview();

        expect(review.toData().currentStepType).toBeNull();

        review.prepareForSave();
        expect(review.toData()).toMatchObject({
            currentStepId: "legal",
            currentStepType: "review"
        });
    });

    it("follows the current step when the review moves to the next step", () => {
        const review = createStartedReview({ workflow: createMixedWorkflow() });
        expectOk(
            review.approve({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: null,
                now: LATER
            })
        );
        expectOk(review.reach({ resolution: poolResolution(), actor: reviewer, now: LATER }));

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            currentStepId: "editorial",
            currentStepState: "awaiting",
            currentStepType: "ai"
        });
    });

    it("keeps the rejecting step's type and clears it on cancel", () => {
        const rejected = createStartedReview({ workflow: createMixedWorkflow() });
        expectOk(
            rejected.reject({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: "Needs another pass.",
                now: LATER
            })
        );
        const cancelled = createStartedReview();
        expectOk(cancelled.cancel({ actor: requester, now: LATER }));

        rejected.prepareForSave();
        cancelled.prepareForSave();

        expect(rejected.toData()).toMatchObject({
            currentStepId: "legal",
            currentStepType: "review"
        });
        expect(cancelled.toData()).toMatchObject({
            currentStepId: null,
            currentStepType: null
        });
    });

    it("is stored and read back by the use cases", async () => {
        const { context } = await createReviewContext();

        const requested = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );
        const read = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: requested.id })
        );
        const cancelled = expectOk(
            await context.container
                .resolve(CancelReviewUseCase)
                .execute({ reviewId: requested.id, actor: requester })
        );

        expect(requested.currentStepType).toBe("review");
        expect(read).toEqual(requested);
        expect(cancelled.currentStepType).toBeNull();
        const reread = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: requested.id })
        );
        expect(reread.currentStepType).toBeNull();
    });

    it("reads a review stored without the field as null", async () => {
        const { context } = await createContextHandler();
        const model = await context.container.resolve(ReviewModelProvider).get();
        const legacy: Partial<ReviewEntryValues> = {
            ...ReviewEntryMapper.toValues(toSaveData(createRequestedReview()))
        };
        delete legacy.currentStepType;
        expectOk(
            await context.container
                .resolve(CreateEntryUseCase)
                .execute(model, { id: "review-legacy", values: legacy })
        );

        const read = expectOk(
            await context.container.resolve(ReviewRepository).get("review-legacy")
        );

        expect(read.currentStepId).toBe("legal");
        expect(read.currentStepType).toBeNull();
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/review/CurrentStepType.test.ts 2>&1 | tail -50`
Expected: FAIL. The domain tests fail with `expected undefined to be null` / `toMatchObject` missing `currentStepType`; the storage tests fail the same way (the field is not mapped).

- [ ] **Step 3: Add the field to `ReviewData`**

In `packages/api-workflows/src/domain/review/types.ts`, in `interface ReviewData`, replace:

```ts
    currentStepState: StepState | null;
    /** Only for `user` owners (D74). */
    currentOwnerId: string | null;
```

with:

```ts
    currentStepState: StepState | null;
    /**
     * Type of the current step, e.g. "review", "ai" or "automation" (D112): the failed steps list
     * filters on it. `null` when there is no current step (before the first save, after cancel).
     */
    currentStepType: string | null;
    /** Only for `user` owners (D74). */
    currentOwnerId: string | null;
```

- [ ] **Step 4: Add the field to the review model**

In `packages/api-workflows/src/domain/review/review.model.ts`, replace:

```ts
                    currentStepState: fields.text().label("Current step state"),
```

with:

```ts
                    currentStepState: fields.text().label("Current step state"),
                    currentStepType: fields.text().label("Current step type"),
```

- [ ] **Step 5: Keep it in the aggregate**

In `packages/api-workflows/src/domain/review/Review.ts`, in `Review.request`, replace:

```ts
            currentStepId: null,
            currentStepState: null,
            currentOwnerId: null,
```

with:

```ts
            currentStepId: null,
            currentStepState: null,
            currentStepType: null,
            currentOwnerId: null,
```

In `prepareForSave`, replace:

```ts
            this.data.isActive = false;
            this.data.currentStepId = null;
            this.data.currentStepState = null;
            this.data.currentOwnerId = null;
```

with:

```ts
            this.data.isActive = false;
            this.data.currentStepId = null;
            this.data.currentStepState = null;
            this.data.currentStepType = null;
            this.data.currentOwnerId = null;
```

and replace:

```ts
        this.data.currentStepId = current.id;
        this.data.currentStepState = current.state;
```

with:

```ts
        this.data.currentStepId = current.id;
        this.data.currentStepState = current.state;
        this.data.currentStepType = current.type;
```

- [ ] **Step 6: Map it**

In `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`, in `interface ReviewEntryValues`, replace:

```ts
    currentStepState: string | null;
    currentOwnerId: string | null;
```

with:

```ts
    currentStepState: string | null;
    currentStepType: string | null;
    currentOwnerId: string | null;
```

In `toValues`, replace:

```ts
            currentStepState: review.currentStepState,
            currentOwnerId: review.currentOwnerId,
```

with:

```ts
            currentStepState: review.currentStepState,
            currentStepType: review.currentStepType,
            currentOwnerId: review.currentOwnerId,
```

In `fromEntry`, replace:

```ts
            currentStepState: (values.currentStepState ?? null) as StepState | null,
```

with:

```ts
            currentStepState: (values.currentStepState ?? null) as StepState | null,
            // Reviews stored before the field existed read as `null` (R93).
            currentStepType: values.currentStepType ?? null,
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (the new file and every existing test; the existing repository round-trip tests compare whole `ReviewData` values, so they now cover the new field too).

Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS, or "not run" (A9).

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` and `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (they read `ReviewData` through the engine; nothing builds it by hand).

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|api-headless-cms-workflows|api-website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
feat(api-workflows): store the current step type on the review

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
