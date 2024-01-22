import { ITaskResponseDoneResultOutput, TaskResponseStatus } from "~/types";
import { IResponseBaseResult } from "./ResponseBaseResult";

export interface IResponseDoneParams<
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    tenant?: string;
    locale?: string;
    webinyTaskId?: string;
    message?: string;
    output?: O;
}

export interface IResponseDoneResult extends IResponseBaseResult {
    message?: string;
    status: TaskResponseStatus.DONE;
}
