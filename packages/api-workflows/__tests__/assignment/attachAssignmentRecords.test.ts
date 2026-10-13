import { describe, expect, it } from "vitest";
import { createRequestedReview, toSaveData } from "~tests/__helpers/fixtures.js";
import type { AssignmentRecord } from "~/domain/assignment/types.js";
import { attachAssignmentRecords } from "~/domain/assignment/attachAssignmentRecords.js";

const record = (id: string, reviewId: string, stepId: string, hour: string): AssignmentRecord => {
    return {
        id,
        reviewId,
        workflowId: "workflow-1",
        stepId,
        userId: "user-owner",
        assignedOn: `2026-10-09T${hour}:00:00.000Z`,
        source: "roundRobin",
        ruleId: null,
        by: null,
        reason: null,
        kind: "outcome"
    };
};

describe("attachAssignmentRecords (D127, R96)", () => {
    it("puts each record on its step, keeping the given order", () => {
        const review = toSaveData(createRequestedReview());
        const records = [
            record("c", "review-1", "legal", "12"),
            record("b", "review-1", "editorial", "11"),
            record("a", "review-1", "legal", "10")
        ];

        const result = attachAssignmentRecords(review, records);

        expect(result.steps.map(step => step.id)).toEqual(["legal", "editorial"]);
        expect(result.steps[0].assignments.map(item => item.id)).toEqual(["c", "a"]);
        expect(result.steps[1].assignments.map(item => item.id)).toEqual(["b"]);
        expect({ ...result, steps: undefined }).toEqual({ ...review, steps: undefined });
        expect(result.steps[0]).toMatchObject(review.steps[0]);
    });

    it("gives every step an empty list without records and ignores other reviews and steps", () => {
        const review = toSaveData(createRequestedReview());

        const result = attachAssignmentRecords(review, [
            record("x", "review-other", "legal", "10"),
            record("y", "review-1", "missing-step", "10")
        ]);

        expect(result.steps.map(step => step.assignments)).toEqual([[], []]);
    });

    it("does not change the review it was given", () => {
        const review = toSaveData(createRequestedReview());
        const before = structuredClone(review);

        attachAssignmentRecords(review, [record("a", "review-1", "legal", "10")]);

        expect(review).toEqual(before);
    });
});
