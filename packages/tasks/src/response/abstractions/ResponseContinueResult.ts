import { ITaskDataValues, TaskResponseStatus } from "~/types";
import { IResponseBaseResult } from "./ResponseBaseResult";

/**
 * Wait can be used to pause next iteration of the Lambda execution.
 * For example, if the task is hammering the Elasticsearch cluster too much, you can use this to pause the execution for some time.
 */

export interface IResponseContinueParams<T = ITaskDataValues> {
    tenant?: string;
    locale?: string;
    webinyTaskId?: string;
    values: T;
    wait?: number;
}

export interface IResponseContinueResult<T = ITaskDataValues> extends IResponseBaseResult {
    message?: string;
    values: T;
    wait?: number;
    status: TaskResponseStatus.CONTINUE;
}
