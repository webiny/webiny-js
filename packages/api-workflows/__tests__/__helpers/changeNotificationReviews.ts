import type { ReviewData } from "~/domain/review/types.js";
import { reviewer } from "./fixtures.js";
import { createNotificationReview } from "./notificationReviews.js";

/**
 * The review of the change handler tests: "Article 1" requested by Rita Requester, its current
 * step "legal" `inReview` and owned by `currentOwnerId` (default Rob Reviewer, `null` for an
 * AI or automation owner, whose id is never stored in `currentOwnerId`). The fixture does not run
 * `prepareForSave`, so the three `current*` fields are set here, as a saved review has them. A
 * fresh copy on every call: tests may change it.
 */
export const createChangeReview = (currentOwnerId: string | null = reviewer.id): ReviewData => {
    const review = createNotificationReview();
    review.currentStepId = "legal";
    review.currentStepState = "inReview";
    review.currentOwnerId = currentOwnerId;
    return review;
};
