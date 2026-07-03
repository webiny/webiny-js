import { createFeature } from "@webiny/feature/admin";
import { ApproveStepGateway } from "./ApproveStepGateway.js";
import { ApproveStepUseCase } from "./ApproveStepUseCase.js";

export const ApproveStepFeature = createFeature({
    name: "Workflows/ApproveStep",
    register(container) {
        container.register(ApproveStepGateway).inSingletonScope();
        container.register(ApproveStepUseCase);
    }
});
