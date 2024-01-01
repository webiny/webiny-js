import { IResponseBaseResult } from "~/response/abstractions/ResponseBaseResult";
import { TaskResponseStatus } from "~/types";

export interface IResponseAbortedResult extends IResponseBaseResult {
    webinyTaskId: string;
    tenant: string;
    locale: string;
    status: TaskResponseStatus.ABORTED;
}
