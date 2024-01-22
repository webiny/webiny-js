import {
    CmsContext as BaseContext,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types";
import { Topic } from "@webiny/pubsub/types";
import { IResponseError, ITaskResponse, ITaskResponseResult } from "~/response/abstractions";
import { ITaskManagerStore } from "./runner/abstractions";
import { EventBridgeClientSendResponse } from "@webiny/aws-sdk/client-eventbridge";
import { SecurityPermission } from "@webiny/api-security/types";

export * from "./response/abstractions";
export * from "./runner/abstractions";

export interface ITaskConfig {
    readonly eventBusName: string;
}

export interface ITaskDataInput {
    [key: string]: any;
}

export enum ITaskLogItemType {
    INFO = "info",
    ERROR = "error"
}

export interface ITaskLogItemData {
    [key: string]: any;
}

export interface ITaskLogItemBase {
    message: string;
    createdOn: string;
    type: ITaskLogItemType;
    data?: ITaskLogItemData;
}

export interface ITaskLogItemInfo extends ITaskLogItemBase {
    type: ITaskLogItemType.INFO;
}

export interface ITaskLogItemError extends ITaskLogItemBase {
    type: ITaskLogItemType.ERROR;
    error?: IResponseError;
}

export type ITaskLogItem = ITaskLogItemInfo | ITaskLogItemError;

export interface ITaskLog {
    /**
     * ID without the revision number (for example: #0001).
     */
    id: string;
    createdOn: string;
    createdBy: ITaskIdentity;
    executionName: string;
    task: string;
    iteration: number;
    items: ITaskLogItem[];
}

export enum TaskDataStatus {
    PENDING = "pending",
    RUNNING = "running",
    FAILED = "failed",
    SUCCESS = "success",
    ABORTED = "aborted"
}

export interface ITaskIdentity {
    id: string;
    displayName: string | null;
    type: string;
}

export interface ITaskData<T = any> {
    /**
     * ID without the revision number (for example: #0001).
     */
    id: string;
    name: string;
    taskStatus: TaskDataStatus;
    definitionId: string;
    executionName: string;
    input: T;
    createdOn: string;
    savedOn: string;
    createdBy: ITaskIdentity;
    startedOn?: string;
    finishedOn?: string;
    eventResponse: EventBridgeClientSendResponse | undefined;
    iterations: number;
}

export type IGetTaskResponse<T = any> = ITaskData<T> | null;

export interface IListTasksResponse<T = any> {
    items: ITaskData<T>[];
    meta: CmsEntryMeta;
}

export interface IListTaskLogsResponse {
    items: ITaskLog[];
    meta: CmsEntryMeta;
}

export type ICreateTaskResponse<T = any> = ITaskData<T>;
export type IUpdateTaskResponse<T = any> = ITaskData<T>;
export type IDeleteTaskResponse = boolean;

export type IListTaskParams = Omit<CmsEntryListParams, "fields">;
export type IListTaskLogParams = Omit<CmsEntryListParams, "fields">;

export interface ITaskCreateData<T = ITaskDataInput> {
    definitionId: string;
    name: string;
    input: T;
}

export interface ITaskUpdateData<T = ITaskDataInput> {
    name?: string;
    input?: T;
    taskStatus?: TaskDataStatus;
    executionName?: string;
    startedOn?: string;
    finishedOn?: string;
    eventResponse?: Record<string, any>;
    iterations?: number;
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

export interface ITaskLogCreateInput {
    executionName: string;
    iteration: number;
}

export interface ITaskLogUpdateInput {
    items: ITaskLogItem[];
}

export interface ITasksContextCrudObject {
    /**
     * Models
     */
    getTaskModel: () => Promise<CmsModel>;
    getLogModel: () => Promise<CmsModel>;
    /**
     * Tasks
     */
    getTask: <T = any>(id: string) => Promise<IGetTaskResponse<T> | null>;
    listTasks: <T = any>(params?: IListTaskParams) => Promise<IListTasksResponse<T>>;
    createTask: <T = any>(task: ITaskCreateData<T>) => Promise<ICreateTaskResponse<T>>;
    updateTask: <T = any>(
        id: string,
        data: Partial<ITaskUpdateData<T>>
    ) => Promise<IUpdateTaskResponse<T>>;
    deleteTask: (id: string) => Promise<IDeleteTaskResponse>;
    /**
     * Logs
     */
    createLog: (task: Pick<ITaskData, "id">, data: ITaskLogCreateInput) => Promise<ITaskLog>;
    updateLog: (id: string, data: ITaskLogUpdateInput) => Promise<ITaskLog>;
    getLog: (id: string) => Promise<ITaskLog | null>;
    getLatestLog: (taskId: string) => Promise<ITaskLog>;
    listLogs: (params: IListTaskLogParams) => Promise<IListTaskLogsResponse>;
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
    getDefinition: <T = ITaskDataInput>(id: string) => ITaskDefinition<Context, T> | null;
    listDefinitions: () => ITaskDefinition[];
}

export interface ITaskTriggerParams<T = ITaskDataInput> {
    definition: string;
    name?: string;
    input?: T;
}

export interface ITaskAbortParams {
    id: string;
    message?: string;
}

export interface ITasksContextTriggerObject {
    trigger: <T = ITaskDataInput>(params: ITaskTriggerParams<T>) => Promise<ITaskData<T>>;
    abort: <T = ITaskDataInput>(params: ITaskAbortParams) => Promise<ITaskData<T>>;
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
    isAborted: () => boolean;
    input: I;
    store: ITaskManagerStore;
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
    CONTINUE = "continue",
    ABORTED = "aborted"
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

export interface ITaskBeforeTriggerParams<C extends Context = Context, I = ITaskDataInput> {
    context: C;
    input: I;
}

export interface ITaskDefinition<C extends Context = Context, I = ITaskDataInput> {
    /**
     * ID of the task must be unique in the system.
     * It should be in camelCase format, for example: "myCustomTask".
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
    onBeforeTrigger?: <T = ITaskDataInput>(params: ITaskBeforeTriggerParams<C, T>) => Promise<void>;
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

export interface TaskPermission extends SecurityPermission {
    name: "task";
    rwd?: string;
}
