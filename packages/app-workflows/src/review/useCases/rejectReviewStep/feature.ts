import { createFeature } from "@webiny/feature/admin";
import { RejectReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RejectReviewStepUseCase } from "./RejectReviewStepUseCase.js";

export const RejectReviewStepFeature = createFeature({
    name: "Workflows/RejectReviewStep",
    register(container) {
        container.register(RejectReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
