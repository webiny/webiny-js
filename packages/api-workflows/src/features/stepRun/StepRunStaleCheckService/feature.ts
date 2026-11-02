import { createFeature } from "@webiny/feature/api";
import { StepRunStaleCheckService } from "./StepRunStaleCheckService.js";

export const StepRunStaleCheckFeature = createFeature({
    name: "Workflows/StepRunStaleCheck",
    register(container) {
        container.register(StepRunStaleCheckService);
    }
});
