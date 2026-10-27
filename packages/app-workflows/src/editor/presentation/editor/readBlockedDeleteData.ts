import { isRecord } from "~/editor/model/isRecord.js";
import type { BlockingReview } from "~/review/domain/types.js";

export interface BlockedDeleteData {
    count: number;
    reviews: BlockingReview[];
}

function readReview(value: unknown): BlockingReview | null {
    if (!isRecord(value)) {
        return null;
    }
    const {
        reviewId,
        model,
        targetId,
        targetRevisionId,
        title,
        stepPosition,
        stepCount,
        stepName
    } = value;
    if (
        typeof reviewId !== "string" ||
        typeof model !== "string" ||
        typeof targetId !== "string" ||
        typeof targetRevisionId !== "string" ||
        typeof title !== "string" ||
        typeof stepPosition !== "number" ||
        typeof stepCount !== "number" ||
        typeof stepName !== "string"
    ) {
        return null;
    }
    return {
        reviewId,
        model,
        targetId,
        targetRevisionId,
        title,
        stepPosition,
        stepCount,
        stepName
    };
}

/*
 * The data of a `Workflows/Workflow/HasActiveReviews` error: the exact count and up to five
 * readable reviews (R278). Reads defensively; an entry that is not a review is skipped, and a
 * missing count falls back to the number of reviews.
 */
export const readBlockedDeleteData = (data: unknown): BlockedDeleteData => {
    if (!isRecord(data)) {
        return { count: 0, reviews: [] };
    }
    const entries = Array.isArray(data.reviews) ? data.reviews : [];
    const reviews: BlockingReview[] = [];
    for (const entry of entries) {
        const review = readReview(entry);
        if (review !== null) {
            reviews.push(review);
        }
    }
    const count = typeof data.count === "number" ? data.count : reviews.length;

    return { count, reviews };
};
