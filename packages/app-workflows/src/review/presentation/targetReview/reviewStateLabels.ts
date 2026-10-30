import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";

// The one name of every review state, shared by the state tag and the details drawer.
export const REVIEW_STATE_LABELS: Record<ReviewStateValue, string> = {
    [ReviewState.InProgress]: "In progress",
    [ReviewState.Approved]: "Approved",
    [ReviewState.Rejected]: "Rejected",
    [ReviewState.Cancelled]: "Cancelled"
};
