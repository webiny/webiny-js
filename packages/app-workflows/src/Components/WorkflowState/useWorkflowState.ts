import { useContext } from "react";
import { WorkflowStateContext } from "./WorkflowState.js";

export const useWorkflowState = () => {
    const context = useContext(WorkflowStateContext);
    if (!context) {
        throw new Error("useWorkflowState must be used within a WorkflowStateContext");
    }
    return context;
};
