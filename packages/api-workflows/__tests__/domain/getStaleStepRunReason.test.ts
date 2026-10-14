import { describe, expect, it } from "vitest";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import type { ReviewData } from "~/domain/review/types.js";
import { requester, toSaveData } from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const TASK = { id: "task-1", createdById: requester.id };

const createData = (): ReviewData => {
    return toSaveData(createRunningAutomationReview("task-1"));
};

describe("getStaleStepRunReason (R144)", () => {
    it("is null for the current step of an active review that carries the task id", () => {
        expect(getStaleStepRunReason(createData(), AUTOMATION_STEP_ID, TASK)).toBeNull();
    });

    it("is stale when the review is not active", () => {
        const data = { ...createData(), isActive: false };

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The review is not active."
        );
    });

    it("is stale when the review is not in progress", () => {
        const data: ReviewData = { ...createData(), state: "rejected" };

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The review is not in progress."
        );
    });

    it("is stale when another step is the current step", () => {
        const data: ReviewData = { ...createData(), currentStepId: "editorial" };

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The step is not the current step."
        );
    });

    it("is stale when the step is not in review (failed, approved, pending)", () => {
        for (const state of ["failed", "approved", "pending", "awaiting", "rejected"] as const) {
            const data = createData();
            data.steps[0].state = state;

            expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
                "The step is not in review."
            );
        }
    });

    it("is stale when the step names no step of the review", () => {
        const data: ReviewData = { ...createData(), currentStepId: "unknown" };

        expect(getStaleStepRunReason(data, "unknown", TASK)).toBe("The step is not in review.");
    });

    it("is stale for the task id of an earlier attempt", () => {
        const data = createData();
        data.steps[0].taskId = "task-2";

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The step does not belong to this task."
        );
    });

    it("is stale when the step has no task id yet", () => {
        const data = createData();
        data.steps[0].taskId = null;

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The step does not belong to this task."
        );
    });

    it("is stale when the task was not created by the requester", () => {
        expect(
            getStaleStepRunReason(createData(), AUTOMATION_STEP_ID, {
                id: "task-1",
                createdById: "user-someone-else"
            })
        ).toBe("The task was not created by the requester.");
    });
});
