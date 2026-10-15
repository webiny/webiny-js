import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import {
    createAiIssue,
    createRequestedReview,
    expectOk,
    requester
} from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    createFailedAutomationReview,
    createPendingAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const EVEN_LATER = "2026-10-09T12:00:00.000Z";

describe("ReviewStep.issues on a new review (R171)", () => {
    it("creates every step with no issues", () => {
        const review = createRequestedReview();

        expect(review.toData().steps.map(step => step.issues)).toEqual([[], []]);
    });

    it("creates an automation step with no issues", () => {
        const review = createPendingAutomationReview();

        expect(review.toData().steps.map(step => step.issues)).toEqual([[], []]);
    });
});

describe("Review.restart resets the issues (R171)", () => {
    it("clears the issues of the restarted step and leaves the other steps alone", () => {
        const failed = createFailedAutomationReview();
        const data = failed.toData();
        data.steps[0].issues = [
            createAiIssue(),
            createAiIssue({ fieldPath: null, severity: "error" })
        ];
        data.steps[1].issues = [createAiIssue({ message: "Untouched." })];
        const review = Review.fromData(data);

        expectOk(review.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER }));

        const steps = review.toData().steps;
        expect(steps[0].state).toBe("pending");
        expect(steps[0].issues).toEqual([]);
        expect(steps[1].issues).toEqual([createAiIssue({ message: "Untouched." })]);
    });

    it("keeps an already empty list empty", () => {
        const review = createFailedAutomationReview();

        expectOk(review.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER }));

        expect(review.toData().steps[0].issues).toEqual([]);
    });
});
