import { createFeature } from "@webiny/feature/api";
import { GetWorkflowSettingsForEditorUseCase } from "./GetWorkflowSettingsForEditorUseCase.js";

export const GetWorkflowSettingsForEditorFeature = createFeature({
    name: "Workflows/GetWorkflowSettingsForEditor",
    register(container) {
        container.register(GetWorkflowSettingsForEditorUseCase);
    }
});
