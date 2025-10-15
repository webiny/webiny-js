import type { IWorkflow } from "./Workflow.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IWorkflowStepInput } from "./WorkflowInput.js";
import type { CmsEntryListSort } from "@webiny/api-headless-cms/types/index.js";
import type { IMeta } from "./types.js";

export interface IStoreWorkflowInput {
    name: string;
    steps: NonEmptyArray<IWorkflowStepInput>;
}

export interface IWorkflowsContextGetParams {
    app: string;
    id: string;
}
export interface IWorkflowsContextListWhere {
    app?: string;
    app_in?: string[];
    id?: string;
    id_in?: string[];
}
export interface IWorkflowsContextListParams {
    sort?: CmsEntryListSort;
    limit?: number;
    after?: string;
    where?: IWorkflowsContextListWhere;
}

export interface IWorkflowsContextListResponse {
    items: IWorkflow[];
    meta: IMeta;
}

export interface IWorkflowsContext {
    storeWorkflow(app: string, id: string, input: IStoreWorkflowInput): Promise<IWorkflow>;
    deleteWorkflow(app: string, id: string): Promise<boolean>;

    getWorkflow(params: IWorkflowsContextGetParams): Promise<IWorkflow | null>;
    listWorkflows(params?: IWorkflowsContextListParams): Promise<IWorkflowsContextListResponse>;
}
