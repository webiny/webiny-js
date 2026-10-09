### Task 5: Review aggregate — approve, reject, cancel, save preparation and `system.workflow`

**Files:**
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Create: `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`

**Interfaces:**
- Consumes: Task 4 types, facts and errors (`ReviewNotOwnerError`).
- Produces (on `Review`):
  - `approve(params: ReviewDecisionParams): Result<void, ReviewDecisionError>`
  - `reject(params: ReviewDecisionParams): Result<void, ReviewDecisionError>`
  - `cancel(params: ReviewCancelParams): Result<void, ReviewInvalidStateError>`
  - `prepareForSave(): void` — refreshes `state`, `isActive`, `currentStepId`, `currentStepState`, `currentOwnerId` (user owners only), `currentCandidateTeamIds`, and `lastChangedOn` (newest unpulled fact).
  - `getSystemWorkflow(): ReviewSystemWorkflow | null` — `null` for cancelled reviews; read after `prepareForSave`.
  - `ReviewDecisionParams extends ReviewActorParams { comment: string | null }`, `ReviewCancelParams { actor: Actor; now: string }`, `ReviewDecisionError = ReviewInvalidStateError | ReviewNotOwnerError`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import {
    aiActor,
    ARTICLE_MODEL,
    createRequestedReview,
    createStartedReview,
    createWorkflow,
    NOW,
    otherReviewer,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

const decision = (actor: Actor, comment: string | null = null) => {
    return { actor, actorTeamIds: [REVIEW_TEAM_ID], comment, now: LATER };
};

/** Approves "legal" and starts "editorial" as `reviewer`; facts are cleared. */
const moveToSecondStep = (review: Review): void => {
    review.approve(decision(reviewer));
    review.reach({ resolution: poolResolution(), actor: reviewer, now: LATER });
    review.start({ actor: reviewer, actorTeamIds: [REVIEW_TEAM_ID], now: LATER });
    review.pullFacts();
};

const requestWithOwner = (owner: Actor): Review => {
    const result = Review.request({
        id: "review-1",
        workflow: createWorkflow(),
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        title: "Article 1",
        targetContext,
        picks: [],
        requester,
        now: NOW
    });
    const review = result.value;
    review.reach({
        resolution: {
            owner,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "strategy" }
        },
        actor: requester,
        now: NOW
    });
    return review;
};

describe("Review.approve", () => {
    it("approves the current step and leaves the next step to be reached", () => {
        const review = createStartedReview();

        const result = review.approve(decision(reviewer, "Looks good."));

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "approved",
            comment: "Looks good.",
            finishedOn: LATER,
            owner: reviewer
        });
        expect(review.getStepToReach()?.id).toBe("editorial");
        expect(review.pullFacts()).toEqual([
            {
                type: "stepApproved",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "approved" },
                comment: "Looks good."
            }
        ]);
    });

    it("approves the review when the last step is approved", () => {
        const review = createStartedReview();
        moveToSecondStep(review);

        const result = review.approve(decision(reviewer));

        expect(result.isOk()).toBe(true);
        expect(review.pullFacts().map(fact => fact.type)).toEqual(["stepApproved", "approved"]);
        review.prepareForSave();
        expect(review.toData()).toMatchObject({
            state: "approved",
            isActive: true,
            currentStepId: "editorial",
            currentStepState: "approved",
            currentOwnerId: reviewer.id,
            currentCandidateTeamIds: [REVIEW_TEAM_ID]
        });
        expect(review.getSystemWorkflow()).toEqual({
            workflowId: "workflow-1",
            reviewState: "approved",
            stepId: "editorial",
            stepName: "Editorial review",
            stepState: "approved"
        });
        expect(review.getStepToReach()).toBeNull();
    });

    it("lets only the owner approve", () => {
        const review = createStartedReview();

        const result = review.approve(decision(otherReviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotOwner");
    });

    it("cannot approve a step that is not in review", () => {
        const review = createRequestedReview();

        const result = review.approve(decision(reviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
    });

    it("lets an AI owner approve through the same path", () => {
        const review = requestWithOwner(aiActor);

        const result = review.approve(decision(aiActor, "No issues found."));

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0].state).toBe("approved");
    });
});

describe("Review.reject", () => {
    it("keeps the rejecting step and its owner as current", () => {
        const review = createStartedReview();

        const result = review.reject(decision(reviewer, "Needs another pass."));

        expect(result.isOk()).toBe(true);
        review.prepareForSave();
        expect(review.pullFacts()).toEqual([
            {
                type: "stepRejected",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
                comment: "Needs another pass."
            }
        ]);
        expect(review.toData()).toMatchObject({
            state: "rejected",
            isActive: true,
            currentStepId: "legal",
            currentStepState: "rejected",
            currentOwnerId: reviewer.id,
            lastChangedOn: LATER
        });
        expect(review.getSystemWorkflow()).toEqual({
            workflowId: "workflow-1",
            reviewState: "rejected",
            stepId: "legal",
            stepName: "Legal review",
            stepState: "rejected"
        });
        expect(review.getStepToReach()).toBeNull();
        expect(review.approve(decision(reviewer)).isFail()).toBe(true);
        expect(review.cancel({ actor: requester, now: LATER }).error.code).toBe(
            "Workflows/Review/InvalidState"
        );
    });
});

describe("Review.cancel", () => {
    it("clears the current-step fields on cancel", () => {
        const review = createStartedReview();

        const result = review.cancel({ actor: requester, now: LATER });

        expect(result.isOk()).toBe(true);
        review.prepareForSave();
        expect(review.toData()).toMatchObject({
            state: "cancelled",
            isActive: false,
            currentStepId: null,
            currentStepState: null,
            currentOwnerId: null,
            currentCandidateTeamIds: [],
            lastChangedOn: LATER
        });
        expect(review.toData().steps[0].owner).toEqual(reviewer);
        expect(review.getSystemWorkflow()).toBeNull();
        expect(review.pullFacts()).toEqual([
            {
                type: "cancelled",
                occurredOn: LATER,
                actor: requester,
                stepId: "legal",
                stepState: "inReview"
            }
        ]);
    });

    it("cannot cancel a cancelled review", () => {
        const review = createStartedReview();
        review.cancel({ actor: requester, now: LATER });

        const result = review.cancel({ actor: requester, now: LATER });

        expect(result.isFail()).toBe(true);
        expect(result.error.data).toMatchObject({ transition: "cancel", reviewState: "cancelled" });
    });
});

describe("Review.prepareForSave", () => {
    it("sets lastChangedOn from the newest fact and refreshes the current step", () => {
        const review = createRequestedReview();
        review.start({ actor: reviewer, actorTeamIds: [REVIEW_TEAM_ID], now: LATER });

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            lastChangedOn: LATER,
            currentStepId: "legal",
            currentStepState: "inReview",
            currentOwnerId: reviewer.id,
            currentCandidateTeamIds: [REVIEW_TEAM_ID]
        });
        expect(review.getSystemWorkflow()).toEqual({
            workflowId: "workflow-1",
            reviewState: "inProgress",
            stepId: "legal",
            stepName: "Legal review",
            stepState: "inReview"
        });
    });

    it("keeps lastChangedOn when no review event happened", () => {
        const review = createRequestedReview();
        review.prepareForSave();
        review.pullFacts();
        const reloaded = Review.fromData({ ...review.toData(), lastChangedOn: NOW });

        reloaded.prepareForSave();

        expect(reloaded.toData().lastChangedOn).toBe(NOW);
    });

    it("never sets currentOwnerId for an AI owner", () => {
        const review = requestWithOwner(aiActor);

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            currentStepId: "legal",
            currentStepState: "inReview",
            currentOwnerId: null
        });
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.decisions.test.ts 2>&1 | tail -50`
Expected: FAIL, `review.approve is not a function` (and the same for `reject`, `cancel`, `prepareForSave`).

- [ ] **Step 3: Add the decisions, cancel and save preparation**

In `packages/api-workflows/src/domain/review/Review.ts`:

Replace the import block from `./types.js` and `./errors.js` with:

```ts
import type {
    Actor,
    ReviewData,
    ReviewPick,
    ReviewState,
    ReviewStep,
    ReviewSystemWorkflow,
    StepAssignmentResolution,
    StepState,
    TargetContext
} from "./types.js";
import type { ReviewFact } from "./facts.js";
import {
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotOwnerError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotTakeableError,
    type ReviewTransitionName,
    ReviewValidationError
} from "./errors.js";
```

After the `ReviewActorParams` interface, add:

```ts
export interface ReviewDecisionParams extends ReviewActorParams {
    comment: string | null;
}

export interface ReviewCancelParams {
    actor: Actor;
    now: string;
}
```

After the `ReviewTakeOverError` type, add:

```ts
export type ReviewDecisionError = ReviewInvalidStateError | ReviewNotOwnerError;
```

Inside `class Review`, add these public methods after `takeOver`:

```ts
    /** Owner (user, AI or automation) approves; the next step is reached by the caller (D6). */
    public approve(params: ReviewDecisionParams): Result<void, ReviewDecisionError> {
        const current = this.getOwnedStep("approve", params.actor);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;

        step.state = "approved";
        step.comment = params.comment;
        step.finishedOn = params.now;
        this.facts.push({
            type: "stepApproved",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "approved" },
            comment: params.comment
        });

        if (this.data.steps.every(item => item.state === "approved")) {
            this.data.state = "approved";
            this.facts.push({ type: "approved", occurredOn: params.now, actor: { ...params.actor } });
        }
        return Result.ok();
    }

    /** Owner rejects; reject is final for the revision (D10). */
    public reject(params: ReviewDecisionParams): Result<void, ReviewDecisionError> {
        const current = this.getOwnedStep("reject", params.actor);
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

    /** Allowed while the review is in progress (D25, D75). Who may cancel is checked in 1b. */
    public cancel(params: ReviewCancelParams): Result<void, ReviewInvalidStateError> {
        const step = this.findCurrentStep();
        if (this.data.state !== "inProgress") {
            return Result.fail(
                new ReviewInvalidStateError({
                    reviewId: this.data.id,
                    transition: "cancel",
                    reviewState: this.data.state,
                    stepId: step?.id ?? null,
                    stepState: step?.state ?? null
                })
            );
        }

        this.data.state = "cancelled";
        this.facts.push({
            type: "cancelled",
            occurredOn: params.now,
            actor: { ...params.actor },
            stepId: step?.id ?? null,
            stepState: step?.state ?? null
        });
        return Result.ok();
    }

    /**
     * Called by the single save path before persisting (D19). Derives the review-level fields from
     * the steps; `lastChangedOn` moves only when a review event happened (D119).
     */
    public prepareForSave(): void {
        const lastFact = this.facts[this.facts.length - 1];
        if (lastFact) {
            this.data.lastChangedOn = lastFact.occurredOn;
        }

        if (this.data.state === "cancelled") {
            this.data.isActive = false;
            this.data.currentStepId = null;
            this.data.currentStepState = null;
            this.data.currentOwnerId = null;
            this.data.currentCandidateTeamIds = [];
            return;
        }

        // After approve the last step stays current; after reject the rejecting step (D75).
        const current = this.findCurrentStep() ?? this.data.steps.at(-1);
        if (!current) {
            return;
        }
        this.data.isActive = true;
        this.data.state = Review.deriveState(current);
        this.data.currentStepId = current.id;
        this.data.currentStepState = current.state;
        this.data.currentOwnerId = current.owner?.type === "user" ? current.owner.id : null;
        this.data.currentCandidateTeamIds = [...current.candidateTeamIds];
    }

    /** `system.workflow` for the target revision (spec 4.5); read after `prepareForSave`. */
    public getSystemWorkflow(): ReviewSystemWorkflow | null {
        if (this.data.state === "cancelled" || !this.data.currentStepId) {
            return null;
        }
        const step = this.data.steps.find(item => item.id === this.data.currentStepId);
        if (!step) {
            return null;
        }
        return {
            workflowId: this.data.workflowId,
            reviewState: this.data.state,
            stepId: step.id,
            stepName: step.title,
            stepState: step.state
        };
    }
```

Inside `class Review`, add these private members after `checkReviewer`:

```ts
    private getOwnedStep(
        transition: ReviewTransitionName,
        actor: Actor
    ): Result<ReviewStep, ReviewDecisionError> {
        const current = this.getCurrentStepIn(transition, "inReview");
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const owner = step.owner;
        if (!owner || owner.type !== actor.type || owner.id !== actor.id) {
            return Result.fail(new ReviewNotOwnerError({ reviewId: this.data.id, stepId: step.id }));
        }
        return Result.ok(step);
    }

    private static deriveState(current: ReviewStep): ReviewState {
        if (current.state === "rejected") {
            return "rejected";
        }
        if (current.state === "approved") {
            return "approved";
        }
        return "inProgress";
    }
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain 2>&1 | tail -50`
Expected: PASS (`WorkflowValidator.test.ts`, `Review.request.test.ts`, `Review.decisions.test.ts` with 11 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add approve, reject and cancel to the review aggregate

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
