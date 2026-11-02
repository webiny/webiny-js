import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

/*
 * The bar's open action as a dialog request; "request" has its own dialog (Task 17). The review
 * id is the one the action was opened on, not the live one, so a refresh keeps the dialog.
 */
export const toActionRequest = (
    openAction: TargetReviewOpenAction | null
): ReviewActionRequest | null => {
    if (openAction === null || openAction.reviewId === null || openAction.kind === "request") {
        return null;
    }
    return {
        kind: openAction.kind,
        reviewId: openAction.reviewId,
        stepId: openAction.stepId,
        context: "editor"
    };
};
