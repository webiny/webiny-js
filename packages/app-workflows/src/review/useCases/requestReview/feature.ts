import { createFeature } from "@webiny/feature/admin";
import { RequestReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RequestReviewUseCase } from "./RequestReviewUseCase.js";

export const RequestReviewFeature = createFeature({
    name: "Workflows/RequestReview",
    register(container) {
        container.register(RequestReviewUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
