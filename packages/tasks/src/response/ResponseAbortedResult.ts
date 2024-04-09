import { TaskResponseStatus } from "~/types";
import { IResponseAbortedResult } from "./abstractions";

export class ResponseAbortedResult implements IResponseAbortedResult {
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly locale: string;
    public readonly status: TaskResponseStatus.ABORTED = TaskResponseStatus.ABORTED;

    public constructor(params: Omit<IResponseAbortedResult, "status">) {
        this.webinyTaskId = params.webinyTaskId;
        this.webinyTaskDefinitionId = params.webinyTaskDefinitionId;
        this.tenant = params.tenant;
        this.locale = params.locale;
    }
}
