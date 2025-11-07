import type { ITaskDataInput, TaskResponseStatus } from "~/types.js";
import type { IResponseBaseResult } from "./ResponseBaseResult.js";

/**
 * Wait can be used to pause next iteration of the Lambda execution.
 * For example, if the task is hammering the Elasticsearch cluster too much, you can use this to pause the execution for some time.
 */

export interface IResponseContinueParams<T = ITaskDataInput> {
    message?: string;
    tenant?: string;
    webinyTaskId?: string;
    input: T;
    wait?: number;
}

export interface IResponseContinueResult<T = ITaskDataInput> extends IResponseBaseResult {
    message?: string;
    input: T;
    wait?: number;
    delay: -1;
    status: TaskResponseStatus.CONTINUE;
}
