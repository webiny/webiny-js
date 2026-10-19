import type { BlockingReview } from "~/review/domain/types.js";
import type { ActiveReviewWarningDialogParams } from "./ActiveReviewGuard/abstractions.js";
import type { ActiveReviewWarningInitParams } from "./ActiveReviewWarningPresenter/abstractions.js";

// Copy: the title is confirmed (Q20, R205); the busy label is the ConfirmationDialog default.
export const ACTIVE_REVIEW_WARNING_TITLE = "Review in progress";
export const ACTIVE_REVIEW_WARNING_BUSY_LABEL = "Processing...";
const TRASH_BODY = "This content has a review in progress. Trashing it cancels the review.";
const DELETE_BODY = "This content has a review in progress. Deleting it cancels the review.";

function formatReview(review: BlockingReview): string {
    const position = `Step ${review.stepPosition} of ${review.stepCount}`;
    const step = review.stepName ? ` (${review.stepName})` : "";
    return `${review.title} · ${position}${step}`;
}

/*
 * The render-ready texts of the warning dialog (R205, D134): the title, the body for the action
 * and one line per blocking review. Pure.
 */
export const buildActiveReviewWarning = (
    input: ActiveReviewWarningDialogParams
): ActiveReviewWarningInitParams => {
    const body = input.action === "trash" ? TRASH_BODY : DELETE_BODY;
    const reviews = input.reviews.map(formatReview);

    return { title: ACTIVE_REVIEW_WARNING_TITLE, body, reviews };
};
