import {
    CmsContext as BaseContext,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types";
import { Topic } from "@webiny/pubsub/types";
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
    definitionId: string;
    input: T;
    createdOn: Date;
    savedOn: Date;
    startedOn?: Date;
    finishedOn?: Date;
    log?: ITaskDataLog[];
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

export interface ITaskCreateData<T = any> {
    definitionId: string;
    name: string;
    input: T;
}

export interface ITaskUpdateData<T = any> {
    name?: string;
    input?: T;
    status?: TaskDataStatus;
    log?: ITaskDataLog[];
}

export interface OnTaskBeforeCreateTopicParams {
    input: ITaskCreateData;
}

export interface OnTaskAfterCreateTopicParams {
    input: ITaskCreateData;
    task: ITaskData;
}

export interface OnTaskBeforeUpdateTopicParams {
    input: ITaskUpdateData;
    original: ITaskData;
}

export interface OnTaskAfterUpdateTopicParams {
    input: ITaskUpdateData;
    task: ITaskData;
}

export interface OnTaskBeforeDeleteTopicParams {
    task: ITaskData;
}

export interface OnTaskAfterDeleteTopicParams {
    task: ITaskData;
}

export interface ITasksContextCrudObject {
    getModel: () => Promise<CmsModel>;
    getTask: <T = any>(id: string) => Promise<IGetTaskResponse<T> | null>;
    listTasks: <T = any>(params?: IListTaskParams) => Promise<IListTasksResponse<T>>;
    createTask: <T = any>(task: ITaskCreateData<T>) => Promise<ICreateTaskResponse<T>>;
    updateTask: <T = any>(
        id: string,
        data: Partial<ITaskUpdateData<T>>
    ) => Promise<IUpdateTaskResponse<T>>;
    deleteTask: (id: string) => Promise<IDeleteTaskResponse>;
    /**
     * Lifecycle events.
     */
    onTaskBeforeCreate: Topic<OnTaskBeforeCreateTopicParams>;
    onTaskAfterCreate: Topic<OnTaskAfterCreateTopicParams>;
    onTaskBeforeUpdate: Topic<OnTaskBeforeUpdateTopicParams>;
    onTaskAfterUpdate: Topic<OnTaskAfterUpdateTopicParams>;
    onTaskBeforeDelete: Topic<OnTaskBeforeDeleteTopicParams>;
    onTaskAfterDelete: Topic<OnTaskAfterDeleteTopicParams>;
}

export interface ITasksContextDefinitionObject {
    getDefinition: (id: string) => ITaskDefinition | null;
    listDefinitions: () => ITaskDefinition[];
}

export interface ITasksContextObject
    extends ITasksContextCrudObject,
        ITasksContextDefinitionObject {}

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

export type ITaskDefinitionField = Pick<
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
    fields?: ITaskDefinitionField[];
}
