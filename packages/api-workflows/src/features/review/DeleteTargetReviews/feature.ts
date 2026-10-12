import { createFeature } from "@webiny/feature/api";
import { DeleteTargetReviewsUseCase } from "./DeleteTargetReviewsUseCase.js";

export const DeleteTargetReviewsFeature = createFeature({
    name: "Workflows/DeleteTargetReviews",
    register(container) {
        container.register(DeleteTargetReviewsUseCase);
    }
});
