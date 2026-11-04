import { createFeature } from "@webiny/feature/api";
import { ListWorkflowTeamsUseCase } from "./ListWorkflowTeamsUseCase.js";

export const ListWorkflowTeamsFeature = createFeature({
    name: "Workflows/ListWorkflowTeams",
    register(container) {
        container.register(ListWorkflowTeamsUseCase);
    }
});
