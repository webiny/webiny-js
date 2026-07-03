import { createFeature } from "@webiny/feature/admin";
import { DeleteWorkflowGateway } from "./DeleteWorkflowGateway.js";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

export const DeleteWorkflowFeature = createFeature({
    name: "Workflows/DeleteWorkflow",
    register(container) {
        container.register(DeleteWorkflowGateway).inSingletonScope();
        container.register(DeleteWorkflowUseCase);
    }
});
