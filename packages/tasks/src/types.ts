import {
    CmsContext as BaseContext,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types";
import { Topic } from "@webiny/pubsub/types";
import { IResponseError, ITaskResponse, ITaskResponseResult } from "~/response/abstractions";

export interface ITaskConfig {
    readonly eventBusName: string;
}

export interface ITaskDataValues {
    [key: string]: any;
}

export interface ITaskDataLog<T = ITaskDataValues> {
    message: string;
    createdOn: string;
    values?: T;
    error?: IResponseError;
}

export enum TaskDataStatus {
    PENDING = "pending",
    RUNNING = "running",
    FAILED = "failed",
    SUCCESS = "success",
    STOPPED = "stopped"
}

export interface ITaskIdentity {
    id: string;
    displayName: string | null;
    type: string;
}
export interface ITaskData<T = any> {
    id: string;
    name: string;
    status: TaskDataStatus;
    definitionId: string;
    values: T;
    createdOn: Date;
    savedOn: Date;
    createdBy: ITaskIdentity;
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

export interface ITaskCreateData<T = ITaskDataValues> {
    definitionId: string;
    name: string;
    values: T;
}

export interface ITaskUpdateData<T = ITaskDataValues> {
    name?: string;
    values?: T;
    status?: TaskDataStatus;
    log?: ITaskDataLog[];
    startedOn?: string;
    finishedOn?: string;
}

export interface OnTaskBeforeCreateTopicParams {
    values: ITaskCreateData;
}

export interface OnTaskAfterCreateTopicParams {
    values: ITaskCreateData;
    task: ITaskData;
}

export interface OnTaskBeforeUpdateTopicParams {
    values: ITaskUpdateData;
    original: ITaskData;
}

export interface OnTaskAfterUpdateTopicParams {
    values: ITaskUpdateData;
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

export interface ITasksContextConfigObject {
    config: ITaskConfig;
}

export interface ITasksContextDefinitionObject {
    getDefinition: <T = ITaskDataValues>(id: string) => ITaskDefinition<Context, T> | null;
    listDefinitions: () => ITaskDefinition[];
}

export interface ITaskTriggerParams<T = ITaskDataValues> {
    definition: string;
    name?: string;
    values?: T;
}

export interface ITaskStopParams {
    id: string;
    message?: string;
}

export interface ITasksContextTriggerObject {
    trigger: <T = ITaskDataValues>(params: ITaskTriggerParams<T>) => Promise<ITaskData<T>>;
    stop: <T = ITaskDataValues>(params: ITaskStopParams) => Promise<ITaskData<T>>;
}

export interface ITasksContextObject
    extends ITasksContextCrudObject,
        ITasksContextDefinitionObject,
        ITasksContextTriggerObject,
        ITasksContextConfigObject {}

export interface Context extends BaseContext {
    tasks: ITasksContextObject;
}

export interface ITaskRunParams<C extends Context, I = any> {
    context: C;
    response: ITaskResponse;
    isCloseToTimeout: () => boolean;
    isStopped: () => boolean;
    values: I;
    task: ITaskData<I>;
}

export interface ITaskSuccessParams<C extends Context, I = any> {
    context: C;
    values: I;
}

export interface ITaskErrorParams<C extends Context, I = any> {
    context: C;
    values: I;
}

export enum TaskResponseStatus {
    DONE = "done",
    ERROR = "error",
    CONTINUE = "continue",
    STOPPED = "stopped"
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

export interface ITaskBeforeTriggerParams<C extends Context = Context, I = ITaskDataValues> {
    context: C;
    values: I;
}

export interface ITaskDefinition<C extends Context = Context, I = ITaskDataValues> {
    /**
     * ID of the task must be unique in the system.
     */
    id: string;
    /**
     * Name should be unique, as it will get used to identify the task in the UI.
     */
    title: string;
    /**
     * A description of the task, for the UI.
     */
    description?: string;
    /**
     * Task run method.
     */
    run: (params: ITaskRunParams<C, I>) => Promise<ITaskResponseResult>;
    /**
     * When a new task is about to be triggered, we will run this method.
     * For example, you can use this method to check if there is a task of the same type already running.
     */
    onBeforeTrigger?: <T = ITaskDataValues>(
        params: ITaskBeforeTriggerParams<C, T>
    ) => Promise<void>;
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
