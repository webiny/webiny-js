import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";
import {
    MAX_BLOCKING_REVIEW_CHECKS,
    MAX_BLOCKING_REVIEWS,
    ReadableBlockingReviewsService as Abstraction
} from "./abstractions.js";

class ReadableBlockingReviewsServiceImpl implements Abstraction.Interface {
    async filter(reviews: Abstraction.Reviews, canRead: Abstraction.ReadCheck): Abstraction.Return {
        const readable: WorkflowBlockingReview[] = [];
        for (const review of reviews.slice(0, MAX_BLOCKING_REVIEW_CHECKS)) {
            if (readable.length === MAX_BLOCKING_REVIEWS) {
                break;
            }
            let allowed = false;
            try {
                allowed = await canRead(review);
            } catch {
                allowed = false;
            }
            if (allowed) {
                readable.push(review);
            }
        }
        return readable;
    }
}

export const ReadableBlockingReviewsService = Abstraction.createImplementation({
    implementation: ReadableBlockingReviewsServiceImpl,
    dependencies: []
});
