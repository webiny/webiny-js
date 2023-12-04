import { Context as BaseContext } from "@webiny/handler-aws/types";
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { ITaskError } from "~/manager/types";

export interface ITaskData<T> {
    id: string;
    input: T;
}

export interface TasksContextObject {
    getTask: <T = any>(id: string) => Promise<ITaskData<T>>;
    listTasks: <T = any>() => Promise<ITaskData<T>[]>;
    createTask: <T = any>(task: ITaskData<T>) => Promise<ITaskData<T>>;
    updateTask: <T = any>(id: string, data: Partial<ITaskData<T>>) => Promise<ITaskData<T>>;
    deleteTask: <T = any>(id: string) => Promise<ITaskData<T>>;
}

export interface Context extends BaseContext {
    tasks: TasksContextObject;
}

export interface ITaskRunErrorResponseError {
    message: string;
    code?: string;
    data?: Record<string, any> | null;
}

export interface IResponseManagerDoneParams<T = any> {
    task: Pick<ITaskData<any>, "id">;
    input: T;
    error?: never;
    message?: string;
}

export interface IResponseManagerContinueParams<T = any> {
    task: Pick<ITaskData<any>, "id">;
    input: T;
    error?: never;
}

export interface IResponseManagerErrorParams<T = any> {
    input: T;
    error: ITaskError;
    task: Pick<ITaskData<any>, "id">;
}

export interface IResponseManager {
    from(response: ITaskRunResponse): ITaskRunResponse;
    done: (params: IResponseManagerDoneParams) => IResponseManagerDone;
    error: (params: IResponseManagerErrorParams) => IResponseManagerError;
    continue: <T = unknown>(params: IResponseManagerContinueParams<T>) => IResponseManagerContinue;
}

export interface ITaskRunResponseManagerDoneParams {
    message?: string;
}

export interface ITaskRunResponseManagerErrorParams {
    error: ITaskError;
}

export interface ITaskRunResponseManagerContinueParams<T> {
    input: T;
}

export interface ITaskRunResponseManagerDoneResponse {
    status: TaskResponseStatus.DONE;
    message?: string;
}

export interface ITaskRunResponseManagerErrorResponse {
    status: TaskResponseStatus.ERROR;
    error: ITaskRunErrorResponseError;
}

export interface ITaskRunResponseManagerContinueResponse<T = unknown> {
    status: TaskResponseStatus.CONTINUE;
    input: T;
}

export type ITaskRunResponseManagerResponse =
    | ITaskRunResponseManagerDoneResponse
    | ITaskRunResponseManagerErrorResponse
    | ITaskRunResponseManagerContinueResponse<any>;

export interface ITaskRunResponseManager {
    done: (params?: ITaskRunResponseManagerDoneParams) => ITaskRunResponseManagerDoneResponse;
    error: (params: ITaskRunResponseManagerErrorParams) => ITaskRunResponseManagerErrorResponse;
    continue: <T = unknown>(
        params: ITaskRunResponseManagerContinueParams<T>
    ) => ITaskRunResponseManagerContinueResponse<T>;
}

export interface ITaskRunParams<C extends Context, I = any> {
    context: C;
    response: ITaskRunResponseManager;
    isTimeoutClose: () => boolean;
    input: I;
    task: ITaskData<I>;
}

export interface ITaskSuccessParams<C extends Context, I = any> {
    context: C;
    input: I;
}

export interface ITaskErrorParams<C extends Context, I = any> {
    context: C;
    input: I;
}

export enum TaskResponseStatus {
    DONE = "done",
    ERROR = "error",
    CONTINUE = "continue"
}

export interface ITaskRunResponse<T = any> {
    id: string;
    status: TaskResponseStatus;
    input: T;
}

export interface IResponseManagerContinue<T = any> extends ITaskRunResponse<T> {
    status: TaskResponseStatus.CONTINUE;
    error?: never;
}

export interface IResponseManagerError<T = any> extends ITaskRunResponse<T> {
    status: TaskResponseStatus.ERROR;
    error: ITaskRunErrorResponseError;
}

export interface IResponseManagerDone<T = any> extends ITaskRunResponse<T> {
    status: TaskResponseStatus.DONE;
    message?: string;
    error?: never;
}

export type TaskField = Pick<
    CmsModelField,
    | "fieldId"
    | "type"
    | "label"
    | "renderer"
    | "predefinedValues"
    | "validation"
    | "listValidation"
    | "multipleValues"
    | "settings"
>;

export type TaskRunResponse =
    | IResponseManagerContinue
    | IResponseManagerDone
    | IResponseManagerError;

export interface ITaskDefinition<C extends Context = Context, I = any> {
    /**
     * ID of the task must be unique in the system.
     */
    id: string;
    /**
     * Name should be unique, as it will get used to identify the task in the UI.
     */
    name: string;
    /**
     * A description of the task, for the UI.
     */
    description?: string;
    /**
     * Task run method.
     */
    run: (params: ITaskRunParams<C, I>) => Promise<ITaskRunResponseManagerResponse>;
    /**
     * When task successfully finishes, this method will be called.
     */
    onDone?: (params: ITaskSuccessParams<C, I>) => Promise<void>;
    /**
     * When task fails, this method will be called.
     */
    onError?: (params: ITaskErrorParams<C, I>) => Promise<void>;
    /**
     * Custom input fields and layout for the task input.
     */
    fields?: TaskField[];
}
