import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";

export const CHECKING = "Checking review status…";
export const FAILED_REASON =
    "The review status could not be loaded. Try again from the review bar.";
export const NEEDS_REVIEW = "Publishing needs an approved review. Request a review first.";
export const REJECTED_REASON =
    "This revision was rejected. Create a new revision, then request a new review.";
export const IN_REVIEW_REASON =
    "This revision is in review. Publishing is allowed once every step approves.";
export const NO_MOVE = "Can’t move while this revision is in review.";

type Rules = Partial<TargetReviewPresenter.ViewModel>;

// A model without a workflow: nothing is shown and nothing is gated.
export const NO_WORKFLOW: Rules = {
    status: "noWorkflow",
    allowsEditing: true,
    allowsPublishing: true,
    publishDisabledReason: null,
    moveDisabledReason: null
};

// A workflow is bound but there is no active review: editing is free, publishing needs a review.
export const BOUND_NO_REVIEW: Rules = {
    status: "none",
    allowsEditing: true,
    allowsPublishing: false,
    publishDisabledReason: NEEDS_REVIEW,
    moveDisabledReason: null
};

/*
 * An unpublished revision with no review: it was reviewed before it was published, so it can be
 * published again (R226, Q19).
 */
export const BOUND_UNPUBLISHED: Rules = {
    status: "none",
    allowsEditing: true,
    allowsPublishing: true,
    publishDisabledReason: null,
    moveDisabledReason: null
};

export const LOADING: Rules = {
    status: "loading",
    allowsEditing: false,
    allowsPublishing: false,
    publishDisabledReason: CHECKING,
    moveDisabledReason: CHECKING
};

export const FAILED: Rules = {
    status: "failed",
    allowsEditing: false,
    allowsPublishing: false,
    publishDisabledReason: FAILED_REASON,
    moveDisabledReason: FAILED_REASON
};

export const IN_REVIEW: Rules = {
    status: "active",
    allowsEditing: false,
    allowsPublishing: false,
    publishDisabledReason: IN_REVIEW_REASON,
    moveDisabledReason: NO_MOVE
};

export const REJECTED: Rules = {
    status: "active",
    allowsEditing: false,
    allowsPublishing: false,
    publishDisabledReason: REJECTED_REASON,
    moveDisabledReason: null
};

export const APPROVED: Rules = {
    status: "active",
    allowsEditing: false,
    allowsPublishing: true,
    publishDisabledReason: null,
    moveDisabledReason: null
};
