import { createFeature } from "@webiny/feature/api";
import { CancelReviewUseCase } from "./CancelReviewUseCase.js";

export const CancelReviewFeature = createFeature({
    name: "Workflows/CancelReview",
    register(container) {
        container.register(CancelReviewUseCase);
    }
});
