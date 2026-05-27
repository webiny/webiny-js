import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IResponseBaseResult {
    status: TaskResultStatus;
    webinyTaskId: string;
    webinyTaskDefinitionId: string;
    tenant: string;
}
