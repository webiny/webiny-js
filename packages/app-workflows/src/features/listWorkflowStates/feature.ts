import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowStatesGateway } from "./ListWorkflowStatesGateway.js";
import { ListWorkflowStatesUseCase } from "./ListWorkflowStatesUseCase.js";

export const ListWorkflowStatesFeature = createFeature({
    name: "Workflows/ListWorkflowStates",
    register(container) {
        container.register(ListWorkflowStatesGateway).inSingletonScope();
        container.register(ListWorkflowStatesUseCase);
    }
});
