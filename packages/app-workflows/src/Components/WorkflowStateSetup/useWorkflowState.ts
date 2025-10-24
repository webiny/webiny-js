import { useContext } from "react";
import { WorkflowStateSetupContext } from "./WorkflowStateSetup.js";

export const useWorkflowState = () => {
    const context = useContext(WorkflowStateSetupContext);
    if (!context) {
        throw new Error("useWorkflowState must be used within a WorkflowStateSetupContext");
    }
    return context;
};
