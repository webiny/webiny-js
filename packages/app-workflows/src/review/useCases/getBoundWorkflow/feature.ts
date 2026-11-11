import { createFeature } from "@webiny/feature/admin";
import { GetBoundWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetBoundWorkflowUseCase } from "./GetBoundWorkflowUseCase.js";

export const GetBoundWorkflowFeature = createFeature({
    name: "Workflows/GetBoundWorkflow",
    register(container) {
        container.register(GetBoundWorkflowUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
