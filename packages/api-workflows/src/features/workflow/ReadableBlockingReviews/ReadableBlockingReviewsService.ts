import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";
import {
    MAX_BLOCKING_REVIEW_CHECKS,
    MAX_BLOCKING_REVIEWS,
    ReadableBlockingReviewsService as Abstraction
} from "./abstractions.js";

class ReadableBlockingReviewsServiceImpl implements Abstraction.Interface {
    async filter(
        reviews: Abstraction.Reviews,
        filterReadable: Abstraction.ReadCheck
    ): Abstraction.Return {
        const checked = reviews.slice(0, MAX_BLOCKING_REVIEW_CHECKS);
        if (checked.length === 0) {
            return [];
        }
        let readable: WorkflowBlockingReview[];
        try {
            readable = await filterReadable(checked);
        } catch {
            return [];
        }
        // In the engine's order, whatever order the check answers in.
        const readableIds = new Set(readable.map(review => review.reviewId));
        const ordered = checked.filter(review => readableIds.has(review.reviewId));
        return ordered.slice(0, MAX_BLOCKING_REVIEWS);
    }
}

export const ReadableBlockingReviewsService = Abstraction.createImplementation({
    implementation: ReadableBlockingReviewsServiceImpl,
    dependencies: []
});
