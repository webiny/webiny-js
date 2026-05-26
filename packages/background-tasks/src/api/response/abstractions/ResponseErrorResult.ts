import type { IResponseBaseResult } from "./ResponseBaseResult.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IResponseError {
    message: string;
    code?: string | null;
    data?: GenericRecord | null;
    stack?: string;
}

export interface IResponseErrorParams {
    error: IResponseError | Error;
    tenant?: string;
    webinyTaskId?: string;
}

export interface IResponseErrorResult extends IResponseBaseResult {
    error: IResponseError;
    status: TaskResultStatus.ERROR;
}
