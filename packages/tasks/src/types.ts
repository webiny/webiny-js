import {
    CmsContext as BaseContext,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types";
import { IResponseError, ITaskResponse, ITaskResponseResult } from "~/response/abstractions";

export interface ITaskDataLog {
    message: string;
    createdOn: string;
    input?: any;
    error?: IResponseError;
}

export enum TaskDataStatus {
    PENDING = "pending",
    RUNNING = "running",
    FAILED = "failed",
    SUCCESS = "success"
}
export interface ITaskData<T = any> {
    id: string;
    name: string;
    status: TaskDataStatus;
    input: T;
    createdOn: Date;
    savedOn: Date;
    startedOn?: Date;
    finishedOn?: Date;
    log?: ITaskDataLog[] | null;
}

export type IGetTaskResponse<T = any> = ITaskData<T> | null;

export interface IListTasksResponse<T = any> {
    items: ITaskData<T>[];
    meta: CmsEntryMeta;
}

export type ICreateTaskResponse<T = any> = ITaskData<T>;
export type IUpdateTaskResponse<T = any> = ITaskData<T>;
export type IDeleteTaskResponse = boolean;

export type IListTaskParams = CmsEntryListParams;

export interface ITasksContextObject {
    getModel: () => Promise<CmsModel>;
    getTask: <T = any>(id: string) => Promise<IGetTaskResponse<T>>;
    listTasks: <T = any>(params?: IListTaskParams) => Promise<IListTasksResponse<T>>;
    createTask: <T = any>(task: ITaskData<T>) => Promise<ICreateTaskResponse<T>>;
    updateTask: <T = any>(
        id: string,
        data: Partial<ITaskData<T>>
    ) => Promise<IUpdateTaskResponse<T>>;
    deleteTask: (id: string) => Promise<IDeleteTaskResponse>;
}

export interface Context extends BaseContext {
    tasks: ITasksContextObject;
}

export interface ITaskRunParams<C extends Context, I = any> {
    context: C;
    response: ITaskResponse;
    isCloseToTimeout: () => boolean;
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

export type ITaskField = Pick<
    CmsModelField,
    | "fieldId"
    | "type"
    | "label"
    | "renderer"
    | "helpText"
    | "placeholderText"
    | "predefinedValues"
    | "validation"
    | "listValidation"
    | "multipleValues"
    | "settings"
>;

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
    run: (params: ITaskRunParams<C, I>) => Promise<ITaskResponseResult>;
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
    fields?: ITaskField[];
}
