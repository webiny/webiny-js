import { ITaskDataValues, TaskResponseStatus } from "~/types";
import { IResponseContinueResult } from "./abstractions";

export class ResponseContinueResult<T = ITaskDataValues> implements IResponseContinueResult<T> {
    public readonly message?: string | undefined;
    public readonly webinyTaskId: string;
    public readonly tenant: string;
    public readonly locale: string;
    public readonly status: TaskResponseStatus.CONTINUE = TaskResponseStatus.CONTINUE;
    public readonly values: T;

    public constructor(params: Omit<IResponseContinueResult<T>, "status">) {
        this.message = params.message;
        this.webinyTaskId = params.webinyTaskId;
        this.tenant = params.tenant;
        this.locale = params.locale;
        this.values = params.values;
    }
}
