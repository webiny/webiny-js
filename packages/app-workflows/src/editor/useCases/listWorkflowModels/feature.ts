import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowModelsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowModelsUseCase } from "./ListWorkflowModelsUseCase.js";

export const ListWorkflowModelsFeature = createFeature({
    name: "Workflows/ListWorkflowModels",
    register(container) {
        container.register(ListWorkflowModelsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
