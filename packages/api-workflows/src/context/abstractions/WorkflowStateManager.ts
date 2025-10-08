import type { IWorkflow } from "./Workflow.js";



export interface IWorkflowStateManager {
    getState: (id: string) => Promise<IWorkflowState | null>;
    setState: (id: string, state: IWorkflowState) => Promise<void>;
    deleteState: (id: string) => Promise<void>;
    listStates: () => Promise<IWorkflowState[]>;
}
