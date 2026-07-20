import type { CmsIdentity } from "@webiny/api-headless-cms/types/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IDeleteModelTaskInput {
    modelId: string;
    lastDeletedId?: string;
}

export interface IDeleteModelTaskOutput extends TaskDefinition.TaskOutput {
    total?: number;
    deleted?: number;
}

export enum DeleteCmsModelTaskStatus {
    RUNNING = "running",
    DONE = "done",
    ERROR = "error",
    CANCELED = "canceled"
}

export interface IDeleteCmsModelTask {
    id: string;
    status: DeleteCmsModelTaskStatus;
    total: number;
    deleted: number;
    message?: string;
}

export interface IStoreValue {
    modelId: string;
    tenant: string;
    identity: CmsIdentity;
    task: string;
}
