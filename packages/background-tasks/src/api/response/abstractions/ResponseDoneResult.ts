import type { IResponseBaseResult } from "./ResponseBaseResult.js";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IResponseDoneParams<
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
> {
    tenant?: string;
    webinyTaskId?: string;
    message?: string;
    output?: O;
}

export interface IResponseDoneResult<
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
> extends IResponseBaseResult {
    message?: string;
    output?: O;
    status: TaskResultStatus.DONE;
}
