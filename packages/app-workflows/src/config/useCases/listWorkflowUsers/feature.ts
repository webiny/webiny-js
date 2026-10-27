import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowUsersUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowUsersUseCase } from "./ListWorkflowUsersUseCase.js";

export const ListWorkflowUsersFeature = createFeature({
    name: "Workflows/ListWorkflowUsers",
    register(container) {
        container.register(ListWorkflowUsersUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
