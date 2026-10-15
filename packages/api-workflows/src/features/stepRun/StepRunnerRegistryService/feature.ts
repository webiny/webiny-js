import { createFeature } from "@webiny/feature/api";
import { StepRunnerRegistryService } from "./StepRunnerRegistryService.js";

export const StepRunnerRegistryFeature = createFeature({
    name: "Workflows/StepRunnerRegistry",
    register(container) {
        container.register(StepRunnerRegistryService);
    }
});
