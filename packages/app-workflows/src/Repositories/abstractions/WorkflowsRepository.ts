import type { IWorkflow } from "~/types.js";
import type { IWorkflowError } from "~/Gateways/abstraction/WorkflowsGateway.js";

export interface IWorkflowsRepositoryListParamsWhere {
    app: string;
}

export interface IWorkflowsRepositoryListParams {
    where: IWorkflowsRepositoryListParamsWhere;
}

export interface IWorkflowsRepository {
    readonly error: IWorkflowError | null;
    readonly loading: boolean;
    find(id: string): IWorkflow | null;
    findOne(id: string): IWorkflow;
    save(input: IWorkflow): Promise<void>;
    remove(workflowId: string): Promise<void>;
    listWorkflows(params?: IWorkflowsRepositoryListParams): Promise<IWorkflow[]>;
}
