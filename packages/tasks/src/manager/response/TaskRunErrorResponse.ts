import { IResponseManagerError, ITaskRunErrorResponseError, TaskResponseStatus } from "~/types";
import { TaskRunResponse } from "~/manager/response/TaskRunResponse";

export interface ITaskRunErrorResponseParams<T> {
    id: string;
    error: ITaskRunErrorResponseError;
    input: T;
}

export class TaskRunErrorResponse<T = any>
    extends TaskRunResponse
    implements IResponseManagerError<T>
{
    public override readonly status: TaskResponseStatus.ERROR = TaskResponseStatus.ERROR;
    public readonly error: ITaskRunErrorResponseError;
    public readonly id: string;
    public readonly input: T;

    public constructor(params: ITaskRunErrorResponseParams<T>) {
        super();
        this.id = params.id;
        this.error = params.error;
        this.input = params.input;
    }
}
