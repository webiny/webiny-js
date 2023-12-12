import { TaskResponseStatus } from "~/types";
import { IResponseBaseResult } from "./ResponseBaseResult";

export interface IResponseContinueParams<T = Record<string, any>> {
    tenant?: string;
    locale?: string;
    webinyTaskId?: string;
    input: T;
}

export interface IResponseContinueResult<T = Record<string, any>> extends IResponseBaseResult {
    message?: string;
    webinyTaskId: string;
    tenant: string;
    locale: string;
    input: T;
    status: TaskResponseStatus.CONTINUE;
}
