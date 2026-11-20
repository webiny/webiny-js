import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { TargetReviewTag } from "./abstractions.js";

/*
 * The six step states, each visibly distinct (README 1, UI-13). A failed step is the light
 * destructive tag (R239, Q24); a rejected step is the red tag the rejected review uses. A running
 * step (`running` true, R263) is the In review treatment with the label `Running` and the
 * `progress_activity` icon, and a failed step keeps the `sync_problem` icon (R263); `running` only
 * matters for the `inReview` state, so the rows of the lists, which do not know the step owner, pass nothing.
 */
export const getStepStateTag = (state: StepStateValue, running = false): TargetReviewTag => {
    switch (state) {
        case StepState.Awaiting:
            return { label: "Awaiting", variant: "warning-light", icon: "hourglass_empty" };
        case StepState.InReview:
            if (running) {
                return { label: "Running", variant: "accent-light", icon: "progress_activity" };
            }
            return { label: "In review", variant: "accent-light", icon: "rate_review" };
        case StepState.Approved:
            return { label: "Approved", variant: "success-light" };
        case StepState.Rejected:
            return { label: "Rejected", variant: "destructive" };
        case StepState.Failed:
            return { label: "Failed", variant: "destructive-light", icon: "sync_problem" };
        default:
            return { label: "Pending", variant: "neutral-base-outline" };
    }
};
