import { TaskResponseStatus } from "~/types";
import { IResponseError, IResponseErrorResult } from "./abstractions";

export class ResponseErrorResult implements IResponseErrorResult {
    webinyTaskId: string;
    tenant: string;
    locale: string;
    error: IResponseError;
    status: TaskResponseStatus.ERROR = TaskResponseStatus.ERROR;

    public constructor(params: Omit<IResponseErrorResult, "status">) {
        this.webinyTaskId = params.webinyTaskId;
        this.tenant = params.tenant;
        this.locale = params.locale;
        this.error = params.error;
    }
}
