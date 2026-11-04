import { createFeature } from "@webiny/feature/admin";
import { GetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetReviewUseCase } from "./GetReviewUseCase.js";

export const GetReviewFeature = createFeature({
    name: "Workflows/GetReview",
    register(container) {
        container.register(GetReviewUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
