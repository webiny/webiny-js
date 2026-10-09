import { describe, expect, it } from "vitest";
import { Review, type ReviewRequestParams } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import {
    aiActor,
    ARTICLE_MODEL,
    createRequestedReview,
    createStartedReview,
    createWorkflow,
    expectOk,
    NOW,
    OTHER_TEAM_ID,
    otherReviewer,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

/** A non-user actor that is not the requester, so only the actor-type rule can reject it. */
const automationActor: Actor = {
    type: "automation",
    id: "user-reviewer",
    displayName: "Automation"
};

const requestParams = (overrides: Partial<ReviewRequestParams> = {}): ReviewRequestParams => {
    return {
        id: "review-1",
        workflow: createWorkflow(),
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        title: "Article 1",
        targetContext,
        picks: [],
        requester,
        now: NOW,
        ...overrides
    };
};

const requestReview = (overrides: Partial<ReviewRequestParams> = {}): Review => {
    return expectOk(Review.request(requestParams(overrides)));
};

const onLegal = (actor: Actor, actorTeamIds: string[] = [REVIEW_TEAM_ID]) => {
    return { stepId: "legal", actor, actorTeamIds, now: LATER };
};

describe("Review.request", () => {
    it("snapshots the workflow with every step pending", () => {
        const workflow = createWorkflow();
        const review = requestReview({ workflow });

        const data = review.toData();

        expect(data).toMatchObject({
            id: "review-1",
            workflowId: workflow.id,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            isActive: true,
            state: "inProgress",
            targetContext,
            workflow: { name: workflow.name, models: workflow.models },
            createdBy: requester,
            createdOn: NOW,
            lastChangedOn: NOW
        });
        expect(data.steps.map(step => step.state)).toEqual(["pending", "pending"]);
        expect(data.steps[0].config).toEqual(workflow.steps[0].config);
        expect(review.getStepToReach()?.id).toBe("legal");
        expect(review.pullFacts()).toEqual([
            { type: "requested", occurredOn: NOW, actor: requester }
        ]);
    });

    it("stores picks on the matching steps", () => {
        const review = requestReview({ picks: [{ stepId: "legal", userId: otherReviewer.id }] });

        expect(review.toData().steps.map(step => step.pickedUserId)).toEqual([
            otherReviewer.id,
            null
        ]);
    });

    it("rejects picks for unknown steps or steps without manual picks", () => {
        const unknownStep = Review.request(
            requestParams({ picks: [{ stepId: "missing", userId: reviewer.id }] })
        );
        expect(unknownStep.isFail()).toBe(true);
        expect(unknownStep.error.code).toBe("Workflows/Review/Validation");
        expect(unknownStep.error.message).toBe(
            'Step "missing" does not exist in workflow "Article review".'
        );

        const noPicks = Review.request(
            requestParams({ picks: [{ stepId: "editorial", userId: reviewer.id }] })
        );
        expect(noPicks.isFail()).toBe(true);
        expect(noPicks.error.message).toBe(
            'Step "Editorial review" does not allow picking a reviewer.'
        );
    });

    it("rejects two picks for the same step", () => {
        const result = Review.request(
            requestParams({
                picks: [
                    { stepId: "legal", userId: reviewer.id },
                    { stepId: "legal", userId: otherReviewer.id }
                ]
            })
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe('Step "Legal review" has more than one pick.');
    });

    it("rejects a model the workflow is not bound to", () => {
        const result = Review.request(requestParams({ model: "cms.other" }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe(
            'The workflow "Article review" is not bound to the model "cms.other".'
        );
    });

    it("rejects a workflow without steps", () => {
        const result = Review.request(requestParams({ workflow: createWorkflow({ steps: [] }) }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe('The workflow "Article review" has no steps.');
    });
});

describe("Review.reach", () => {
    it("puts the step in the pool when nobody owns it", () => {
        const review = requestReview();
        review.pullFacts();

        const result = review.reach({ resolution: poolResolution(), actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignmentSource: "pool",
            assignment: { source: "pool" },
            reachedOn: NOW,
            startedOn: null
        });
        expect(review.getStepToReach()).toBeNull();
        expect(review.pullFacts()).toEqual([
            {
                type: "stepReached",
                occurredOn: NOW,
                actor: requester,
                owner: null,
                change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
                assignment: { source: "pool" }
            }
        ]);
    });

    it("starts the step when an owner resolves", () => {
        const review = requestReview();

        expectOk(
            review.reach({
                resolution: {
                    owner: reviewer,
                    candidateTeamIds: [REVIEW_TEAM_ID],
                    assignment: { source: "picked" }
                },
                actor: requester,
                now: NOW
            })
        );

        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: reviewer,
            assignmentSource: "picked",
            reachedOn: NOW,
            startedOn: NOW
        });
        expect(review.pullFacts()).toContainEqual({
            type: "stepReached",
            occurredOn: NOW,
            actor: requester,
            owner: reviewer,
            change: { stepId: "legal", fromState: "pending", toState: "inReview" },
            assignment: { source: "picked" }
        });
    });

    it("falls back to the pool when the resolved owner is the requester", () => {
        const review = requestReview();
        review.pullFacts();

        expectOk(
            review.reach({
                resolution: {
                    owner: requester,
                    candidateTeamIds: [REVIEW_TEAM_ID],
                    assignment: { source: "picked" }
                },
                actor: requester,
                now: NOW
            })
        );

        const expectedAssignment = {
            source: "pool",
            reason: "The resolved owner is the requester, who cannot review their own content."
        };
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignmentSource: "pool",
            assignment: expectedAssignment,
            startedOn: null
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepReached",
                occurredOn: NOW,
                actor: requester,
                owner: null,
                change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
                assignment: expectedAssignment
            }
        ]);
    });

    it("fails when the current step is not pending", () => {
        const review = createRequestedReview();

        const result = review.reach({ resolution: poolResolution(), actor: requester, now: NOW });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            transition: "reach",
            reviewState: "inProgress",
            stepId: "legal",
            stepState: "awaiting"
        });
    });
});

describe("Review.start", () => {
    it("lets a candidate start an awaiting step", () => {
        const review = createRequestedReview();
        review.pullFacts();

        const result = review.start(onLegal(reviewer));

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: reviewer,
            startedOn: LATER,
            assignmentSource: "poolStart",
            assignment: { source: "poolStart" }
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepStarted",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "awaiting", toState: "inReview" }
            }
        ]);
    });

    it("does not let the requester start their own review", () => {
        const review = createRequestedReview();
        review.pullFacts();

        const result = review.start(onLegal(requester));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/RequesterCannotReview");
        expect(review.toData().steps[0].state).toBe("awaiting");
        expect(review.pullFacts()).toEqual([]);
    });

    it("does not let a user outside the candidate teams start", () => {
        const review = createRequestedReview();

        const result = review.start(onLegal(reviewer, [OTHER_TEAM_ID]));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotCandidate");
        expect(result.error.data).toEqual({ reviewId: "review-1", stepId: "legal" });
    });

    it("does not let a non-user actor start", () => {
        const review = createRequestedReview();

        const result = review.start(onLegal(automationActor));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/ActorNotUser");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            stepId: "legal",
            actorType: "automation"
        });
    });

    it("fails when the step is not the current step", () => {
        const review = createRequestedReview();
        review.pullFacts();

        const result = review.start({ ...onLegal(reviewer), stepId: "editorial" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            stepId: "editorial",
            currentStepId: "legal"
        });
        expect(review.pullFacts()).toEqual([]);
    });

    it("cannot start a step that is already in review", () => {
        const review = createStartedReview();

        const result = review.start(onLegal(otherReviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
    });
});

describe("Review.takeOver", () => {
    it("moves a human step to another candidate", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(otherReviewer));

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: otherReviewer,
            assignmentSource: "takeOver",
            assignment: { source: "takeOver", by: otherReviewer },
            startedOn: NOW
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepTakenOver",
                occurredOn: LATER,
                actor: otherReviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
                previousOwner: reviewer
            }
        ]);
    });

    it("does not let the current owner take over", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(reviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("does not let the requester take over", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(requester));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/RequesterCannotReview");
    });

    it("does not let a user outside the candidate teams take over", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(otherReviewer, [OTHER_TEAM_ID]));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotCandidate");
        expect(review.toData().steps[0].owner).toEqual(reviewer);
    });

    it("does not let a non-user actor take over", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(automationActor));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/ActorNotUser");
    });

    it("fails when the step is not the current step", () => {
        const review = createStartedReview();

        const result = review.takeOver({ ...onLegal(otherReviewer), stepId: "editorial" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(review.toData().steps[0].owner).toEqual(reviewer);
    });

    it("does not take over an AI step", () => {
        const review = requestReview();
        expectOk(
            review.reach({
                resolution: {
                    owner: aiActor,
                    candidateTeamIds: [REVIEW_TEAM_ID],
                    assignment: { source: "strategy" }
                },
                actor: requester,
                now: NOW
            })
        );

        const result = review.takeOver(onLegal(reviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotTakeable");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            stepId: "legal",
            ownerType: "ai"
        });
    });

    it("cannot take over an awaiting step", () => {
        const review = createRequestedReview();

        const result = review.takeOver(onLegal(reviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
    });
});
