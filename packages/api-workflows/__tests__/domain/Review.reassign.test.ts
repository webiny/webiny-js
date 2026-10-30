import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import type { ReviewFact } from "~/domain/review/facts.js";
import { toAssignmentRecordValues } from "~/domain/assignment/toAssignmentRecordValues.js";
import {
    aiActor,
    createRequestedReview,
    createStartedReview,
    expectOk,
    NOW,
    otherReviewer,
    requester,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

/** Holds `workflows.reassign`; not a member of any team. */
const manager: Actor = {
    type: "user",
    id: "user-manager",
    displayName: "Mona Manager",
    identityType: "admin"
};

const newOwner: Actor = {
    type: "user",
    id: "user-anna",
    displayName: "Anna",
    identityType: "admin"
};

describe("Review.reassign (spec 5.1, D33, R119)", () => {
    it("moves an awaiting step to the chosen user and records a reassign outcome", () => {
        const review = createRequestedReview();
        review.pullFacts();

        expectOk(review.reassign({ stepId: "legal", actor: manager, owner: newOwner, now: LATER }));

        const [step] = review.toData().steps;
        expect(step).toMatchObject({
            state: "inReview",
            owner: newOwner,
            startedOn: LATER,
            assignmentSource: "reassign",
            assignment: { source: "reassign", by: manager }
        });
        const facts = review.pullFacts();
        expect(facts).toEqual([
            {
                type: "stepReassigned",
                occurredOn: LATER,
                actor: manager,
                change: { stepId: "legal", fromState: "awaiting", toState: "inReview" },
                owner: newOwner,
                previousOwner: null,
                records: [
                    {
                        kind: "outcome",
                        userId: newOwner.id,
                        source: "reassign",
                        ruleId: null,
                        by: manager,
                        reason: null
                    }
                ]
            }
        ]);
    });

    it("takes a step in review from its owner and keeps when it started", () => {
        const review = createStartedReview();

        expectOk(review.reassign({ stepId: "legal", actor: manager, owner: newOwner, now: LATER }));

        const [step] = review.toData().steps;
        expect(step).toMatchObject({ state: "inReview", owner: newOwner, startedOn: NOW });
        const [fact] = review.pullFacts();
        expect(fact).toMatchObject({
            type: "stepReassigned",
            change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
            previousOwner: reviewer
        });
    });

    it("lets the owner's own reassign go to someone else", () => {
        const review = createStartedReview();

        const result = review.reassign({
            stepId: "legal",
            actor: reviewer,
            owner: otherReviewer,
            now: LATER
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0].owner).toEqual(otherReviewer);
    });

    it("refuses the current owner and records nothing", () => {
        const review = createStartedReview();

        const result = review.reassign({
            stepId: "legal",
            actor: manager,
            owner: reviewer,
            now: LATER
        });

        expect(result.error.code).toBe("Workflows/Review/AlreadyOwner");
        expect(result.error.data).toEqual({ reviewId: "review-1", stepId: "legal" });
        expect(review.pullFacts()).toEqual([]);
        expect(review.toData().steps[0].owner).toEqual(reviewer);
    });

    it("refuses the requester as the new owner and records nothing", () => {
        const review = createStartedReview();
        review.pullFacts();

        const result = review.reassign({
            stepId: "legal",
            actor: manager,
            owner: requester,
            now: LATER
        });

        expect(result.error.code).toBe("Workflows/Review/RequesterCannotReview");
        expect(result.error.data).toEqual({ reviewId: "review-1", stepId: "legal" });
        expect(review.pullFacts()).toEqual([]);
        expect(review.toData().steps[0].owner).toEqual(reviewer);
    });

    it("checks the chosen user against the current owner without a transition", () => {
        const review = createStartedReview();

        const sameOwner = review.checkReassignTo({ stepId: "legal", userId: reviewer.id });
        const otherUser = review.checkReassignTo({ stepId: "legal", userId: newOwner.id });
        const noUser = review.checkReassign({ stepId: "legal" });

        expect(sameOwner.error.code).toBe("Workflows/Review/AlreadyOwner");
        expect(otherUser.isOk()).toBe(true);
        expect(noUser.isOk()).toBe(true);
    });

    it("uses the reassign guard: AI step, other step, finished review", () => {
        const aiData = toSaveData(createStartedReview());
        aiData.steps[0].owner = { ...aiActor };
        const aiOwned = Review.fromData(aiData);
        const otherStep = createRequestedReview();
        const cancelled = createRequestedReview();
        expectOk(cancelled.cancel({ actor: requester, now: NOW }));

        const byAi = aiOwned.reassign({
            stepId: "legal",
            actor: manager,
            owner: newOwner,
            now: LATER
        });
        const byStep = otherStep.reassign({
            stepId: "editorial",
            actor: manager,
            owner: newOwner,
            now: LATER
        });
        const byState = cancelled.reassign({
            stepId: "legal",
            actor: manager,
            owner: newOwner,
            now: LATER
        });

        expect(byAi.error.code).toBe("Workflows/Review/StepNotReassignable");
        expect(byStep.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(byState.error.code).toBe("Workflows/Review/InvalidState");
        expect(aiOwned.toData().steps[0].owner).toEqual(aiActor);
    });

    it("turns the reassigned fact into one record of the review, step and time (R117)", () => {
        const review = toSaveData(createRequestedReview());
        const fact: ReviewFact = {
            type: "stepReassigned",
            occurredOn: LATER,
            actor: manager,
            change: { stepId: "legal", fromState: "awaiting", toState: "inReview" },
            owner: newOwner,
            previousOwner: null,
            records: [
                {
                    kind: "outcome",
                    userId: newOwner.id,
                    source: "reassign",
                    ruleId: null,
                    by: manager,
                    reason: null
                }
            ]
        };

        expect(toAssignmentRecordValues(review, fact)).toEqual([
            {
                kind: "outcome",
                userId: newOwner.id,
                source: "reassign",
                ruleId: null,
                by: manager,
                reason: null,
                reviewId: "review-1",
                workflowId: "workflow-1",
                stepId: "legal",
                assignedOn: LATER
            }
        ]);
    });
});
