import { createFeature } from "@webiny/feature/admin";
import { ListReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListReviewsUseCase } from "./ListReviewsUseCase.js";

export const ListReviewsFeature = createFeature({
    name: "Workflows/ListReviews",
    register(container) {
        container.register(ListReviewsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
