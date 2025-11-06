import { WorkflowStateOptionsOpenInNewWindow } from "~/Components/Common/index.js";

export { useCanUseWorkflows } from "./hooks/canUseWorkflows.js";
export { useWorkflowState } from "./Components/WorkflowState/useWorkflowState.js";
export { Workflows } from "./Components/Workflows/index.js";
export {
    WorkflowStateProvider,
    WorkflowStateTooltip,
    WorkflowStateOverlay,
    WorkflowStateBar
} from "./Components/WorkflowState/index.js";
export type { IWorkflowApplication } from "~/types.js";

export * from "./Components/WorkflowStatesWidget/index.js";

export * from "./Components/WorkflowStateList/index.js";

export const Components = {
    List: {
        Options: {
            OpenInNewWindow: WorkflowStateOptionsOpenInNewWindow
        }
    }
};
