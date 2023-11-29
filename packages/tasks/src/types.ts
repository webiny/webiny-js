import { Context as BaseContext } from "@webiny/api";

export interface Context extends BaseContext {}

export interface ITaskManagerTask {
    id: string;
}

export interface ITaskRunErrorResponseError {
    message: string;
    code?: string;
    data?: Record<string, any>;
}

export interface ITaskRunContinueParams<I = any> {
    input: I;
}

export interface ITaskManager<I> {
    task: ITaskManagerTask;
    isTimeoutClose: () => boolean;
    done: () => Promise<ITaskRunDoneResponse>;
    error: (error: Error) => Promise<ITaskRunErrorResponse>;
    continue: <T = unknown>(
        params: ITaskRunContinueParams<I & T>
    ) => Promise<ITaskRunContinueResponse>;
}

export interface ITaskParams<C extends Context, I = any> {
    context: C;
    manager: ITaskManager<I>;
    input: I;
}

export enum TaskResponseStatus {
    DONE = "done",
    ERROR = "error",
    RUNNING = "running"
}

export interface ITaskRunContinueResponse {
    id: string;
    status: TaskResponseStatus.RUNNING;
    error?: never;
}

export interface ITaskRunErrorResponse {
    id: string;
    status: TaskResponseStatus.ERROR;
    error: ITaskRunErrorResponseError;
}
export interface ITaskRunDoneResponse {
    id?: never;
    status: TaskResponseStatus.DONE;
    error?: never;
}

export type TaskRunResponse =
    | ITaskRunContinueResponse
    | ITaskRunDoneResponse
    | ITaskRunErrorResponse;

export interface ITask<C extends Context, I> {
    run: (params: ITaskParams<C, I>) => Promise<TaskRunResponse>;
    onSuccess: (params: ITaskParams<C, I>) => Promise<void>;
}
