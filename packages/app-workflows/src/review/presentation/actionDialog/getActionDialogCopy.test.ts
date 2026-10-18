import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getActionDialogCopy } from "./getActionDialogCopy.js";
import { StepState } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { at } from "~/review/testing/at.js";
import type { ReviewStep } from "~/review/domain/types.js";

const FAILED_AT = at(10, 20);
const SUFFIX = "Restarting runs the step again from the beginning.";
const AI = createActor({ type: "ai" });

const failedStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createStep({
        id: "step-1",
        title: "AI tone check",
        type: "ai",
        state: StepState.Failed,
        owner: AI,
        comment: "Provider unavailable: request timed out after 60 s",
        finishedOn: FAILED_AT,
        ...overrides
    });
};

const restartCopy = (step: ReviewStep) => {
    const review = createReview({ currentStepId: step.id, steps: [step] });
    return getActionDialogCopy({ kind: "restart", review, stepId: step.id, comment: "" });
};

describe("getActionDialogCopy: restart (R266, R264)", () => {
    it("shows the title, the buttons and no comment field", () => {
        const copy = restartCopy(failedStep());

        expect(copy.title).toBe("Restart “AI tone check”?");
        expect(copy.confirmLabel).toBe("Restart");
        expect(copy.cancelLabel).toBe("Cancel");
        expect(copy.showComment).toBe(false);
        expect(copy.showNotify).toBe(false);
        expect(copy.canSubmit).toBe(true);
    });

    it("names the end of the last attempt and the reason", () => {
        expect(restartCopy(failedStep()).body).toBe(
            `Last attempt failed at 10:20: Provider unavailable: request timed out after 60 s. ${SUFFIX}`
        );
    });

    it("uses the list text without a time when the step has no end time", () => {
        const copy = restartCopy(failedStep({ finishedOn: null }));

        expect(copy.body).toBe(
            `Last attempt failed: Provider unavailable: request timed out after 60 s. ${SUFFIX}`
        );
    });

    it("uses the time-only text without a reason (R264)", () => {
        expect(restartCopy(failedStep({ comment: null })).body).toBe(
            `Last attempt failed at 10:20. ${SUFFIX}`
        );
    });

    it("treats a blank reason as none", () => {
        expect(restartCopy(failedStep({ comment: "   " })).body).toBe(
            `Last attempt failed at 10:20. ${SUFFIX}`
        );
    });

    it("uses the derived text with neither a time nor a reason", () => {
        const copy = restartCopy(failedStep({ comment: null, finishedOn: null }));

        expect(copy.body).toBe(`Last attempt failed. ${SUFFIX}`);
    });

    it("trims the reason", () => {
        const copy = restartCopy(failedStep({ comment: "  The webhook returned 503  " }));

        expect(copy.body).toBe(`Last attempt failed at 10:20: The webhook returned 503. ${SUFFIX}`);
    });
});

describe("getActionDialogCopy: cancel (design 4c, frame 23)", () => {
    const cancelBody = (steps: ReviewStep[], currentStepId: string | null): string => {
        const review = createReview({ currentStepId, steps });
        return getActionDialogCopy({ kind: "cancel", review, stepId: null, comment: "" }).body;
    };
    const BASE =
        "Review progress is lost. Editing is unlocked, and a new request starts again from the first step.";

    it("keeps the 8a text for a person's step", () => {
        const step = createStep({
            state: StepState.InReview,
            owner: createActor({ type: "user" })
        });

        expect(cancelBody([step], "step-1")).toBe(BASE);
    });

    it("tells that a running AI step will be stopped", () => {
        const step = failedStep({
            state: StepState.InReview,
            comment: null,
            finishedOn: null
        });

        expect(cancelBody([step], "step-1")).toBe(
            `${BASE} AI tone check is running and will be stopped.`
        );
    });

    it("tells that a running automation will be stopped", () => {
        const step = failedStep({
            title: "Notify web team",
            type: "automation",
            state: StepState.InReview,
            owner: createActor({ type: "automation" })
        });

        expect(cancelBody([step], "step-1")).toBe(
            `${BASE} Notify web team is running and will be stopped.`
        );
    });

    it("keeps the 8a text for a failed step, which is not running", () => {
        expect(cancelBody([failedStep()], "step-1")).toBe(BASE);
    });

    it("keeps the 8a text when the review has no current step", () => {
        expect(cancelBody([failedStep()], null)).toBe(BASE);
    });

    it("looks at the current step only", () => {
        const running = failedStep({
            id: "step-2",
            state: StepState.InReview,
            owner: createActor({ type: "ai" })
        });
        const approved = createStep({ id: "step-1", state: StepState.Approved });

        expect(cancelBody([approved, running], "step-1")).toBe(BASE);
        expect(cancelBody([approved, running], "step-2")).toContain(
            "is running and will be stopped."
        );
    });
});
