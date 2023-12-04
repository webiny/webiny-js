import { IResponseManagerDone, IResponseManagerDoneParams, TaskResponseStatus } from "~/types";
import { TaskRunResponse } from "~/manager/response/TaskRunResponse";

export class TaskRunDoneResponse<T = any>
    extends TaskRunResponse
    implements IResponseManagerDone<T>
{
    public readonly id: string;
    public override readonly status: TaskResponseStatus.DONE = TaskResponseStatus.DONE;
    public readonly message?: string;
    public readonly input: T;

    public constructor(params: IResponseManagerDoneParams) {
        super();
        this.id = params?.task?.id || "unknown";
        this.message = params?.message;
        this.input = params?.input;
    }
}
