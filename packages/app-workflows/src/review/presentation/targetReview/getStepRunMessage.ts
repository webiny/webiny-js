import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { getStepStartedAt } from "./getStepStartedAt.js";
import { isStepRunning } from "./isStepRunning.js";

/*
 * What the bar and the progress popover say about a running or failed step (R263, R264):
 * "{Step} running since {hh:mm}", "{Step} failed: {reason}" and, without a reason, "{Step} failed."
 * (`reason` is the step comment). `null` for every other step, and for a running step without a
 * usable start time. Pure.
 */
export const getStepRunMessage = (step: ReviewStep): string | null => {
    if (step.state === StepState.Failed) {
        const reason = step.comment ? step.comment.trim() : "";
        if (reason === "") {
            return `${step.title} failed.`;
        }
        return `${step.title} failed: ${reason}`;
    }

    if (!isStepRunning(step)) {
        return null;
    }
    const startedAt = getStepStartedAt(step);
    if (startedAt === null) {
        return null;
    }
    return `${step.title} running since ${startedAt}`;
};
