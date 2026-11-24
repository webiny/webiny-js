import type { ReviewListState } from "~/review/domain/ReviewListState.js";

export interface ReviewListStateOption {
    value: ReviewListState;
    label: string;
}

// Every review state of the list in design order (B2 design 1).
export const REVIEW_LIST_STATES: ReviewListStateOption[] = [
    { value: "all", label: "All" },
    { value: "inReview", label: "In review" },
    { value: "failed", label: "Failed" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" }
];
