import type { IWorkflowStateError } from "~/Gateways/abstraction/WorkflowStateGateway.js";
import type { IWorkflowState } from "~/types.js";

export interface IWorkflowStateRepositoryApproveParams {
    id: string;
    stepId: string;
    comment?: string;
}

export interface IWorkflowStateRepositoryRejectParams {
    id: string;
    stepId: string;
    comment: string;
}

export interface IWorkflowStateRepositoryFindOneParams {
    app: string;
    targetRevisionId: string;
}

export interface IWorkflowStateRepository {
    readonly error: IWorkflowStateError | null;
    readonly loading: boolean;
    approve(params: IWorkflowStateRepositoryApproveParams): Promise<void>;
    reject(params: IWorkflowStateRepositoryRejectParams): Promise<void>;
    cancel(id: string): Promise<void>;
    findOne(params: IWorkflowStateRepositoryFindOneParams): Promise<IWorkflowState | null>;
}
