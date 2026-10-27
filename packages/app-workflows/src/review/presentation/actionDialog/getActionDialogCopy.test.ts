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
    return getActionDialogCopy({
        kind: "restart",
        review,
        stepId: step.id,
        comment: "",
        context: "editor",
        touched: false
    });
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

    it("strips one trailing period of the reason before the sentence break", () => {
        const withTime = restartCopy(failedStep({ comment: "The automation failed." }));
        const withoutTime = restartCopy(
            failedStep({ comment: "The automation failed.", finishedOn: null })
        );

        expect(withTime.body).toBe(
            `Last attempt failed at 10:20: The automation failed. ${SUFFIX}`
        );
        expect(withoutTime.body).toBe(`Last attempt failed: The automation failed. ${SUFFIX}`);
    });

    it("leaves a reason without a trailing period unchanged", () => {
        const copy = restartCopy(failedStep({ comment: "The automation failed" }));

        expect(copy.body).toBe(`Last attempt failed at 10:20: The automation failed. ${SUFFIX}`);
    });

    it("trims the reason", () => {
        const copy = restartCopy(failedStep({ comment: "  The webhook returned 503  " }));

        expect(copy.body).toBe(`Last attempt failed at 10:20: The webhook returned 503. ${SUFFIX}`);
    });
});

describe("getActionDialogCopy: cancel (design 4c, frame 23)", () => {
    const cancelBody = (steps: ReviewStep[], currentStepId: string | null): string => {
        const review = createReview({ currentStepId, steps });
        return getActionDialogCopy({
            kind: "cancel",
            review,
            stepId: null,
            comment: "",
            context: "editor",
            touched: false
        }).body;
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

describe("getActionDialogCopy: confirm button variant (C5)", () => {
    it.each([
        ["reject", "destructive"],
        ["cancel", "destructive"],
        ["approve", "primary"],
        ["start", "primary"],
        ["takeOver", "primary"],
        ["restart", "primary"]
    ] as const)("uses the %s confirm as %s", (kind, variant) => {
        const step = createStep({ id: "step-1", title: "Legal sign-off" });
        const review = createReview({ currentStepId: step.id, steps: [step] });
        const copy = getActionDialogCopy({
            kind,
            review,
            stepId: step.id,
            comment: "",
            context: "editor",
            touched: false
        });

        expect(copy.confirmVariant).toBe(variant);
    });
});

describe("getActionDialogCopy: comment hints and reject validation (AD1, AD2)", () => {
    const copyOf = (kind: "approve" | "reject", comment: string, touched: boolean) => {
        const step = createStep({ id: "step-1", title: "Legal sign-off" });
        const review = createReview({ currentStepId: step.id, steps: [step] });
        return getActionDialogCopy({
            kind,
            review,
            stepId: step.id,
            comment,
            context: "editor",
            touched
        });
    };

    it("shows the approve placeholder and note, optional", () => {
        const copy = copyOf("approve", "", false);

        expect(copy.commentLabel).toBe("Comment");
        expect(copy.commentRequired).toBe(false);
        expect(copy.commentPlaceholder).toBe("Anything the requester or next reviewer should know");
        expect(copy.commentNote).toBe("Visible to the requester and in review details.");
        expect(copy.commentCounter).toBeNull();
    });

    it("shows the reject hint and counter without an error before the first edit", () => {
        const copy = copyOf("reject", "abc", false);

        expect(copy.commentLabel).toBe("Comment");
        expect(copy.commentRequired).toBe(true);
        expect(copy.commentPlaceholder).toBe("Explain what needs to change");
        expect(copy.commentNote).toBe("Required. The requester sees this.");
        expect(copy.commentCounter).toBe("3 / 10 min.");
        expect(copy.commentError).toBeNull();
    });

    it("turns the reject hint into an error after the first edit", () => {
        const copy = copyOf("reject", "12345678", true);

        expect(copy.commentError).toBe("Write at least 10 characters.");
        expect(copy.commentCounter).toBe("8 / 10 min.");
        expect(copy.commentNote).toBeNull();
    });

    it("shows no error once the reject comment is long enough", () => {
        const copy = copyOf("reject", "1234567890", true);

        expect(copy.commentError).toBeNull();
        expect(copy.commentNote).toBe("Required. The requester sees this.");
        expect(copy.canSubmit).toBe(true);
    });
});

describe("getActionDialogCopy: list and editor wording (AD3, AD4)", () => {
    const ivan = createActor({ id: "user-9", type: "user", displayName: "Ivan Horvat" });
    const bodyOf = (kind: "start" | "takeOver", context: "list" | "editor"): string => {
        const step = createStep({
            id: "step-1",
            title: "Editorial check",
            state: StepState.InReview,
            owner: ivan
        });
        const review = createReview({
            title: "Summer launch",
            currentStepId: step.id,
            steps: [step]
        });
        return getActionDialogCopy({
            kind,
            review,
            stepId: step.id,
            comment: "",
            context,
            touched: false
        }).body;
    };

    it("names the review in the list start text only", () => {
        expect(bodyOf("start", "list")).toBe(
            "You become the owner of this step on “Summer launch” and it leaves the team pool."
        );
        expect(bodyOf("start", "editor")).toBe(
            "You become the owner of this step and it leaves the team pool."
        );
    });

    it("words the take over text for the list and the editor", () => {
        expect(bodyOf("takeOver", "list")).toBe(
            "Ivan Horvat is reviewing “Editorial check” on “Summer launch”. If you take over, you become the owner."
        );
        expect(bodyOf("takeOver", "editor")).toBe(
            "Ivan Horvat is reviewing “Editorial check”. If you take over, you become the owner and Ivan can no longer approve or reject it."
        );
    });

    it("names the review in the list cancel text, with the running suffix", () => {
        const idle = createStep({ id: "step-1", state: StepState.InReview });
        const running = failedStep({ id: "step-1", state: StepState.InReview, comment: null });
        const cancel = (step: ReviewStep, context: "list" | "editor") =>
            getActionDialogCopy({
                kind: "cancel",
                review: createReview({
                    title: "Summer launch",
                    currentStepId: step.id,
                    steps: [step]
                }),
                stepId: null,
                comment: "",
                context,
                touched: false
            }).body;
        const LIST =
            "“Summer launch”: review progress is lost. Editing is unlocked, and a new request starts again from the first step.";

        expect(cancel(idle, "list")).toBe(LIST);
        expect(cancel(running, "list")).toBe(
            `${LIST} AI tone check is running and will be stopped.`
        );
        expect(cancel(idle, "editor")).toBe(
            "Review progress is lost. Editing is unlocked, and a new request starts again from the first step."
        );
    });
});
