import { createFeature } from "@webiny/feature/api";
import { StepTypeRegistryService } from "./StepTypeRegistryService/StepTypeRegistryService.js";
import { ReviewStepType } from "./ReviewStepType/ReviewStepType.js";
import { AutomationStepType } from "./AutomationStepType/AutomationStepType.js";

/** The step type registry and the built-in step types (R131). */
export const StepTypesFeature = createFeature({
    name: "Workflows/StepTypes",
    register(container) {
        container.register(StepTypeRegistryService);
        container.register(ReviewStepType);
        container.register(AutomationStepType);
    }
});
