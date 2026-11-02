import { createFeature } from "@webiny/feature/admin";
import { ListBlockingReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListBlockingReviewsUseCase } from "./ListBlockingReviewsUseCase.js";

export const ListBlockingReviewsFeature = createFeature({
    name: "Workflows/ListBlockingReviews",
    register(container) {
        container.register(ListBlockingReviewsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
