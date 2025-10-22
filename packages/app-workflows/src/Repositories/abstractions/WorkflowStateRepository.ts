import type { IWorkflowStateError } from "~/Gateways/abstraction/WorkflowStateGateway.js";
import type { IWorkflowState } from "~/types.js";

export interface IWorkflowStateRepositoryRequestReviewParams {
    app: string;
    targetRevisionId: string;
}

export interface IWorkflowStateRepositoryStartParams {
    id: string;
}

export interface IWorkflowStateRepositoryApproveParams {
    id: string;
    comment?: string;
}

export interface IWorkflowStateRepositoryRejectParams {
    id: string;
    comment: string;
}

export interface IWorkflowStateRepositoryFindOneParams {
    app: string;
    targetRevisionId: string;
}

export interface IWorkflowStateRepository {
    readonly error: IWorkflowStateError | null;
    readonly loading: boolean;
    requestReview(
        params: IWorkflowStateRepositoryRequestReviewParams
    ): Promise<IWorkflowState | null>;
    start(params: IWorkflowStateRepositoryStartParams): Promise<IWorkflowState | null>;
    approve(params: IWorkflowStateRepositoryApproveParams): Promise<IWorkflowState | null>;
    reject(params: IWorkflowStateRepositoryRejectParams): Promise<IWorkflowState | null>;
    cancel(id: string): Promise<void>;
    getTargetState(app: string, targetRevisionId: string): Promise<IWorkflowState | null>;
    findOne(params: IWorkflowStateRepositoryFindOneParams): Promise<IWorkflowState | null>;
}
