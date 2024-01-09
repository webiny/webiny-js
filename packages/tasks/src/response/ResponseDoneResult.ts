import { TaskResponseStatus } from "~/types";
import { IResponseDoneResult } from "./abstractions";

export class ResponseDoneResult implements IResponseDoneResult {
    public readonly message?: string | undefined;
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly locale: string;
    public readonly status: TaskResponseStatus.DONE = TaskResponseStatus.DONE;

    public constructor(params: Omit<IResponseDoneResult, "status">) {
        this.message = params.message;
        this.webinyTaskId = params.webinyTaskId;
        this.webinyTaskDefinitionId = params.webinyTaskDefinitionId;
        this.tenant = params.tenant;
        this.locale = params.locale;
    }
}
