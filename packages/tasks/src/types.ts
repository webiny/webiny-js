import { Context as BaseContext } from "@webiny/api";
import { CmsModelField } from "@webiny/api-headless-cms/types";

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

export interface TaskField
    extends Pick<
        CmsModelField,
        | "id"
        | "fieldId"
        | "storageId"
        | "type"
        | "label"
        | "renderer"
        | "validation"
        | "listValidation"
        | "multipleValues"
    > {}

export type TaskRunResponse =
    | ITaskRunContinueResponse
    | ITaskRunDoneResponse
    | ITaskRunErrorResponse;

export interface ITask<C extends Context, I> {
    /**
     * Must be unique in the system.
     */
    name: string;
    /**
     * Run methods.
     */
    run: (params: ITaskParams<C, I>) => Promise<TaskRunResponse>;
    onSuccess: (params: Omit<ITaskParams<C, I>, "manager">) => Promise<void>;
    /**
     * Custom input fields and layout for the task input.
     */
    fields?: TaskField[];
}
