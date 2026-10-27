import { createFeature } from "@webiny/feature/api";
import { WorkflowEditorAccess } from "./WorkflowEditorAccess.js";

export const WorkflowEditorAccessFeature = createFeature({
    name: "Workflows/WorkflowEditorAccess",
    register(container) {
        container.register(WorkflowEditorAccess);
    }
});
