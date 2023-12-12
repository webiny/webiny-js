import { TaskResponseStatus } from "~/types";
import { IResponseContinueResult } from "./abstractions";

export class ResponseContinueResult<T = Record<string, any>> implements IResponseContinueResult<T> {
    public readonly message?: string | undefined;
    public readonly webinyTaskId: string;
    public readonly tenant: string;
    public readonly locale: string;
    public readonly status: TaskResponseStatus.CONTINUE = TaskResponseStatus.CONTINUE;
    public readonly input: T;

    public constructor(params: Omit<IResponseContinueResult<T>, "status">) {
        this.message = params.message;
        this.webinyTaskId = params.webinyTaskId;
        this.tenant = params.tenant;
        this.locale = params.locale;
        this.input = params.input;
    }
}
