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

export interface IResponseDoneResult<
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> extends IResponseBaseResult {
    message?: string;
    output?: O;
    status: TaskResponseStatus.DONE;
}
