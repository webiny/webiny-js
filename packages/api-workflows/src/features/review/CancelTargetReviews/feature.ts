import { createFeature } from "@webiny/feature/api";
import { CancelTargetReviewsUseCase } from "./CancelTargetReviewsUseCase.js";

export const CancelTargetReviewsFeature = createFeature({
    name: "Workflows/CancelTargetReviews",
    register(container) {
        container.register(CancelTargetReviewsUseCase);
    }
});
