import { createAbstraction } from "@webiny/feature/api";
import type { IWorkflowStateModel } from "@webiny/api-workflows/context/abstractions/WorkflowState.js";
import type {
    IWorkflowsContextListParams,
    IWorkflowsContextListResponse
} from "@webiny/api-workflows/context/abstractions/WorkflowsContext.js";

// DeleteTargetState

interface IDeleteTargetState {
    execute(app: string, id: string): Promise<void>;
}

export const DeleteTargetState = createAbstraction<IDeleteTargetState>("DeleteTargetState");

export namespace DeleteTargetState {
    export type Interface = IDeleteTargetState;
}

// GetTargetState

interface IGetTargetState {
    execute(app: string, id: string): Promise<IWorkflowStateModel>;
}

export const GetTargetState = createAbstraction<IGetTargetState>("GetTargetState");

export namespace GetTargetState {
    export type Interface = IGetTargetState;
}

// DeleteWorkflow

interface IDeleteWorkflow {
    execute(app: string, id: string): Promise<boolean>;
}

export const DeleteWorkflow = createAbstraction<IDeleteWorkflow>("DeleteWorkflow");

export namespace DeleteWorkflow {
    export type Interface = IDeleteWorkflow;
}

// ListWorkflows

interface IListWorkflows {
    execute(params?: IWorkflowsContextListParams): Promise<IWorkflowsContextListResponse>;
}

export const ListWorkflows = createAbstraction<IListWorkflows>("ListWorkflows");

export namespace ListWorkflows {
    export type Interface = IListWorkflows;
}
