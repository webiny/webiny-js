import type { Review } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { TargetReviewKind } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";

/*
 * The review's kind for the editor rules, tags and app glue (they switch on `status` and
 * `reviewKind`, never on label text). Everything that is not an active review is "none";
 * a cancelled review is "none" (D75). Pure.
 */
export const getReviewKind = (
    status: TargetReviewStatus,
    review: Review | null
): TargetReviewKind => {
    if (status !== "active" || review === null) {
        return "none";
    }
    if (review.state === ReviewState.Approved) {
        return "approved";
    }
    if (review.state === ReviewState.Rejected) {
        return "rejected";
    }
    if (review.state === ReviewState.InProgress) {
        return "inProgress";
    }
    return "none";
};
