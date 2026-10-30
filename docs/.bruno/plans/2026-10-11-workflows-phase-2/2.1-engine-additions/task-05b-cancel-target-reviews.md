### Task 5b: Cancel reason and cancelling a target's in-progress reviews

D134 points 1 and 3, R74, R85. The confirm path for trashing or deleting content with a review in progress cancels the review as the user who trashes it, with a reason ("content trashed", "content deleted"), even without cancel rights (the app wrapper checks delete access instead, Tasks 14b, 18b). Two engine pieces:

- An optional `reason` on cancel: `CancelReviewInput.reason`, `Review.cancel({ reason })`, and `reason` on the cancelled fact (so the `Workflows/Review/Cancelled` event carries it for audit logs and notifications, D65).
- `CancelTargetReviewsUseCase`: cancels every in-progress review of a target (or of one revision) through `CancelReviewUseCase`, so each cancel saves, syncs `system.workflow` and publishes its event as a normal cancel.

**Files:**
- Modify: `packages/api-workflows/src/domain/review/facts.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/features/review/shared/types.ts`
- Modify: `packages/api-workflows/src/features/review/CancelReview/CancelReviewUseCase.ts`
- Create: `packages/api-workflows/src/features/review/CancelTargetReviews/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/CancelTargetReviews/CancelTargetReviewsUseCase.ts`
- Create: `packages/api-workflows/src/features/review/CancelTargetReviews/feature.ts`
- Create: `packages/api-workflows/src/features/review/CancelTargetReviews/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`
- Create: `packages/api-workflows/__tests__/review/CancelTargetReviews.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: `ReviewRepository.listByTarget` (Task 4), `CancelReviewUseCase` (1a), `RecordingEventPublisher` / `recordedEvents` (test helper, used by Task 2).
- Produces:
  - `ReviewCancelledFact.reason: string | null`; `ReviewCancelParams.reason?: string | null`; `CancelReviewInput.reason?: string | null` (`null` for a normal cancel).
  - `CancelTargetReviewsUseCase.Interface.execute(input: CancelTargetReviewsInput): Promise<Result<ReviewData[], CancelTargetReviewsUseCase.Error>>` (the cancelled reviews), `CancelTargetReviewsInput { model: string; targetId: string; targetRevisionId?: string | null; actor: Actor; reason: string }`; errors: `ReviewPersistenceError` and `CancelReviewUseCase.Error`.

- [ ] **Step 1: Write the failing tests**

In `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`, in the cancel test that expects the pulled facts, add `reason: null` after `stepState: "inReview"` in the expected `cancelled` fact, and add after that test:

```ts
    it("records the cancel reason on the fact", () => {
        const review = createStartedReview();

        expectOk(review.cancel({ actor: requester, now: LATER, reason: "content trashed" }));

        expect(review.pullFacts()).toEqual([
            {
                type: "cancelled",
                occurredOn: LATER,
                actor: requester,
                stepId: "legal",
                stepState: "inReview",
                reason: "content trashed"
            }
        ]);
    });
```

(`expectOk` is already imported there; if not, import it from `~tests/__helpers/fixtures.js`.)

Create `packages/api-workflows/__tests__/review/CancelTargetReviews.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    otherReviewer,
    requester,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { CancelTargetReviewsUseCase } from "~/features/review/CancelTargetReviews/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

/**
 * article-1#0001: in progress (review-1); article-1#0002: in progress (review-2);
 * article-1#0003: cancelled (review-3); article-2#0001: in progress (review-4), another target.
 */
const createTargetReviews = async () => {
    recordedEvents.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    const repository = context.container.resolve(ReviewRepository);

    expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));
    expectOk(
        await repository.save(
            toSaveData(createRequestedReview({ id: "review-2", targetRevisionId: "article-1#0002" }))
        )
    );
    const cancelled = createRequestedReview({ id: "review-3", targetRevisionId: "article-1#0003" });
    expectOk(cancelled.cancel({ actor: requester, now: LATER }));
    expectOk(await repository.save(toSaveData(cancelled)));
    expectOk(
        await repository.save(
            toSaveData(createRequestedReview({ id: "review-4", targetRevisionId: "article-2#0001" }))
        )
    );
    recordedEvents.length = 0;

    return {
        repository,
        cancelTargetReviews: context.container.resolve(CancelTargetReviewsUseCase)
    };
};

describe("CancelTargetReviewsUseCase", () => {
    it("cancels every in-progress review of a target as the actor, with the reason", async () => {
        const { repository, cancelTargetReviews } = await createTargetReviews();

        const cancelled = expectOk(
            await cancelTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                actor: otherReviewer,
                reason: "content trashed"
            })
        );

        expect(cancelled.map(review => review.id).sort()).toEqual(["review-1", "review-2"]);
        expect(cancelled.every(review => review.state === "cancelled")).toBe(true);
        expect(expectOk(await repository.get("review-4")).state).toBe("inProgress");
        const facts = recordedEvents
            .filter(event => event.eventType === "Workflows/Review/Cancelled")
            .map(event => event.payload.fact);
        expect(facts).toHaveLength(2);
        expect(facts[0]).toMatchObject({ actor: otherReviewer, reason: "content trashed" });
    });

    it("cancels only the review of one revision when it is given", async () => {
        const { repository, cancelTargetReviews } = await createTargetReviews();

        const cancelled = expectOk(
            await cancelTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0002",
                actor: otherReviewer,
                reason: "content deleted"
            })
        );

        expect(cancelled.map(review => review.id)).toEqual(["review-2"]);
        expect(expectOk(await repository.get("review-1")).state).toBe("inProgress");
    });

    it("cancels nothing for a target without an in-progress review", async () => {
        const { cancelTargetReviews } = await createTargetReviews();

        const cancelled = expectOk(
            await cancelTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-9",
                actor: otherReviewer,
                reason: "content trashed"
            })
        );

        expect(cancelled).toEqual([]);
    });
});
```

(Review events carry `ReviewEventPayload { review, fact }`, `features/review/events.ts`; no `ReviewTargetSync` is registered in the api-workflows harness, so the cancels sync nothing.)

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.decisions.test.ts packages/api-workflows/__tests__/review/CancelTargetReviews.test.ts 2>&1 | tail -50`
Expected: FAIL. The cancelled fact has no `reason`; `~/features/review/CancelTargetReviews/index.js` does not resolve.

- [ ] **Step 3: The reason on cancel**

In `packages/api-workflows/src/domain/review/facts.ts`, add to `ReviewCancelledFact` after `stepState`:

```ts
    /** Why the review was cancelled, e.g. "content trashed" (D134); `null` for a normal cancel. */
    reason: string | null;
```

In `packages/api-workflows/src/domain/review/Review.ts`, add to `ReviewCancelParams` after `now`:

```ts
    /** Recorded on the cancelled fact (D134); omitted for a normal cancel. */
    reason?: string | null;
```

and in `cancel()` add `reason: params.reason ?? null` after `stepState: step?.state ?? null` in the pushed fact.

In `packages/api-workflows/src/features/review/shared/types.ts`, add to `CancelReviewInput` after `actor`:

```ts
    /**
     * Why the review is cancelled, recorded on the cancelled event; set when content is trashed or
     * deleted with the review in progress (D134), omitted otherwise.
     */
    reason?: string | null;
```

In `packages/api-workflows/src/features/review/CancelReview/CancelReviewUseCase.ts`, replace the `review.cancel(...)` call with:

```ts
        const cancelled = review.cancel({
            actor: input.actor,
            now: new Date().toISOString(),
            reason: input.reason
        });
```

- [ ] **Step 4: Add CancelTargetReviews**

Create `packages/api-workflows/src/features/review/CancelTargetReviews/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { CancelReviewUseCase } from "../CancelReview/abstractions.js";

export interface CancelTargetReviewsInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    /** Only this revision's review; every revision of the target when omitted. */
    targetRevisionId?: string | null;
    /** The user trashing or deleting the content (D134). */
    actor: Actor;
    /** Recorded on each cancelled event, e.g. "content trashed". */
    reason: string;
}

export interface ICancelTargetReviewsUseCaseErrors {
    persistence: ReviewPersistenceError;
    cancel: CancelReviewUseCase.Error;
}

type UseCaseError = ICancelTargetReviewsUseCaseErrors[keyof ICancelTargetReviewsUseCaseErrors];

export interface ICancelTargetReviewsUseCase {
    execute(input: CancelTargetReviewsInput): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * Cancels every in-progress review of a target (or of one revision) before the content is trashed
 * or deleted (D134). Internal (D132): the app's cancel-for-delete wrapper checks that the caller
 * may delete the content; no cancel permission is needed.
 */
export const CancelTargetReviewsUseCase = createAbstraction<ICancelTargetReviewsUseCase>(
    "CancelTargetReviewsUseCase"
);

export namespace CancelTargetReviewsUseCase {
    export type Interface = ICancelTargetReviewsUseCase;
    export type Input = CancelTargetReviewsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData[], UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/CancelTargetReviews/CancelTargetReviewsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData } from "~/domain/review/types.js";
import { CancelReviewUseCase } from "../CancelReview/abstractions.js";
import { CancelTargetReviewsUseCase as UseCase } from "./abstractions.js";

/**
 * Each review goes through `CancelReviewUseCase`, so it is saved, `system.workflow` is cleared and
 * the cancelled event is published exactly as for a normal cancel. Stops at the first failure;
 * reviews cancelled before it stay cancelled.
 */
class CancelTargetReviewsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private cancelReview: CancelReviewUseCase.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const listed = await this.repository.listByTarget({
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId ?? undefined
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        const cancelled: ReviewData[] = [];
        for (const review of listed.value) {
            if (review.state !== "inProgress") {
                continue;
            }
            const result = await this.cancelReview.execute({
                reviewId: review.id,
                actor: input.actor,
                reason: input.reason
            });
            if (result.isFail()) {
                return Result.fail(result.error);
            }
            cancelled.push(result.value);
        }
        return Result.ok(cancelled);
    }
}

export const CancelTargetReviewsUseCase = UseCase.createImplementation({
    implementation: CancelTargetReviewsUseCaseImpl,
    dependencies: [ReviewRepository, CancelReviewUseCase]
});
```

Create `packages/api-workflows/src/features/review/CancelTargetReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CancelTargetReviewsUseCase } from "./CancelTargetReviewsUseCase.js";

export const CancelTargetReviewsFeature = createFeature({
    name: "Workflows/CancelTargetReviews",
    register(container) {
        container.register(CancelTargetReviewsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/CancelTargetReviews/index.ts`:

```ts
export { CancelTargetReviewsUseCase } from "./abstractions.js";
export type { CancelTargetReviewsInput } from "./abstractions.js";
```

- [ ] **Step 5: Register and pin the registration**

In `packages/api-workflows/src/WorkflowsFeature.ts` import `CancelTargetReviewsFeature` from `~/features/review/CancelTargetReviews/feature.js` and register it after `DeleteTargetReviewsFeature.register(container);`. In `__tests__/registration.test.ts` import `CancelTargetReviewsUseCase` from its `index.js` and add `expect(container.resolveAll(CancelTargetReviewsUseCase)).toHaveLength(1);` after the `DeleteTargetReviewsUseCase` expectation.

- [ ] **Step 6: Run the tests and the test type check**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40` Expected: no errors (every `ReviewCancelledFact` literal in the tests carries `reason`).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then commit:

```
feat(api-workflows): record a cancel reason and cancel a target's in-progress reviews

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
