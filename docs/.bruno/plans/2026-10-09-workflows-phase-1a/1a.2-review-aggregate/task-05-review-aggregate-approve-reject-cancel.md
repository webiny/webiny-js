### Task 5: Review aggregate — approve, reject, cancel, save preparation and `system.workflow`

**Files:**
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Create: `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`

**Interfaces:**
- Consumes: Task 4 types, facts and errors (`ReviewNotOwnerError`, `ReviewStepNotCurrentError`), `expectOk` fixture.
- Produces (on `Review`):
  - `approve(params: ReviewDecisionParams): Result<void, ReviewDecisionError>`
  - `reject(params: ReviewDecisionParams): Result<void, ReviewDecisionError>`
  - `cancel(params: ReviewCancelParams): Result<void, ReviewInvalidStateError>` (review-level, no `stepId`, R17)
  - `prepareForSave(): void` — refreshes `state`, `isActive`, `currentStepId`, `currentStepState`, `currentOwnerId` (user owners only), `currentCandidateTeamIds`, and `lastChangedOn` (newest unpulled fact, cancel included, R-ruling on cancel).
  - `getSystemWorkflow(): ReviewSystemWorkflow | null` — derived from the steps through the same private `resolveCurrentStep()` as `prepareForSave`, so it is correct before or after `prepareForSave`; `null` for cancelled reviews.
  - `ReviewDecisionParams extends ReviewActorParams { comment: string | null }` (so `stepId` is required, R17; `actorTeamIds` is not read in 1a and is reserved for 1b permission checks), `ReviewCancelParams { actor: Actor; now: string }`, `ReviewDecisionError = ReviewInvalidStateError | ReviewStepNotCurrentError | ReviewNotOwnerError`.

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
    expectOk,
    NOW,
    otherReviewer,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";
const EARLIER = "2026-10-01T00:00:00.000Z";

const decision = (actor: Actor, comment: string | null = null, stepId = "legal") => {
    return { stepId, actor, actorTeamIds: [REVIEW_TEAM_ID], comment, now: LATER };
};

/** Approves "legal" and starts "editorial" as `reviewer`; facts are cleared. */
const moveToSecondStep = (review: Review): void => {
    expectOk(review.approve(decision(reviewer)));
    expectOk(review.reach({ resolution: poolResolution(), actor: reviewer, now: LATER }));
    expectOk(
        review.start({
            stepId: "editorial",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: LATER
        })
    );
    review.pullFacts();
};

const requestWithOwner = (owner: Actor): Review => {
    const review = expectOk(
        Review.request({
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
        })
    );
    expectOk(
        review.reach({
            resolution: {
                owner,
                candidateTeamIds: [REVIEW_TEAM_ID],
                assignment: { source: "strategy" }
            },
            actor: requester,
            now: NOW
        })
    );
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

        const result = review.approve(decision(reviewer, null, "editorial"));

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

    it("fails when the step is not the current step", () => {
        const review = createStartedReview();

        const result = review.approve(decision(reviewer, null, "editorial"));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            stepId: "editorial",
            currentStepId: "legal"
        });
        expect(review.toData().steps[0].state).toBe("inReview");
        expect(review.pullFacts()).toEqual([]);
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

    it("lets only the owner reject", () => {
        const review = createStartedReview();

        const result = review.reject(decision(otherReviewer, "No."));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotOwner");
        expect(review.toData().state).toBe("inProgress");
    });

    it("cannot reject an awaiting step", () => {
        const review = createRequestedReview();

        const result = review.reject(decision(reviewer, "No."));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(result.error.data).toMatchObject({ transition: "reject", stepState: "awaiting" });
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
        expectOk(review.cancel({ actor: requester, now: LATER }));

        const result = review.cancel({ actor: requester, now: LATER });

        expect(result.isFail()).toBe(true);
        expect(result.error.data).toMatchObject({ transition: "cancel", reviewState: "cancelled" });
    });

    it("cannot cancel an approved review", () => {
        const review = createStartedReview();
        moveToSecondStep(review);
        expectOk(review.approve(decision(reviewer, null, "editorial")));
        review.pullFacts();

        const result = review.cancel({ actor: requester, now: LATER });

        expect(result.isFail()).toBe(true);
        expect(result.error.data).toMatchObject({ transition: "cancel", reviewState: "approved" });
        expect(review.pullFacts()).toEqual([]);
    });
});

describe("Review.prepareForSave", () => {
    it("sets lastChangedOn from the newest fact and refreshes the current step", () => {
        const review = createRequestedReview();
        expectOk(
            review.start({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                now: LATER
            })
        );

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

    it("refreshes the current step to the next pool step after approve", () => {
        const review = createStartedReview();
        expectOk(review.approve(decision(reviewer)));
        expectOk(review.reach({ resolution: poolResolution(), actor: reviewer, now: LATER }));

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            state: "inProgress",
            isActive: true,
            currentStepId: "editorial",
            currentStepState: "awaiting",
            currentOwnerId: null,
            currentCandidateTeamIds: [REVIEW_TEAM_ID],
            lastChangedOn: LATER
        });
    });

    it("keeps lastChangedOn when no review event happened", () => {
        const review = createRequestedReview();
        review.prepareForSave();
        review.pullFacts();
        const reloaded = Review.fromData({ ...review.toData(), lastChangedOn: EARLIER });

        reloaded.prepareForSave();

        expect(reloaded.toData().lastChangedOn).toBe(EARLIER);
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

describe("Review.getSystemWorkflow", () => {
    it("derives the value from the steps without prepareForSave", () => {
        const review = createRequestedReview();

        expect(review.getSystemWorkflow()).toEqual({
            workflowId: "workflow-1",
            reviewState: "inProgress",
            stepId: "legal",
            stepName: "Legal review",
            stepState: "awaiting"
        });

        const started = createStartedReview();
        expectOk(started.reject(decision(reviewer, "No.")));

        expect(started.getSystemWorkflow()).toEqual({
            workflowId: "workflow-1",
            reviewState: "rejected",
            stepId: "legal",
            stepName: "Legal review",
            stepState: "rejected"
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
    ReviewActorNotUserError,
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotOwnerError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotCurrentError,
    ReviewStepNotTakeableError,
    type ReviewTransitionName,
    ReviewValidationError
} from "./errors.js";
```

After the `ReviewActorParams` interface, add:

```ts
/**
 * `stepId` must be the current step (R17). `actorTeamIds` is not read by approve or reject in 1a
 * (only the owner decides); it is reserved for the 1b permission checks.
 */
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
export type ReviewDecisionError =
    | ReviewInvalidStateError
    | ReviewStepNotCurrentError
    | ReviewNotOwnerError;
```

Inside `class Review`, add these public methods after `takeOver`:

```ts
    /** Owner (user, AI or automation) approves; the next step is reached by the caller (D6). */
    public approve(params: ReviewDecisionParams): Result<void, ReviewDecisionError> {
        const current = this.getOwnedStep("approve", params);
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
     * the steps; `lastChangedOn` moves only when a review event happened (D119). Cancel moves it
     * too: D119 does not list cancel, but a cancelled review leaves every list (`isActive: false`),
     * so this is harmless and keeps the field monotonic.
     */
    public prepareForSave(): void {
        const lastFact = this.facts[this.facts.length - 1];
        if (lastFact) {
            this.data.lastChangedOn = lastFact.occurredOn;
        }

        const current = this.resolveCurrentStep();
        if (!current) {
            // Cancelled (D75): the review leaves every list and the target is unlocked.
            this.data.isActive = false;
            this.data.currentStepId = null;
            this.data.currentStepState = null;
            this.data.currentOwnerId = null;
            this.data.currentCandidateTeamIds = [];
            return;
        }
        this.data.isActive = true;
        this.data.state = Review.deriveState(current);
        this.data.currentStepId = current.id;
        this.data.currentStepState = current.state;
        this.data.currentOwnerId = current.owner?.type === "user" ? current.owner.id : null;
        this.data.currentCandidateTeamIds = [...current.candidateTeamIds];
    }

    /**
     * `system.workflow` for the target revision (spec 4.5). Derived from the steps, so it does not
     * depend on `prepareForSave` having run.
     */
    public getSystemWorkflow(): ReviewSystemWorkflow | null {
        const current = this.resolveCurrentStep();
        if (!current) {
            return null;
        }
        return {
            workflowId: this.data.workflowId,
            reviewState: Review.deriveState(current),
            stepId: current.id,
            stepName: current.title,
            stepState: current.state
        };
    }
```

Inside `class Review`, add these private members after `checkReviewer` (Task 4 already added `getRequestedStepIn` and `withoutRequesterOwner`):

```ts
    /**
     * The step the review-level fields and `system.workflow` describe: the first step that is not
     * approved, else the last step (after approve the last step stays current, after reject the
     * rejecting step, D75). `null` for cancelled reviews. `request` guarantees at least one step.
     */
    private resolveCurrentStep(): ReviewStep | null {
        if (this.data.state === "cancelled") {
            return null;
        }
        return this.findCurrentStep() ?? this.data.steps.at(-1) ?? null;
    }

    private getOwnedStep(
        transition: ReviewTransitionName,
        params: ReviewDecisionParams
    ): Result<ReviewStep, ReviewDecisionError> {
        const current = this.getRequestedStepIn(transition, "inReview", params.stepId);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const actor = params.actor;
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
Expected: PASS (`WorkflowValidator.test.ts`, `Review.request.test.ts`, `Review.decisions.test.ts` with 17 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add approve, reject and cancel to the review aggregate

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
