import { createFeature } from "@webiny/feature/admin";
import { TakeOverStepGateway } from "./TakeOverStepGateway.js";
import { TakeOverStepUseCase } from "./TakeOverStepUseCase.js";

export const TakeOverStepFeature = createFeature({
    name: "Workflows/TakeOverStep",
    register(container) {
        container.register(TakeOverStepGateway).inSingletonScope();
        container.register(TakeOverStepUseCase);
    }
});
