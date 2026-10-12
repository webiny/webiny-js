import { createFeature } from "@webiny/feature/api";
import { ReadableBlockingReviewsService } from "./ReadableBlockingReviewsService.js";

export const ReadableBlockingReviewsFeature = createFeature({
    name: "Workflows/ReadableBlockingReviews",
    register(container) {
        container.register(ReadableBlockingReviewsService);
    }
});
