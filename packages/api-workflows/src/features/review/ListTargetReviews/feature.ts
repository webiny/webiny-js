import { createFeature } from "@webiny/feature/api";
import { ListTargetReviewsUseCase } from "./ListTargetReviewsUseCase.js";

export const ListTargetReviewsFeature = createFeature({
    name: "Workflows/ListTargetReviews",
    register(container) {
        container.register(ListTargetReviewsUseCase);
    }
});
