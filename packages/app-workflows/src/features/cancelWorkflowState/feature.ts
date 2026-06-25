import { createFeature } from "@webiny/feature/admin";
import { CancelWorkflowStateGateway } from "./CancelWorkflowStateGateway.js";
import { CancelWorkflowStateUseCase } from "./CancelWorkflowStateUseCase.js";

export const CancelWorkflowStateFeature = createFeature({
    name: "Workflows/CancelWorkflowState",
    register(container) {
        container.register(CancelWorkflowStateGateway).inSingletonScope();
        container.register(CancelWorkflowStateUseCase);
    }
});
