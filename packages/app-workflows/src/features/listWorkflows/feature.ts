import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowsGateway } from "./ListWorkflowsGateway.js";
import { ListWorkflowsUseCase } from "./ListWorkflowsUseCase.js";

export const ListWorkflowsFeature = createFeature({
    name: "Workflows/ListWorkflows",
    register(container) {
        container.register(ListWorkflowsGateway).inSingletonScope();
        container.register(ListWorkflowsUseCase);
    }
});
