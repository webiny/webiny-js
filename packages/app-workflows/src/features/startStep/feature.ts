import { createFeature } from "@webiny/feature/admin";
import { StartStepGateway } from "./StartStepGateway.js";
import { StartStepUseCase } from "./StartStepUseCase.js";

export const StartStepFeature = createFeature({
    name: "Workflows/StartStep",
    register(container) {
        container.register(StartStepGateway).inSingletonScope();
        container.register(StartStepUseCase);
    }
});
