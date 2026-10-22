import { createFeature } from "@webiny/feature/api";
import { ListReviewsByTargetsUseCase } from "./ListReviewsByTargetsUseCase.js";

export const ListReviewsByTargetsFeature = createFeature({
    name: "Workflows/ListReviewsByTargets",
    register(container) {
        container.register(ListReviewsByTargetsUseCase);
    }
});
