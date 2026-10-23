import { createFeature } from "@webiny/feature/admin";
import { GetWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWorkflowUseCase } from "./GetWorkflowUseCase.js";

export const GetWorkflowFeature = createFeature({
    name: "Workflows/GetWorkflow",
    register(container) {
        container.register(GetWorkflowUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
