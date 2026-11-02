import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { getStepStartedAt } from "./getStepStartedAt.js";
import { isStepRunning } from "./isStepRunning.js";

/*
 * The hover text of a step tag (R264): running "{Step} is running since {hh:mm}.", failed
 * "{Step} failed. The requester or an operator can restart it.". `null` for every other step, and
 * for a running step without a usable start time. Pure.
 */
export const getStepTagTooltip = (step: ReviewStep): string | null => {
    if (step.state === StepState.Failed) {
        return `${step.title} failed. The requester or an operator can restart it.`;
    }

    if (!isStepRunning(step)) {
        return null;
    }
    const startedAt = getStepStartedAt(step);
    if (startedAt === null) {
        return null;
    }
    return `${step.title} is running since ${startedAt}.`;
};
