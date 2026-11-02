import { createFeature } from "@webiny/feature/admin";
import { RestartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RestartReviewStepUseCase } from "./RestartReviewStepUseCase.js";

export const RestartReviewStepFeature = createFeature({
    name: "Workflows/RestartReviewStep",
    register(container) {
        container.register(RestartReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
