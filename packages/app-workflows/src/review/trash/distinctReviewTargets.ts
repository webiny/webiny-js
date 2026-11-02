import type { BlockingReview } from "~/review/domain/types.js";

/*
 * The first review of every distinct (`model`, `targetId`), in order. The cancel-for-delete call
 * works per target, so one call is made per entry in this list (R205). Pure.
 */
export const distinctReviewTargets = (reviews: BlockingReview[]): BlockingReview[] => {
    const seen = new Set<string>();
    const targets: BlockingReview[] = [];

    for (const review of reviews) {
        const key = `${review.model}::${review.targetId}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        targets.push(review);
    }

    return targets;
};
