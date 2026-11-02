import { createFeature } from "@webiny/feature/admin";
import { ApproveReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ApproveReviewStepUseCase } from "./ApproveReviewStepUseCase.js";

export const ApproveReviewStepFeature = createFeature({
    name: "Workflows/ApproveReviewStep",
    register(container) {
        container.register(ApproveReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
