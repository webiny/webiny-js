import { createFeature } from "@webiny/feature/api";
import { SaveWorkflowSettingsForEditorUseCase } from "./SaveWorkflowSettingsForEditorUseCase.js";

export const SaveWorkflowSettingsForEditorFeature = createFeature({
    name: "Workflows/SaveWorkflowSettingsForEditor",
    register(container) {
        container.register(SaveWorkflowSettingsForEditorUseCase);
    }
});
