import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";

/*
 * The step the drawer opens by default: the one in review or awaiting its owner, else the step
 * that stopped the review (rejected or failed), else the last approved one. `null` before any
 * step was reached. A problem is never collapsed away: the stopping step is always the open one.
 */
export const getExpandedStepId = (steps: ReviewStep[]): string | null => {
    const active = steps.find(
        step => step.state === StepState.InReview || step.state === StepState.Awaiting
    );
    if (active) {
        return active.id;
    }
    const stopped = steps.find(
        step => step.state === StepState.Rejected || step.state === StepState.Failed
    );
    if (stopped) {
        return stopped.id;
    }
    const approved = steps.filter(step => step.state === StepState.Approved);
    if (approved.length > 0) {
        return approved[approved.length - 1].id;
    }
    return null;
};
