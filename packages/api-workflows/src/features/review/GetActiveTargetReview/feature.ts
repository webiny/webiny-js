import { createFeature } from "@webiny/feature/api";
import { GetActiveTargetReviewUseCase } from "./GetActiveTargetReviewUseCase.js";

export const GetActiveTargetReviewFeature = createFeature({
    name: "Workflows/GetActiveTargetReview",
    register(container) {
        container.register(GetActiveTargetReviewUseCase);
    }
});
