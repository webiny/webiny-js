import type { IResponseDoneResult } from "./abstractions/index.js";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

export class ResponseDoneResult<
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
> implements IResponseDoneResult<O> {
    public readonly message?: string | undefined;
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly output?: O;
    public readonly status: TaskResultStatus.DONE = TaskResultStatus.DONE;

    public constructor(params: Omit<IResponseDoneResult<O>, "status">) {
        this.message = params.message;
        this.webinyTaskId = params.webinyTaskId;
        this.webinyTaskDefinitionId = params.webinyTaskDefinitionId;
        this.tenant = params.tenant;
        this.output = Object.keys(params.output || {}).length > 0 ? params.output : undefined;
    }
}
