import { createFeature } from "@webiny/feature/api";
import { ListWorkflowUsersUseCase } from "./ListWorkflowUsersUseCase.js";

export const ListWorkflowUsersFeature = createFeature({
    name: "Workflows/ListWorkflowUsers",
    register(container) {
        container.register(ListWorkflowUsersUseCase);
    }
});
