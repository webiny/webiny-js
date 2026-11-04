import { createFeature } from "@webiny/feature/api";
import { StepRunReachService } from "./StepRunReachService.js";

export const StepRunReachServiceFeature = createFeature({
    name: "Workflows/StepRunReachService",
    register(container) {
        container.register(StepRunReachService);
    }
});
