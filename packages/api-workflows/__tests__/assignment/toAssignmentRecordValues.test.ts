import { describe, expect, it } from "vitest";
import {
    createRequestedReview,
    NOW,
    otherReviewer,
    requester,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type { ReviewFact } from "~/domain/review/facts.js";
import { toAssignmentRecordValues } from "~/domain/assignment/toAssignmentRecordValues.js";

const LATER = "2026-10-09T11:00:00.000Z";

const SKIP: AssignmentDecision = {
    kind: "skip",
    userId: otherReviewer.id,
    source: "rule",
    ruleId: "rule-legal",
    by: null,
    reason: "Excluded from reviews."
};

const OUTCOME: AssignmentDecision = {
    kind: "outcome",
    userId: reviewer.id,
    source: "roundRobin",
    ruleId: null,
    by: null,
    reason: null
};

describe("toAssignmentRecordValues (R117)", () => {
    it("turns the records of a reached step into values of that review, step and time", () => {
        const review = toSaveData(createRequestedReview());
        const fact: ReviewFact = {
            type: "stepReached",
            occurredOn: LATER,
            actor: requester,
            owner: reviewer,
            change: { stepId: "editorial", fromState: "pending", toState: "inReview" },
            assignment: { source: "roundRobin" },
            taskId: null,
            records: [SKIP, OUTCOME]
        };

        const values = toAssignmentRecordValues(review, fact);

        expect(values).toEqual([
            {
                ...SKIP,
                reviewId: "review-1",
                workflowId: "workflow-1",
                stepId: "editorial",
                assignedOn: LATER
            },
            {
                ...OUTCOME,
                reviewId: "review-1",
                workflowId: "workflow-1",
                stepId: "editorial",
                assignedOn: LATER
            }
        ]);
    });

    it("turns start and take over into one outcome each", () => {
        const review = toSaveData(createRequestedReview());
        const started: ReviewFact = {
            type: "stepStarted",
            occurredOn: NOW,
            actor: reviewer,
            change: { stepId: "legal", fromState: "awaiting", toState: "inReview" },
            records: [{ ...OUTCOME, source: "poolStart" }]
        };
        const takenOver: ReviewFact = {
            type: "stepTakenOver",
            occurredOn: LATER,
            actor: otherReviewer,
            change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
            previousOwner: reviewer,
            notifyPreviousOwner: true,
            records: [
                { ...OUTCOME, userId: otherReviewer.id, source: "takeOver", by: otherReviewer }
            ]
        };

        expect(toAssignmentRecordValues(review, started)).toMatchObject([
            { source: "poolStart", userId: reviewer.id, stepId: "legal", assignedOn: NOW }
        ]);
        expect(toAssignmentRecordValues(review, takenOver)).toMatchObject([
            { source: "takeOver", userId: otherReviewer.id, by: otherReviewer, assignedOn: LATER }
        ]);
    });

    it("returns nothing for facts without assignment decisions", () => {
        const review = toSaveData(createRequestedReview());
        const facts: ReviewFact[] = [
            { type: "requested", occurredOn: NOW, actor: requester },
            {
                type: "stepApproved",
                occurredOn: NOW,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "approved" },
                comment: null
            },
            {
                type: "stepFailed",
                occurredOn: NOW,
                actor: requester,
                change: { stepId: "legal", fromState: "inReview", toState: "failed" },
                reason: "The automation failed: boom."
            },
            {
                type: "stepRestarted",
                occurredOn: NOW,
                actor: requester,
                change: { stepId: "legal", fromState: "failed", toState: "pending" },
                previousTaskId: "task-1"
            },
            {
                type: "cancelled",
                occurredOn: NOW,
                actor: requester,
                stepId: "legal",
                stepState: "awaiting",
                reason: null
            },
            { type: "approved", occurredOn: NOW, actor: reviewer }
        ];

        expect(facts.flatMap(fact => toAssignmentRecordValues(review, fact))).toEqual([]);
    });

    it("writes no record for an automation reach: it has no assignment decision", () => {
        const review = toSaveData(createRequestedReview());
        const fact: ReviewFact = {
            type: "stepReached",
            occurredOn: LATER,
            actor: requester,
            owner: { type: "automation", id: requester.id, displayName: requester.displayName },
            change: { stepId: "legal", fromState: "pending", toState: "inReview" },
            assignment: null,
            taskId: "task-1",
            records: []
        };

        expect(toAssignmentRecordValues(review, fact)).toEqual([]);
    });
});
