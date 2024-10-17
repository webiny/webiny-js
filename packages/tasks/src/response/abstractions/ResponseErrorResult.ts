import { TaskResponseStatus } from "~/types";
import { IResponseBaseResult } from "./ResponseBaseResult";
import { GenericRecord } from "@webiny/api/types";

export interface IResponseError {
    message: string;
    code?: string | null;
    data?: GenericRecord | null;
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
