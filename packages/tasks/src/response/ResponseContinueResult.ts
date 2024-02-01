import { ITaskDataInput, TaskResponseStatus } from "~/types";
import { IResponseContinueResult } from "./abstractions";

export class ResponseContinueResult<T = ITaskDataInput> implements IResponseContinueResult<T> {
    public readonly message?: string | undefined;
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly locale: string;
    public readonly status: TaskResponseStatus.CONTINUE = TaskResponseStatus.CONTINUE;
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
        this.locale = params.locale;
        this.input = params.input;
        this.wait = params.wait;
    }
}
