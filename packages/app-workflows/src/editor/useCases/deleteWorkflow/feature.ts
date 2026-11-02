import { createFeature } from "@webiny/feature/admin";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

export const DeleteWorkflowFeature = createFeature({
    name: "Workflows/DeleteWorkflow",
    register(container) {
        container.register(DeleteWorkflowUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
