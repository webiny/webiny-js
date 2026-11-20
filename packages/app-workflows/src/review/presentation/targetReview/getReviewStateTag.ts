import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { TargetReviewTag } from "./abstractions.js";
import { REVIEW_STATE_LABELS } from "./reviewStateLabels.js";

// The review state tag of the bar and the details drawer. An open review reads "In review" next to
// its step tag, as designed; a cancelled review has no tag here (the drawer adds its own).
export const getReviewStateTag = (state: ReviewStateValue): TargetReviewTag | null => {
    switch (state) {
        case ReviewState.InProgress:
            return { label: "In review", variant: "warning-light" };
        case ReviewState.Approved:
            return { label: REVIEW_STATE_LABELS[state], variant: "success-light" };
        case ReviewState.Rejected:
            return { label: REVIEW_STATE_LABELS[state], variant: "destructive" };
        default:
            return null;
    }
};
