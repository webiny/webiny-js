import { createFeature } from "@webiny/feature/api";
import { RequestReviewUseCase } from "./RequestReviewUseCase.js";

export const RequestReviewFeature = createFeature({
    name: "Workflows/RequestReview",
    register(container) {
        container.register(RequestReviewUseCase);
    }
});
