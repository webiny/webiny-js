import { TaskResponseStatus } from "~/types";
import { IResponseBaseResult } from "./ResponseBaseResult";

export interface IResponseDoneParams {
    tenant?: string;
    locale?: string;
    webinyTaskId?: string;
    message?: string;
}

export interface IResponseDoneResult extends IResponseBaseResult {
    message?: string;
    status: TaskResponseStatus.DONE;
}
