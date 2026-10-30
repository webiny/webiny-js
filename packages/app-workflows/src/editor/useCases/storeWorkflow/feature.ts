import { createFeature } from "@webiny/feature/admin";
import { StoreWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

export const StoreWorkflowFeature = createFeature({
    name: "Workflows/StoreWorkflow",
    register(container) {
        container.register(StoreWorkflowUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
