import type { ITaskDataInput } from "~/api/types.js";
import type { IResponseContinueResult } from "./abstractions/index.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export class ResponseContinueResult<T = ITaskDataInput> implements IResponseContinueResult<T> {
    public readonly message?: string | undefined;
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly status: TaskResultStatus.CONTINUE = TaskResultStatus.CONTINUE;
    public readonly input: T;
    /**
     * We need this to make sure that the task will not use the delay from the previous iteration.
     */
    public readonly delay = -1;
    public readonly wait?: number;

    public constructor(params: Omit<IResponseContinueResult<T>, "delay" | "status">) {
        this.message = params.message;
        this.webinyTaskId = params.webinyTaskId;
        this.webinyTaskDefinitionId = params.webinyTaskDefinitionId;
        this.tenant = params.tenant;
        this.input = params.input;
        this.wait = params.wait;
    }
}
