import { WorkflowStateOptionsOpenInNewWindow } from "~/presentation/shared/index.js";
import {
    WorkflowStatesOwnWidget,
    WorkflowStatesRequestedWidget
} from "./presentation/workflowStatesWidget/components/index.js";

import { WorkflowStateListAppOverlay } from "./presentation/workflowStateList/components/Overlay/WorkflowStateListAppOverlay.js";
export { WorkflowsAdminApp } from "./app.js";
import { WorkflowStateBar } from "./presentation/workflowState/components/Bar/WorkflowStateBar.js";
import { WorkflowStateOverlay } from "./presentation/workflowState/components/Overlay/WorkflowStateOverlay.js";
import { WorkflowStateTooltip } from "./presentation/workflowState/components/Tooltip/WorkflowStateTooltip.js";
import { WorkflowsEditor } from "./presentation/workflowsEditor/components/index.js";
import { HasWorkflowsEditorPermission } from "./presentation/permissions/index.js";

export { useCanUseWorkflows } from "./hooks/canUseWorkflows.js";
export { useWorkflowState } from "./presentation/workflowState/useWorkflowState.js";
export type { IWorkflowApplication, IWorkflowState } from "~/types.js";
export { WorkflowStateValue } from "~/types.js";
export { useWorkflowsPermission } from "./presentation/permissions/useWorkflowsPermission.js";

export { WorkflowsFeature } from "./features/feature.js";
export { WorkflowStatePresenterFeature } from "./presentation/workflowState/feature.js";
export { WorkflowStatePresenter } from "./presentation/workflowState/abstractions.js";
export type { IWorkflowStatePresenter } from "./presentation/workflowState/abstractions.js";
export { WorkflowStateListPresenterFeature } from "./presentation/workflowStateList/feature.js";
export { WorkflowStatesWidgetPresenterFeature } from "./presentation/workflowStatesWidget/feature.js";
export { WorkflowsEditorPresenterFeature } from "./presentation/workflowsEditor/feature.js";
export { WorkflowsPermissionsFeature } from "./features/permissions/feature.js";

export const Components = {
    ContentReview: {
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
