import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { TargetReviewTag } from "./abstractions.js";

/** The review state tag before the message (QBZ-52). Rejected is dark neutral, never red (Q30). */
export const getReviewStateTag = (state: ReviewStateValue): TargetReviewTag | null => {
    switch (state) {
        case ReviewState.InProgress:
            return { label: "Review: In progress", variant: "accent-light" };
        case ReviewState.Approved:
            return { label: "Review: Approved", variant: "success-light" };
        case ReviewState.Rejected:
            return { label: "Review: Rejected", variant: "neutral-dark" };
        default:
            return null;
    }
};
