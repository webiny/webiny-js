import { createFeature } from "@webiny/feature/admin";
import { RejectStepGateway } from "./RejectStepGateway.js";
import { RejectStepUseCase } from "./RejectStepUseCase.js";

export const RejectStepFeature = createFeature({
    name: "Workflows/RejectStep",
    register(container) {
        container.register(RejectStepGateway).inSingletonScope();
        container.register(RejectStepUseCase);
    }
});
