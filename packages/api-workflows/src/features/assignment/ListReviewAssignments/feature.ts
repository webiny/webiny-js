import { createFeature } from "@webiny/feature/api";
import { ListReviewAssignmentsUseCase } from "./ListReviewAssignmentsUseCase.js";

export const ListReviewAssignmentsFeature = createFeature({
    name: "Workflows/ListReviewAssignments",
    register(container) {
        container.register(ListReviewAssignmentsUseCase);
    }
});
