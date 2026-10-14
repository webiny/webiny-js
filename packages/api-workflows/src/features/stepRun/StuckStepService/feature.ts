import { createFeature } from "@webiny/feature/api";
import { StuckStepService } from "./StuckStepService.js";

export const StuckStepFeature = createFeature({
    name: "Workflows/StuckStep",
    register(container) {
        container.register(StuckStepService);
    }
});
