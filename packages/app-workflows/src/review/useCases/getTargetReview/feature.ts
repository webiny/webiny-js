import { createFeature } from "@webiny/feature/admin";
import { GetTargetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTargetReviewUseCase } from "./GetTargetReviewUseCase.js";

export const GetTargetReviewFeature = createFeature({
    name: "Workflows/GetTargetReview",
    register(container) {
        container.register(GetTargetReviewUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
