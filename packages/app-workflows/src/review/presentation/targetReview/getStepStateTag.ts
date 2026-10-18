import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { TargetReviewTag } from "./abstractions.js";

/*
 * The six step states, each visibly distinct (README 1, UI-13). Only `failed` is red (R239, Q24);
 * a rejected step is the dark neutral tag. A running step (`running` true, R263) is the In review
 * treatment with the label `Running` and the `progress_activity` icon; `running` only matters for
 * the `inReview` state, so the rows of the lists, which do not know the step owner, pass nothing.
 */
export const getStepStateTag = (state: StepStateValue, running = false): TargetReviewTag => {
    switch (state) {
        case StepState.Awaiting:
            return { label: "Awaiting", variant: "warning" };
        case StepState.InReview:
            if (running) {
                return { label: "Running", variant: "accent-light", icon: "progress_activity" };
            }
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
