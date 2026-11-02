import { createFeature } from "@webiny/feature/api";
import { GetTargetReviewUseCase } from "./GetTargetReviewUseCase.js";

export const GetTargetReviewFeature = createFeature({
    name: "Workflows/GetTargetReview",
    register(container) {
        container.register(GetTargetReviewUseCase);
    }
});
