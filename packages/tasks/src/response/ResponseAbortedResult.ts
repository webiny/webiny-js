import { TaskResponseStatus } from "~/types.js";
import type { IResponseAbortedResult } from "./abstractions/index.js";

export class ResponseAbortedResult implements IResponseAbortedResult {
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly status: TaskResponseStatus.ABORTED = TaskResponseStatus.ABORTED;

    public constructor(params: Omit<IResponseAbortedResult, "status">) {
        this.webinyTaskId = params.webinyTaskId;
        this.webinyTaskDefinitionId = params.webinyTaskDefinitionId;
        this.tenant = params.tenant;
    }
}
