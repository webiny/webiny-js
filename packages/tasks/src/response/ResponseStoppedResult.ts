import { TaskResponseStatus } from "~/types";
import { IResponseStoppedResult } from "./abstractions";

export class ResponseStoppedResult implements IResponseStoppedResult {
    public readonly webinyTaskId: string;
    public readonly tenant: string;
    public readonly locale: string;
    public readonly status: TaskResponseStatus.STOPPED = TaskResponseStatus.STOPPED;

    public constructor(params: Omit<IResponseStoppedResult, "status">) {
        this.webinyTaskId = params.webinyTaskId;
        this.tenant = params.tenant;
        this.locale = params.locale;
    }
}
