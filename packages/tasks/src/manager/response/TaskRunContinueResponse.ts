import { IResponseManagerContinue, TaskResponseStatus } from "~/types";
import { TaskRunResponse } from "~/manager/response/TaskRunResponse";

export interface ITaskRunContinueResponseParams<T = unknown> {
    id: string;
    token: string;
    input: T;
}

export class TaskRunContinueResponse<T>
    extends TaskRunResponse
    implements IResponseManagerContinue
{
    public override readonly status: TaskResponseStatus.CONTINUE = TaskResponseStatus.CONTINUE;
    public readonly id: string;
    public readonly input: T;

    public constructor(params: ITaskRunContinueResponseParams<T>) {
        super(params.token);
        this.id = params.id;
        this.input = params.input;
    }
}
