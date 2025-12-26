import { WorkflowStateOptionsOpenInNewWindow } from "~/Components/Common/index.js";
import {
    WorkflowStatesOwnWidget,
    WorkflowStatesRequestedWidget
} from "./Components/WorkflowStatesWidget/index.js";

import { WorkflowStateListAppOverlay } from "./Components/WorkflowStateList/index.js";
import { WorkflowsAdminApp } from "./Components/App/index.js";
import {
    WorkflowStateBar,
    WorkflowStateOverlay,
    WorkflowStateProvider,
    WorkflowStateTooltip
} from "./Components/WorkflowState/index.js";
import { WorkflowsEditor } from "./Components/WorkflowsEditor/index.js";
import { HasWorkflowsEditorPermission } from "./Components/WorkflowsPermissions/index.js";

export { useCanUseWorkflows } from "./hooks/canUseWorkflows.js";
export { useWorkflowState } from "./Components/WorkflowState/index.js";
export type { IWorkflowApplication, IWorkflowState } from "~/types.js";
export { WorkflowStateValue } from "~/types.js";
export { useWorkflowsPermission } from "./Components/WorkflowsPermissions/index.js";

export const Components = {
    App: {
        WorkflowsAdminApp
    },
    ContentReview: {
        WorkflowStateProvider,
        WorkflowStateTooltip,
        WorkflowStateOverlay,
        WorkflowStateBar
    },
    Permissions: {
        HasWorkflowsEditorPermission
    },
    Admin: {
        WorkflowsEditor
    },
    Overlay: {
        WorkflowStateListAppOverlay
    },
    Widget: {
        OwnWidget: WorkflowStatesOwnWidget,
        RequestedWidget: WorkflowStatesRequestedWidget
    },
    List: {
        Options: {
            OpenInNewWindow: WorkflowStateOptionsOpenInNewWindow
        }
    }
};
