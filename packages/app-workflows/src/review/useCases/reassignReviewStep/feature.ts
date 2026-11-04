import { createFeature } from "@webiny/feature/admin";
import { ReassignReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ReassignReviewStepUseCase } from "./ReassignReviewStepUseCase.js";

export const ReassignReviewStepFeature = createFeature({
    name: "Workflows/ReassignReviewStep",
    register(container) {
        container.register(ReassignReviewStepUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
