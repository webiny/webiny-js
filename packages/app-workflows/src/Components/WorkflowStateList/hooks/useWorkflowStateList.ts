import { useContext } from "react";
import { WorkflowStateListContext } from "../Provider/WorkflowStateListProvider.js";

export const useWorkflowStateList = () => {
    const context = useContext(WorkflowStateListContext);
    if (!context) {
        throw new Error("useWorkflowStateList must be used within a WorkflowStateListContext");
    }
    return context;
};
