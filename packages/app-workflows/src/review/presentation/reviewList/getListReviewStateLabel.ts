import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";

const LABELS: Record<ReviewStateValue, string> = {
    [ReviewState.InProgress]: "In progress",
    [ReviewState.Approved]: "Approved",
    [ReviewState.Rejected]: "Rejected",
    [ReviewState.Cancelled]: "Cancelled"
};

export const getListReviewStateLabel = (state: ReviewStateValue): string => {
    return LABELS[state];
};
