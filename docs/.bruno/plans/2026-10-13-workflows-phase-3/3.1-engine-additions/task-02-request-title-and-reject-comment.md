### Task 2: Request title (D135) and reject comment minimum (D100)

Spec 10, D100, D135, R89, R90. Both rules live in the aggregate, so every caller (the engine use cases, the CMS and WB wrappers, later AI and automation) gets them:

- **Request title** (R89). `RequestReviewInput.title?: string | null` is passed to `Review.request` as `requestedTitle`. It is trimmed; a non-empty value shorter than 5 characters fails with `ReviewValidationError("The review title must have at least 5 characters.")`; a missing, `null` or blank value falls back to the target's title (today's behaviour). The title is fixed afterwards (no operation changes it). `targetContext.title` keeps the target's own title.
- **Reject comment** (R90). `Review.reject` fails with `ReviewValidationError("A rejection needs a comment of at least 10 characters.")` when the comment, trimmed, is shorter than 10 characters, and stores the trimmed comment. The rule runs after the state and owner rules, so a non-owner still gets `NotOwner`. Approve comments stay optional.

As R90 says, the comment rule lives in `Review.reject`; `checkReject` takes no comment: it is the pure twin the viewer flags call (`getReviewViewerFlags`, R31), and `canReject` must stay `true` for the owner before a comment is typed. So the comment rule sits in `reject` (the aggregate) and `checkReject` keeps answering "may this viewer reject at all". Every caller still gets the rule, which is what R90 asks for.

Existing tests that reject with a comment shorter than 10 characters (or none) are updated to a valid comment.

**Files:**
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/features/review/RequestReview/abstractions.ts`
- Modify: `packages/api-workflows/src/features/review/RequestReview/RequestReviewUseCase.ts`
- Modify: `packages/api-workflows/src/features/review/RejectReviewStep/abstractions.ts`
- Modify: `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`
- Modify: `packages/api-workflows/__tests__/domain/Review.checks.test.ts`
- Modify: `packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts`
- Test: `packages/api-workflows/__tests__/domain/Review.minimumLengths.test.ts`
- Test: `packages/api-workflows/__tests__/review/RequestTitleAndRejectComment.test.ts`

**Interfaces:**
- Consumes: `Review.request(params: ReviewRequestParams)`, `Review.reject(params: ReviewDecisionParams)`, `ReviewValidationError(message)`, `RequestReviewUseCase`, `StartReviewStepUseCase`, `RejectReviewStepUseCase`, `GetReviewUseCase`, `ReviewRepository.getActiveByTarget`; test helpers `createReviewContext`, `createRequestInput`, `recordedSyncs`, `workflowEventTypes`, fixtures.
- Produces:
  - `RequestReviewInput.title?: string | null` (3.3 / 3.4 request wrappers pass it through).
  - `ReviewRequestParams.requestedTitle?: string | null`.
  - `REVIEW_TITLE_MIN_LENGTH = 5`, `REJECT_COMMENT_MIN_LENGTH = 10` (exported from `domain/review/Review.ts`).
  - `type ReviewRejectError = ReviewDecisionError | ReviewValidationError` (`Review.reject` return error).
  - `IRejectReviewStepUseCaseErrors.validation: ReviewValidationError`, so `RejectReviewStepUseCase.Error` (and through it the CMS / WB reject wrappers' error types) include `Workflows/Review/Validation`.
  - Messages: `"The review title must have at least 5 characters."`, `"A rejection needs a comment of at least 10 characters."`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/domain/Review.minimumLengths.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review, type ReviewRequestParams } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import {
    ARTICLE_MODEL,
    createStartedReview,
    createWorkflow,
    expectOk,
    NOW,
    otherReviewer,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

const requestParams = (requestedTitle?: string | null): ReviewRequestParams => {
    return {
        id: "review-1",
        workflow: createWorkflow(),
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        title: "Article 1",
        requestedTitle,
        targetContext,
        picks: [],
        requester,
        now: NOW
    };
};

const rejectAs = (actor: Actor, comment: string | null) => {
    return {
        stepId: "legal",
        actor,
        actorTeamIds: [REVIEW_TEAM_ID],
        comment,
        now: LATER
    };
};

describe("Review request title (D135, R89)", () => {
    it("uses the requested title, trimmed, and keeps the target's title in the context", () => {
        const review = expectOk(Review.request(requestParams("  Spring launch  ")));

        expect(review.toData().title).toBe("Spring launch");
        expect(review.toData().targetContext.title).toBe("Article 1");
    });

    it("falls back to the target's title when the title is missing, null or blank", () => {
        for (const requestedTitle of [undefined, null, "", "    "]) {
            const review = expectOk(Review.request(requestParams(requestedTitle)));

            expect(review.toData().title).toBe("Article 1");
        }
    });

    it("accepts a title of exactly 5 characters", () => {
        const review = expectOk(Review.request(requestParams(" Fixes ")));

        expect(review.toData().title).toBe("Fixes");
    });

    it("rejects a title shorter than 5 characters after trimming", () => {
        const result = Review.request(requestParams("  Abcd  "));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("The review title must have at least 5 characters.");
    });
});

describe("Review reject comment (D100, R90)", () => {
    it("refuses a missing, blank or short comment and changes nothing", () => {
        for (const comment of [null, "", "          ", "Too short", "  Too short  "]) {
            const review = createStartedReview();
            const before = review.toData();

            const result = review.reject(rejectAs(reviewer, comment));

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("Workflows/Review/Validation");
            expect(result.error.message).toBe(
                "A rejection needs a comment of at least 10 characters."
            );
            expect(review.toData()).toEqual(before);
            expect(review.pullFacts()).toEqual([]);
        }
    });

    it("accepts 10 characters after trimming and stores the trimmed comment", () => {
        const review = createStartedReview();

        expectOk(review.reject(rejectAs(reviewer, "  Not ready.  ")));

        expect(review.toData().steps[0]).toMatchObject({
            state: "rejected",
            comment: "Not ready."
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepRejected",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
                comment: "Not ready."
            }
        ]);
    });

    it("checks the owner before the comment", () => {
        const review = createStartedReview();

        const result = review.reject(rejectAs(otherReviewer, "No."));

        expect(result.error.code).toBe("Workflows/Review/NotOwner");
    });

    it("keeps the reject flag check free of the comment rule", () => {
        const review = createStartedReview();

        const checked = review.checkReject({
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID]
        });

        expect(checked.isOk()).toBe(true);
    });

    it("still lets the owner approve without a comment", () => {
        const review = createStartedReview();

        expectOk(review.approve(rejectAs(reviewer, null)));

        expect(review.toData().steps[0]).toMatchObject({ state: "approved", comment: null });
    });
});
```

Create `packages/api-workflows/__tests__/review/RequestTitleAndRejectComment.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { recordedEvents, workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import { ARTICLE_MODEL, expectOk, REVIEW_TEAM_ID, reviewer } from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";

describe("RequestReviewUseCase title (D135, R89)", () => {
    it("stores the requested title, trimmed", async () => {
        const { context } = await createReviewContext();

        const review = expectOk(
            await context.container
                .resolve(RequestReviewUseCase)
                .execute(createRequestInput({ title: "  Spring launch  " }))
        );

        expect(review.title).toBe("Spring launch");
        expect(review.targetContext.title).toBe("Article article-1");
    });

    it("uses the target's title when the title is missing, null or blank", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);

        const missing = expectOk(
            await requestReview.execute(createRequestInput({ targetRevisionId: "article-1#0001" }))
        );
        const empty = expectOk(
            await requestReview.execute(
                createRequestInput({ targetRevisionId: "article-1#0002", title: null })
            )
        );
        const blank = expectOk(
            await requestReview.execute(
                createRequestInput({ targetRevisionId: "article-1#0003", title: "   " })
            )
        );

        expect([missing.title, empty.title, blank.title]).toEqual([
            "Article article-1",
            "Article article-1",
            "Article article-1"
        ]);
    });

    it("refuses a short title and saves nothing", async () => {
        const { context } = await createReviewContext();

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput({ title: "Abc" }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("The review title must have at least 5 characters.");
        const active = expectOk(
            await context.container.resolve(ReviewRepository).getActiveByTarget({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-1#0001"
            })
        );
        expect(active).toBeNull();
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });
});

describe("RejectReviewStepUseCase comment (D100, R90)", () => {
    const setup = async () => {
        const { context } = await createReviewContext();
        const requested = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );
        const actorInput = {
            reviewId: requested.id,
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID]
        };
        expectOk(await context.container.resolve(StartReviewStepUseCase).execute(actorInput));
        recordedSyncs.length = 0;
        recordedEvents.length = 0;
        return {
            context,
            reviewId: requested.id,
            actorInput,
            reject: context.container.resolve(RejectReviewStepUseCase)
        };
    };

    it("refuses a short comment and saves nothing", async () => {
        const { context, reviewId, actorInput, reject } = await setup();

        const result = await reject.execute({ ...actorInput, comment: "Too short" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("A rejection needs a comment of at least 10 characters.");
        const read = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: reviewId })
        );
        expect(read).toMatchObject({ state: "inProgress", currentStepState: "inReview" });
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("rejects with a comment of at least 10 characters", async () => {
        const { actorInput, reject } = await setup();

        const result = await reject.execute({ ...actorInput, comment: " Not ready. " });

        const review = expectOk(result);
        expect(review.state).toBe("rejected");
        expect(review.steps[0].comment).toBe("Not ready.");
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepRejected"]);
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.minimumLengths.test.ts packages/api-workflows/__tests__/review/RequestTitleAndRejectComment.test.ts 2>&1 | tail -50`
Expected: FAIL. The requested title is ignored (`expected "Article 1" to be "Spring launch"`), the short title and the short comments are accepted (`expected false to be true`).

- [ ] **Step 3: The rules in the aggregate**

In `packages/api-workflows/src/domain/review/Review.ts`, replace:

```ts
/** `reason` on the pool assignment when a resolver returns the requester as owner (spec 5.1). */
const REQUESTER_OWNER_REASON =
    "The resolved owner is the requester, who cannot review their own content.";
```

with:

```ts
/** `reason` on the pool assignment when a resolver returns the requester as owner (spec 5.1). */
const REQUESTER_OWNER_REASON =
    "The resolved owner is the requester, who cannot review their own content.";

/** A requested title, trimmed, has at least this many characters (D100, D135). */
export const REVIEW_TITLE_MIN_LENGTH = 5;

/** A rejection comment, trimmed, has at least this many characters (D100). */
export const REJECT_COMMENT_MIN_LENGTH = 10;
```

In `interface ReviewRequestParams`, replace:

```ts
    targetRevisionId: string;
    title: string;
    targetContext: TargetContext;
```

with:

```ts
    targetRevisionId: string;
    /** The target's title; the review title when `requestedTitle` is missing or blank. */
    title: string;
    /** The title the requester typed (D135); trimmed, at least 5 characters when given. */
    requestedTitle?: string | null;
    targetContext: TargetContext;
```

Replace:

```ts
export type ReviewDecisionError =
    | ReviewInvalidStateError
    | ReviewStepNotCurrentError
    | ReviewNotOwnerError;
```

with:

```ts
export type ReviewDecisionError =
    | ReviewInvalidStateError
    | ReviewStepNotCurrentError
    | ReviewNotOwnerError;

/** Reject adds the comment rule (D100) to the decision rules. */
export type ReviewRejectError = ReviewDecisionError | ReviewValidationError;
```

In `Review.request`, replace:

```ts
        if (params.workflow.steps.length === 0) {
            return Result.fail(
                new ReviewValidationError(`The workflow "${params.workflow.name}" has no steps.`)
            );
        }
```

with:

```ts
        if (params.workflow.steps.length === 0) {
            return Result.fail(
                new ReviewValidationError(`The workflow "${params.workflow.name}" has no steps.`)
            );
        }
        const requestedTitle = params.requestedTitle?.trim() ?? "";
        if (requestedTitle && requestedTitle.length < REVIEW_TITLE_MIN_LENGTH) {
            return Result.fail(
                new ReviewValidationError(
                    `The review title must have at least ${REVIEW_TITLE_MIN_LENGTH} characters.`
                )
            );
        }
```

and, in the `new Review({ ... })` literal of the same method, replace:

```ts
            targetRevisionId: params.targetRevisionId,
            title: params.title,
            isActive: true,
```

with:

```ts
            targetRevisionId: params.targetRevisionId,
            // Fixed from here on: no operation changes the title (D135).
            title: requestedTitle || params.title,
            isActive: true,
```

Replace the whole `reject` method:

```ts
    /** Owner rejects; reject is final for the revision (D10). */
    public reject(params: ReviewDecisionParams): Result<void, ReviewDecisionError> {
        const current = this.getOwnedStep("reject", params);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;

        step.state = "rejected";
        step.comment = params.comment;
        step.finishedOn = params.now;
        this.data.state = "rejected";
        this.facts.push({
            type: "stepRejected",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "rejected" },
            comment: params.comment
        });
        return Result.ok();
    }
```

with:

```ts
    /**
     * Owner rejects; reject is final for the revision (D10). Needs a comment of at least 10
     * characters after trimming (D100), checked after the state and owner rules. `checkReject`
     * (the viewer flag) does not take a comment, so it leaves this rule out.
     */
    public reject(params: ReviewDecisionParams): Result<void, ReviewRejectError> {
        const current = this.getOwnedStep("reject", params);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const comment = params.comment?.trim() ?? "";
        if (comment.length < REJECT_COMMENT_MIN_LENGTH) {
            return Result.fail(
                new ReviewValidationError(
                    `A rejection needs a comment of at least ${REJECT_COMMENT_MIN_LENGTH} characters.`
                )
            );
        }
        const step = current.value;

        step.state = "rejected";
        step.comment = comment;
        step.finishedOn = params.now;
        this.data.state = "rejected";
        this.facts.push({
            type: "stepRejected",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "rejected" },
            comment
        });
        return Result.ok();
    }
```

- [ ] **Step 4: The request input and the reject errors**

In `packages/api-workflows/src/features/review/RequestReview/abstractions.ts`, replace:

```ts
    targetRevisionId: string;
    /** Reviewer picks per step (D22). Only malformed picks are rejected here (spec 6). */
    picks?: ReviewPick[];
```

with:

```ts
    targetRevisionId: string;
    /**
     * The review title (D135). Trimmed; at least 5 characters when given (D100). Missing or
     * blank: the target's title.
     */
    title?: string | null;
    /** Reviewer picks per step (D22). Only malformed picks are rejected here (spec 6). */
    picks?: ReviewPick[];
```

In `packages/api-workflows/src/features/review/RequestReview/RequestReviewUseCase.ts`, replace:

```ts
            targetRevisionId: input.targetRevisionId,
            title: target.title,
            targetContext: target.context,
```

with:

```ts
            targetRevisionId: input.targetRevisionId,
            title: target.title,
            requestedTitle: input.title,
            targetContext: target.context,
```

In `packages/api-workflows/src/features/review/RejectReviewStep/abstractions.ts`, replace:

```ts
    ReviewStepNotCurrentError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
```

with:

```ts
    ReviewStepNotCurrentError,
    ReviewTargetSyncError,
    ReviewValidationError
} from "~/domain/review/errors.js";
```

and replace:

```ts
    notOwner: ReviewNotOwnerError;
    persistence: ReviewPersistenceError;
```

with:

```ts
    notOwner: ReviewNotOwnerError;
    /** The comment is shorter than 10 characters after trimming (D100). */
    validation: ReviewValidationError;
    persistence: ReviewPersistenceError;
```

`RejectReviewStepUseCase.ts` needs no change: it already returns `rejected.error`.

- [ ] **Step 5: Update the tests that reject with a short or missing comment**

In `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`, replace every `"No."` (three places: "lets only the owner reject", "cannot reject an awaiting step", and the `getSystemWorkflow` test) with `"Not ready to publish."`. The first two still fail on owner and state first; the third must now succeed.

In `packages/api-workflows/__tests__/domain/Review.checks.test.ts`, replace:

```ts
        expectOk(rejected.reject({ ...checkParams(reviewer), comment: null, now: LATER }));
```

with:

```ts
        expectOk(
            rejected.reject({ ...checkParams(reviewer), comment: "Needs another pass.", now: LATER })
        );
```

(The `decisionCases` reject test keeps `comment: null`: every case fails on state or owner before the comment rule, so check and transition still return the same error.)

In `packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts`, replace:

```ts
            .reject({ ...params, comment: null })
```

with:

```ts
            .reject({ ...params, comment: "Needs another pass." })
```

so the transition-derived `canReject` keeps matching the flag.

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS, or "not run" (A9).

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` and `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (their rejections use "Needs another pass.").

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|api-headless-cms-workflows|api-website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
feat(api-workflows): take a requested review title and require a rejection comment

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
