import { createFeature } from "@webiny/feature/api";
import { GetReviewUseCase } from "./GetReviewUseCase.js";

export const GetReviewFeature = createFeature({
    name: "Workflows/GetReview",
    register(container) {
        container.register(GetReviewUseCase);
    }
});
