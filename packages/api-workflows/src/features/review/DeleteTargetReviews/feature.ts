import { createFeature } from "@webiny/feature/api";
import { DefaultAssignmentPageSize } from "./DefaultAssignmentPageSize.js";
import { DeleteTargetReviewsUseCase } from "./DeleteTargetReviewsUseCase.js";

export const DeleteTargetReviewsFeature = createFeature({
    name: "Workflows/DeleteTargetReviews",
    register(container) {
        container.register(DefaultAssignmentPageSize);
        container.register(DeleteTargetReviewsUseCase);
    }
});
