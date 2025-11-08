import { WorkflowStateOptionsOpenInNewWindow } from "~/Components/Common/index.js";

export { useCanUseWorkflows } from "./hooks/canUseWorkflows.js";
export { useWorkflowState } from "./Components/WorkflowState/useWorkflowState.js";
export { WorkflowsAdmin } from "./Components/WorkflowsAdmin/index.js";
export {
    WorkflowStateProvider,
    WorkflowStateTooltip,
    WorkflowStateOverlay,
    WorkflowStateBar
} from "./Components/WorkflowState/index.js";
export type { IWorkflowApplication } from "~/types.js";

export {
    WorkflowStatesOwnWidget,
    WorkflowStatesRequestedWidget
} from "./Components/WorkflowStatesWidget/index.js";

export { WorkflowStateListAppOverlay } from "./Components/WorkflowStateList/index.js";

export { ContentReviews } from "./ContentReviews.js";

export const Components = {
    List: {
        Options: {
            OpenInNewWindow: WorkflowStateOptionsOpenInNewWindow
        }
    }
};
