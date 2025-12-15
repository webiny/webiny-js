import type { IResponseBaseResult } from "~/response/abstractions/ResponseBaseResult.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IResponseAbortedResult extends IResponseBaseResult {
    status: TaskResultStatus.ABORTED;
}
