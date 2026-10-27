import { createFeature } from "@webiny/feature/admin";
import { TakeOverReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TakeOverReviewStepUseCase } from "./TakeOverReviewStepUseCase.js";

export const TakeOverReviewStepFeature = createFeature({
    name: "Workflows/TakeOverReviewStep",
    register(container) {
        container.register(TakeOverReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
