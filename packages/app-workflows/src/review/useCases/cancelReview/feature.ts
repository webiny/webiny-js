import { createFeature } from "@webiny/feature/admin";
import { CancelReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CancelReviewUseCase } from "./CancelReviewUseCase.js";

export const CancelReviewFeature = createFeature({
    name: "Workflows/CancelReview",
    register(container) {
        container.register(CancelReviewUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
