import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { toSystemWorkflow } from "./toSystemWorkflow.js";
import { ReviewState } from "./ReviewState.js";
import { StepState } from "./StepState.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createStepDto } from "~/review/testing/reviewFixtures.js";
import { mapReview } from "~/review/gateway/mapReview.js";

describe("toSystemWorkflow", () => {
    it("returns null for no review", () => {
        expect(toSystemWorkflow(null)).toBeNull();
    });

    it("describes an in-progress review by its current step", () => {
        const review = createReview();

        expect(toSystemWorkflow(review)).toEqual({
            workflowId: "workflow-1",
            reviewState: ReviewState.InProgress,
            stepId: "step-1",
            stepName: "Editorial check",
            stepState: StepState.Awaiting
        });
    });

    it("derives approved from an approved current step", () => {
        const review = mapReview(
            createReviewDto({
                state: "approved",
                currentStepId: "step-2",
                currentStepState: "approved",
                steps: [
                    createStepDto({ id: "step-1", title: "Draft check", state: "approved" }),
                    createStepDto({ id: "step-2", title: "Editorial check", state: "approved" })
                ]
            })
        );

        expect(toSystemWorkflow(review)).toEqual({
            workflowId: "workflow-1",
            reviewState: ReviewState.Approved,
            stepId: "step-2",
            stepName: "Editorial check",
            stepState: StepState.Approved
        });
    });

    it("derives rejected from a rejected current step", () => {
        const review = mapReview(
            createReviewDto({
                state: "rejected",
                currentStepId: "step-2",
                currentStepState: "rejected",
                steps: [
                    createStepDto({ id: "step-1", title: "Draft check", state: "approved" }),
                    createStepDto({ id: "step-2", title: "Editorial check", state: "rejected" })
                ]
            })
        );

        const value = toSystemWorkflow(review);

        expect(value?.reviewState).toBe(ReviewState.Rejected);
        expect(value?.stepState).toBe(StepState.Rejected);
    });

    it("keeps an in-review step as in progress", () => {
        const review = mapReview(
            createReviewDto({
                currentStepId: "step-1",
                currentStepState: "inReview",
                steps: [
                    createStepDto({ id: "step-1", title: "Draft check", state: "inReview" }),
                    createStepDto({ id: "step-2", title: "Editorial check", state: "pending" })
                ]
            })
        );

        expect(toSystemWorkflow(review)).toEqual({
            workflowId: "workflow-1",
            reviewState: ReviewState.InProgress,
            stepId: "step-1",
            stepName: "Draft check",
            stepState: StepState.InReview
        });
    });

    it("takes the first step that is not approved, whatever currentStepId says (server rule)", () => {
        const review = mapReview(createReviewDto({ currentStepId: null, currentStepState: null }));

        expect(toSystemWorkflow(review)).toEqual({
            workflowId: "workflow-1",
            reviewState: ReviewState.InProgress,
            stepId: "step-2",
            stepName: "Editorial check",
            stepState: StepState.Awaiting
        });
    });

    it("skips every approved step before the current one", () => {
        const review = mapReview(
            createReviewDto({
                currentStepId: "step-1",
                steps: [
                    createStepDto({ id: "step-1", title: "One", state: "approved" }),
                    createStepDto({ id: "step-2", title: "Two", state: "approved" }),
                    createStepDto({ id: "step-3", title: "Three", state: "inReview" })
                ]
            })
        );

        expect(toSystemWorkflow(review)?.stepId).toBe("step-3");
    });

    it("returns null for a cancelled review (the target is unlocked)", () => {
        const review = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            currentStepId: null,
            currentStepState: null
        });

        expect(toSystemWorkflow(review)).toBeNull();
    });

    it("returns null for a review without steps", () => {
        const review = createReview({ steps: [], currentStepId: null });

        expect(toSystemWorkflow(review)).toBeNull();
    });
});
