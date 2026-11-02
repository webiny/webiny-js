import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { TargetReviewTag } from "./abstractions.js";
import { REVIEW_STATE_LABELS } from "./reviewStateLabels.js";

// The review state tag before the message (QBZ-52). Rejected is dark neutral, never red (Q30).
export const getReviewStateTag = (state: ReviewStateValue): TargetReviewTag | null => {
    switch (state) {
        case ReviewState.InProgress:
            return { label: `Review: ${REVIEW_STATE_LABELS[state]}`, variant: "accent-light" };
        case ReviewState.Approved:
            return { label: `Review: ${REVIEW_STATE_LABELS[state]}`, variant: "success-light" };
        case ReviewState.Rejected:
            return { label: `Review: ${REVIEW_STATE_LABELS[state]}`, variant: "neutral-dark" };
        default:
            return null;
    }
};
