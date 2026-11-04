import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";

/*
 * A step is running when it is in review and its owner is not a person, that is an AI or an
 * automation (R263). There is no separate `running` state on the server. Pure.
 */
export const isStepRunning = (step: ReviewStep): boolean => {
    return step.state === StepState.InReview && step.owner !== null && step.owner.type !== "user";
};
