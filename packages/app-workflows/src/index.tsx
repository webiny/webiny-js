export { WorkflowsAdminApp } from "./app.js";
import { WorkflowsEditor } from "./presentation/workflowsEditor/components/index.js";
import { HasWorkflowsEditorPermission } from "./presentation/permissions/index.js";

export { useCanUseWorkflows } from "./hooks/canUseWorkflows.js";
export type { IWorkflowApplication } from "~/types.js";
export { useWorkflowsPermission } from "./presentation/permissions/useWorkflowsPermission.js";

export { WorkflowsFeature } from "./features/feature.js";
export { WorkflowsEditorPresenterFeature } from "./presentation/workflowsEditor/feature.js";
export { WorkflowsPermissionsFeature } from "./features/permissions/feature.js";

export const Components = {
    Permissions: {
        HasWorkflowsEditorPermission
    },
    Admin: {
        WorkflowsEditor
    }
};
