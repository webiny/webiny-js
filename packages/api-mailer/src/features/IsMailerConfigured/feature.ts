import { createFeature } from "@webiny/feature/api";
import { IsMailerConfiguredUseCaseImplementation } from "./IsMailerConfiguredUseCase.js";

export const IsMailerConfiguredFeature = createFeature({
    name: "IsMailerConfigured",
    register(container) {
        container.register(IsMailerConfiguredUseCaseImplementation);
    }
});
