import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { TargetReviewTag } from "./abstractions.js";

/*
 * The six step states, each visibly distinct (README 1, UI-13). Only `failed` is red (R239, Q24);
 * a rejected step is the dark neutral tag.
 */
export const getStepStateTag = (state: StepStateValue): TargetReviewTag => {
    switch (state) {
        case StepState.Awaiting:
            return { label: "Awaiting", variant: "warning" };
        case StepState.InReview:
            return { label: "In review", variant: "accent-light" };
        case StepState.Approved:
            return { label: "Approved", variant: "success-light" };
        case StepState.Rejected:
            return { label: "Rejected", variant: "neutral-dark" };
        case StepState.Failed:
            return { label: "Failed", variant: "destructive" };
        default:
            return { label: "Pending", variant: "neutral-base-outline" };
    }
};
