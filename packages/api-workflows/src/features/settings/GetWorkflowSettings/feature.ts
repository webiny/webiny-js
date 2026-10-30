import { createFeature } from "@webiny/feature/api";
import { GetWorkflowSettingsUseCase } from "./GetWorkflowSettingsUseCase.js";

export const GetWorkflowSettingsFeature = createFeature({
    name: "Workflows/GetWorkflowSettings",
    register(container) {
        container.register(GetWorkflowSettingsUseCase);
    }
});
