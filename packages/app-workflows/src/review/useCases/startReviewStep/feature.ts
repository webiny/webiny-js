import { createFeature } from "@webiny/feature/admin";
import { StartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { StartReviewStepUseCase } from "./StartReviewStepUseCase.js";

export const StartReviewStepFeature = createFeature({
    name: "Workflows/StartReviewStep",
    register(container) {
        container.register(StartReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
