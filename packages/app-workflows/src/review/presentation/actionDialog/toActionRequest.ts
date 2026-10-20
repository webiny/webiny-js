import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

// The bar's open action as a dialog request; "request" has its own dialog (Task 17).
export const toActionRequest = (
    openAction: TargetReviewOpenAction | null,
    reviewId: string | null
): ReviewActionRequest | null => {
    if (openAction === null || reviewId === null || openAction.kind === "request") {
        return null;
    }
    return { kind: openAction.kind, reviewId, stepId: openAction.stepId };
};
