import { IResponseBaseResult } from "~/response/abstractions/ResponseBaseResult";
import { TaskResponseStatus } from "~/types";

export interface IResponseAbortedResult extends IResponseBaseResult {
    status: TaskResponseStatus.ABORTED;
}
