import { ITaskRunResponse, TaskResponseStatus } from "~/types";

export abstract class TaskRunResponse<T = any> implements ITaskRunResponse<T> {
    public abstract readonly id: string;
    public abstract readonly status: TaskResponseStatus;
    public abstract readonly input: T;
}
