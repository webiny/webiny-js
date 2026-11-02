import { createFeature } from "@webiny/feature/admin";
import { CancelReviewsForDeleteUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CancelReviewsForDeleteUseCase } from "./CancelReviewsForDeleteUseCase.js";

export const CancelReviewsForDeleteFeature = createFeature({
    name: "Workflows/CancelReviewsForDelete",
    register(container) {
        container.register(CancelReviewsForDeleteUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
