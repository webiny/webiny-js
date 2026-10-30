import { createFeature } from "@webiny/feature/api";
import { WorkflowsPermissions } from "./WorkflowsPermissions.js";

export const WorkflowsPermissionsFeature = createFeature({
    name: "Workflows/WorkflowsPermissions",
    register(container) {
        container.register(WorkflowsPermissions);
    }
});
