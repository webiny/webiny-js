import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { at } from "./at.js";
import { createActor } from "./createActor.js";
import { createStep } from "./createStep.js";

export const AI_ACTOR = createActor({ type: "ai", id: "ai-1", displayName: "gpt-model-9" });

export const AUTOMATION_ACTOR = createActor({
    type: "automation",
    id: "auto-1",
    displayName: "Send webhook"
});

// An AI step "AI tone check" that is running since 14:20.
export const createRunningAiStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createStep({
        id: "step-1",
        title: "AI tone check",
        type: "ai",
        state: StepState.InReview,
        owner: AI_ACTOR,
        reachedOn: at(14, 19),
        startedOn: at(14, 20),
        ...overrides
    });
};

// An automation step "Notify web team" that is running since 14:20.
export const createRunningAutomationStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createStep({
        id: "step-1",
        title: "Notify web team",
        type: "automation",
        state: StepState.InReview,
        owner: AUTOMATION_ACTOR,
        reachedOn: at(14, 19),
        startedOn: at(14, 20),
        ...overrides
    });
};

// The automation step above, failed at 14:25 with its reason in the comment.
export const createFailedAutomationStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return createRunningAutomationStep({
        state: StepState.Failed,
        finishedOn: at(14, 25),
        comment: "Webhook returned 503 Service Unavailable",
        ...overrides
    });
};
