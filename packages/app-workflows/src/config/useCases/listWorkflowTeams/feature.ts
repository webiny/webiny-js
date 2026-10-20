import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowTeamsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowTeamsUseCase } from "./ListWorkflowTeamsUseCase.js";

export const ListWorkflowTeamsFeature = createFeature({
    name: "Workflows/ListWorkflowTeams",
    register(container) {
        container.register(ListWorkflowTeamsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
