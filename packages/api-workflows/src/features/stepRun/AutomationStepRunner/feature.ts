import { createFeature } from "@webiny/feature/api";
import { AutomationStepRunner } from "./AutomationStepRunner.js";

export const AutomationStepRunnerFeature = createFeature({
    name: "Workflows/AutomationStepRunner",
    register(container) {
        container.register(AutomationStepRunner);
    }
});
