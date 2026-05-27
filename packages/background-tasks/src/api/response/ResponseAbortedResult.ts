import type { IResponseAbortedResult } from "./abstractions/index.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export class ResponseAbortedResult implements IResponseAbortedResult {
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly status: TaskResultStatus.ABORTED = TaskResultStatus.ABORTED;

    public constructor(params: Omit<IResponseAbortedResult, "status">) {
        this.webinyTaskId = params.webinyTaskId;
        this.webinyTaskDefinitionId = params.webinyTaskDefinitionId;
        this.tenant = params.tenant;
    }
}
