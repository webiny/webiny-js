import { TaskResponseStatus } from "~/types";
import { IResponseError, IResponseErrorResult } from "./abstractions";

export class ResponseErrorResult implements IResponseErrorResult {
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly locale: string;
    public readonly error: IResponseError;
    public readonly status: TaskResponseStatus.ERROR = TaskResponseStatus.ERROR;

    public constructor(params: Omit<IResponseErrorResult, "status">) {
        this.webinyTaskId = params.webinyTaskId;
        this.webinyTaskDefinitionId = params.webinyTaskDefinitionId;
        this.tenant = params.tenant;
        this.locale = params.locale;
        this.error = params.error;
    }
}
