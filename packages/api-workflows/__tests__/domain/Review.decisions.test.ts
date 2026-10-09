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

describe("Review.fromData and toData", () => {
    it("isolates the aggregate from the data it was built from and the data it returns", () => {
        const source = createRequestedReview().toData();
        const review = Review.fromData(source);

        source.steps[0].title = "Changed through the input";
        review.toData().steps[0].title = "Changed through the output";
        review.toData().steps[0].candidateTeamIds.push("team-leak");

        expect(review.toData().steps[0].title).toBe("Legal review");
        expect(review.toData().steps[0].candidateTeamIds).toEqual([REVIEW_TEAM_ID]);
    });
});
