import type { ITaskResponseDoneResultOutput, TaskResponseStatus } from "~/types.js";
import type { IResponseBaseResult } from "./ResponseBaseResult.js";

export interface IResponseDoneParams<
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    tenant?: string;
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
