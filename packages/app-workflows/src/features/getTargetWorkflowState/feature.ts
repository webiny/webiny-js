import { createFeature } from "@webiny/feature/admin";
import { GetTargetWorkflowStateGateway } from "./GetTargetWorkflowStateGateway.js";
import { GetTargetWorkflowStateUseCase } from "./GetTargetWorkflowStateUseCase.js";

export const GetTargetWorkflowStateFeature = createFeature({
    name: "Workflows/GetTargetWorkflowState",
    register(container) {
        container.register(GetTargetWorkflowStateGateway).inSingletonScope();
        container.register(GetTargetWorkflowStateUseCase);
    }
});
