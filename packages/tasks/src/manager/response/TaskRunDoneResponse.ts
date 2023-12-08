import { IResponseManagerDone, ITaskData, TaskResponseStatus } from "~/types";
import { TaskRunResponse } from "~/manager/response/TaskRunResponse";

export interface ITaskRunDoneResponseParams<T = any> {
    task: Pick<ITaskData<any>, "id">;
    input: T;
    error?: never;
    message?: string;
}

export class TaskRunDoneResponse<T = any>
    extends TaskRunResponse
    implements IResponseManagerDone<T>
{
    public readonly id: string;
    public override readonly status: TaskResponseStatus.DONE = TaskResponseStatus.DONE;
    public readonly message?: string;
    public readonly input: T;

    public constructor(params: ITaskRunDoneResponseParams) {
        super();
        this.id = params.task?.id || "unknown";
        this.message = params.message;
        this.input = params.input;
    }
}
