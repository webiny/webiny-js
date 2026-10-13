import { createFeature } from "@webiny/feature/api";
import { DefaultReviewListLimits } from "./DefaultReviewListLimits.js";
import { ListReviewsUseCase } from "./ListReviewsUseCase.js";

export const ListReviewsFeature = createFeature({
    name: "Workflows/ListReviews",
    register(container) {
        container.register(DefaultReviewListLimits);
        container.register(ListReviewsUseCase);
    }
});
