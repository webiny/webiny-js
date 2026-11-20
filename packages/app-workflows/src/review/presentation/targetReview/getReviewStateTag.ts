import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { TargetReviewTag } from "./abstractions.js";
import { REVIEW_STATE_LABELS } from "./reviewStateLabels.js";

// The review state tag, shown on a finished review only: an open review shows its step tag instead.
export const getReviewStateTag = (state: ReviewStateValue): TargetReviewTag | null => {
    switch (state) {
        case ReviewState.Approved:
            return { label: REVIEW_STATE_LABELS[state], variant: "success-light" };
        case ReviewState.Rejected:
            return { label: REVIEW_STATE_LABELS[state], variant: "destructive" };
        default:
            return null;
    }
};
