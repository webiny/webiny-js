import { useContext } from "react";
import { WorkflowStatesWidgetContext } from "../Provider/WorkflowStatesProvider.js";

export const useWorkflowStatesWidget = () => {
    const context = useContext(WorkflowStatesWidgetContext);
    if (!context) {
        throw new Error(
            "useWorkflowStatesWidget must be used within a WorkflowStatesWidgetContext"
        );
    }
    return context;
};
