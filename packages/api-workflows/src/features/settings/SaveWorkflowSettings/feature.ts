import { createFeature } from "@webiny/feature/api";
import { SaveWorkflowSettingsUseCase } from "./SaveWorkflowSettingsUseCase.js";

export const SaveWorkflowSettingsFeature = createFeature({
    name: "Workflows/SaveWorkflowSettings",
    register(container) {
        container.register(SaveWorkflowSettingsUseCase);
    }
});
