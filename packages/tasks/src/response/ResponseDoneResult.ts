import { ITaskResponseDoneResultOutput, TaskResponseStatus } from "~/types";
import { IResponseDoneResult } from "./abstractions";

export class ResponseDoneResult<
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> implements IResponseDoneResult<O>
{
    public readonly message?: string | undefined;
    public readonly webinyTaskId: string;
    public readonly webinyTaskDefinitionId: string;
    public readonly tenant: string;
    public readonly locale: string;
    public readonly output?: O;
    public readonly status: TaskResponseStatus.DONE = TaskResponseStatus.DONE;

    public constructor(params: Omit<IResponseDoneResult<O>, "status">) {
        this.message = params.message;
        this.webinyTaskId = params.webinyTaskId;
        this.webinyTaskDefinitionId = params.webinyTaskDefinitionId;
        this.tenant = params.tenant;
        this.locale = params.locale;
        this.output = Object.keys(params.output || {}).length > 0 ? params.output : undefined;
    }
}
