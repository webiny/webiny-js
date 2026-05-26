import type { IResponseError, IResponseErrorResult } from "./abstractions/index.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export class ResponseErrorResult implements IResponseErrorResult {
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly error: IResponseError;
    public readonly status: TaskResultStatus.ERROR = TaskResultStatus.ERROR;

    public constructor(params: Omit<IResponseErrorResult, "status">) {
        this.webinyTaskId = params.webinyTaskId;
        this.webinyTaskDefinitionId = params.webinyTaskDefinitionId;
        this.tenant = params.tenant;
        this.error = params.error;
    }
}
