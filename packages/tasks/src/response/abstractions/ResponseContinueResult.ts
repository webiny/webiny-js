import { ITaskDataValues, TaskResponseStatus } from "~/types";
import { IResponseBaseResult } from "./ResponseBaseResult";

export interface IResponseContinueParams<T = ITaskDataValues> {
    tenant?: string;
    locale?: string;
    webinyTaskId?: string;
    values: T;
    wait?: number;
}

export interface IResponseContinueResult<T = ITaskDataValues> extends IResponseBaseResult {
    message?: string;
    webinyTaskId: string;
    tenant: string;
    locale: string;
    values: T;
    wait?: number;
    status: TaskResponseStatus.CONTINUE;
}
