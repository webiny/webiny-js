import type { Review } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { isStepRunning } from "./isStepRunning.js";

/*
 * The step that was running (an AI or automation owner, `inReview`) in the previous load and is
 * present in the next load but not `inReview` any more: it finished, failed or was rejected, so
 * the content may have changed (R262). Returns the step as it was in the previous load, or `null`.
 * The first load has no previous review. Pure.
 */
export const getFinishedAutomatedStep = (
    previous: Review | null,
    next: Review | null
): ReviewStep | null => {
    if (previous === null || next === null) {
        return null;
    }

    for (const step of previous.steps) {
        if (!isStepRunning(step)) {
            continue;
        }
        const current = next.steps.find(candidate => candidate.id === step.id);
        if (current !== undefined && current.state !== StepState.InReview) {
            return step;
        }
    }
    return null;
};
