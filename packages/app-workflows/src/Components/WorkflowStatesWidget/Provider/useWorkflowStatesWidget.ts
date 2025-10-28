import { useContext } from "react";
import { WorkflowStatesWidgetContext } from "./WorkflowStatesProvider.js";


export const useWorkflowStatesWidget = () => {
    const context = useContext(WorkflowStatesWidgetContext);
    if (!context) {
        throw new Error("useWorkflowStatesWidget must be used within a WorkflowStatesWidgetContext");
    }
    return context;
}
