import { TaskResponseStatus } from "~/types";
import { IResponseBaseResult } from "./ResponseBaseResult";

export interface IResponseError {
    message: string;
    code?: string;
    data?: Record<string, any>;
    stack?: string;
}

export interface IResponseErrorParams {
    error: IResponseError | Error;
    tenant?: string;
    locale?: string;
    webinyTaskId?: string;
}

export interface IResponseErrorResult extends IResponseBaseResult {
    error: IResponseError;
    status: TaskResponseStatus.ERROR;
}
