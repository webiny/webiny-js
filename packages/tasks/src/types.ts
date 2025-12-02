import type {
    CmsContext as BaseContext,
    CmsEntryListParams,
    CmsEntryListWhere,
    CmsEntryMeta,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types/index.js";
import type { Topic } from "@webiny/pubsub/types.js";
import type {
    IResponseError,
    ITaskResponse,
    ITaskResponseDoneResultOutput,
    ITaskResponseResult
} from "~/response/abstractions/index.js";
import type { IIsCloseToTimeoutCallable, ITaskManagerStore } from "./runner/abstractions/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IStepFunctionServiceFetchResult } from "~/service/StepFunctionServicePlugin.js";
import type { ITimer } from "@webiny/handler-aws";

import type zod from "zod";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export * from "./handler/types.js";
export * from "./response/abstractions/index.js";
export * from "./runner/abstractions/index.js";

export type ITaskDataInput = GenericRecord;

export enum TaskLogItemType {
    INFO = "info",
    ERROR = "error"
}

export interface ITaskLogItemData {
    [key: string]: any;
}

export interface ITaskLogItemBase {
    message: string;
    createdOn: string;
    type: TaskLogItemType;
    data?: ITaskLogItemData;
}

export interface ITaskLogItemInfo extends ITaskLogItemBase {
    type: TaskLogItemType.INFO;
}

export interface ITaskLogItemError extends ITaskLogItemBase {
    type: TaskLogItemType.ERROR;
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

export interface ITask<
    T = GenericRecord,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    /**
     * ID without the revision number (for example: #0001).
     */
    id: string;
    name: string;
    taskStatus: TaskDataStatus;
    definitionId: string;
    executionName: string;
    input: T;
    output?: O;
    createdOn: string;
    savedOn: string;
    createdBy: ITaskIdentity;
    startedOn?: string;
    finishedOn?: string;
    eventResponse: GenericRecord | undefined;
    iterations: number;
    parentId?: string;
}

export type IGetTaskResponse<
    T = any,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> = ITask<T, O> | null;

export interface IListTasksResponse<
    T = any,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    items: ITask<T, O>[];
    meta: CmsEntryMeta;
}

export interface IListTaskLogsResponse {
    items: ITaskLog[];
    meta: CmsEntryMeta;
}

export type ICreateTaskResponse<
    T = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> = ITask<T, O>;
export type IUpdateTaskResponse<
    T = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> = ITask<T, O>;
export type IDeleteTaskResponse = boolean;

export interface IListTaskParamsWhere extends CmsEntryListWhere {
    parentId?: string;
    parentId_not?: string;
    parentId_in?: string[];
    parentId_not_in?: string[];
    definitionId?: string;
    definitionId_not?: string;
    definitionId_in?: string[];
    definitionId_not_in?: string[];
    taskStatus?: string;
    taskStatus_not?: string;
    taskStatus_in?: string[];
    taskStatus_not_in?: string[];
}

export interface IListTaskParams extends Omit<CmsEntryListParams, "fields" | "search"> {
    where?: IListTaskParamsWhere;
}

export interface IListTaskLogParamsWhere extends CmsEntryListWhere {
    task?: string;
    task_in?: string[];
    task_not?: string;
    iteration?: number;
    iteration_not?: number;
    iteration_gte?: number;
    iteration_gt?: number;
    iteration_lte?: number;
    iteration_lt?: number;
}

export interface IListTaskLogParams extends Omit<CmsEntryListParams, "fields" | "search"> {
    where?: IListTaskLogParamsWhere;
}

export interface ITaskCreateData<T = ITaskDataInput> {
    definitionId: string;
    name: string;
    input: T;
    parentId?: string;
}

export interface ITaskUpdateData<
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    name?: string;
    input?: I;
    output?: O;
    taskStatus?: TaskDataStatus;
    executionName?: string;
    startedOn?: string;
    finishedOn?: string;
    eventResponse?: GenericRecord;
    iterations?: number;
}

export interface OnTaskBeforeCreateTopicParams {
    input: ITaskCreateData;
}

export interface OnTaskAfterCreateTopicParams {
    input: ITaskCreateData;
    task: ITask;
}

export interface OnTaskBeforeUpdateTopicParams {
    input: ITaskUpdateData;
    original: ITask;
}

export interface OnTaskAfterUpdateTopicParams {
    input: ITaskUpdateData;
    task: ITask;
}

export interface OnTaskBeforeDeleteTopicParams {
    task: ITask;
}

export interface OnTaskAfterDeleteTopicParams {
    task: ITask;
}

export interface ITaskLogCreateInput {
    executionName: string;
    iteration: number;
}

export interface ITaskLogUpdateInput {
    items?: ITaskLogItem[];
}

export interface ITasksContextCrudObject {
    /**
     * Models
     */
    getTaskModel(): Promise<CmsModel>;
    getLogModel(): Promise<CmsModel>;
    /**
     * Tasks
     */
    getTask<T = any, O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput>(
        id: string
    ): Promise<IGetTaskResponse<T, O> | null>;
    listTasks<T = any, O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput>(
        params?: IListTaskParams
    ): Promise<IListTasksResponse<T, O>>;
    createTask<T = any>(task: ITaskCreateData<T>): Promise<ICreateTaskResponse<T>>;
    updateTask<
        T = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    >(
        id: string,
        data: Partial<ITaskUpdateData<T, O>>
    ): Promise<IUpdateTaskResponse<T, O>>;
    deleteTask(id: string): Promise<IDeleteTaskResponse>;
    /**
     * Logs
     */
    createLog(task: Pick<ITask, "id">, data: ITaskLogCreateInput): Promise<ITaskLog>;
    updateLog(id: string, data: ITaskLogUpdateInput): Promise<ITaskLog>;
    deleteLog(id: string): Promise<boolean>;
    getLog(id: string): Promise<ITaskLog | null>;
    getLatestLog(taskId: string): Promise<ITaskLog>;
    listLogs(params: IListTaskLogParams): Promise<IListTaskLogsResponse>;
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
    getDefinition: <
        C extends Context = Context,
        I = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    >(
        id: string
    ) => ITaskDefinition<C, I, O> | null;
    listDefinitions: () => ITaskDefinition[];
}

export interface ITaskTriggerParams<I = ITaskDataInput> {
    parent?: Pick<ITask, "id">;
    definition: string;
    name?: string;
    input?: I;
    delay?: number;
}

export interface ITaskAbortParams {
    id: string;
    message?: string;
}

export interface ITasksContextServiceObject {
    trigger: <
        T = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    >(
        params: ITaskTriggerParams<T>
    ) => Promise<ITask<T, O>>;
    abort: <
        T = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    >(
        params: ITaskAbortParams
    ) => Promise<ITask<T, O>>;
    fetchServiceInfo: (
        input: ITask<any, any> | string
    ) => Promise<IStepFunctionServiceFetchResult | null>;
}

export interface ITasksContextObject
    extends ITasksContextCrudObject,
        ITasksContextDefinitionObject,
        ITasksContextServiceObject {}

export interface Context extends BaseContext {
    tasks: ITasksContextObject;
}

export interface ITaskRunParams<
    C extends Context,
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    context: C;
    response: ITaskResponse<I, O>;
    isCloseToTimeout: IIsCloseToTimeoutCallable;
    isAborted(): boolean;
    input: I;
    store: ITaskManagerStore<I>;
    trigger<SI = ITaskDataInput>(
        params: Omit<ITaskTriggerParams<SI>, "parent">
    ): Promise<ITask<SI>>;
    timer: ITimer;
}

export interface ITaskOnSuccessParams<
    C extends Context,
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    context: C;
    task: ITask<I, O>;
}

export interface ITaskOnErrorParams<
    C extends Context,
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    context: C;
    task: ITask<I, O>;
}

export interface ITaskOnAbortParams<
    C extends Context,
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    context: C;
    task: ITask<I, O>;
}

export interface ITaskOnMaxIterationsParams<C extends Context> {
    context: C;
    task: ITask;
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
    data: ITaskCreateData<I>;
}

export interface ITaskCreateInputValidationParams<C extends Context = Context> {
    validator: typeof zod;
    context: C;
}

export interface ITaskDefinition<
    C extends Context = Context,
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    /**
     * ID of the task must be unique in the system.
     * It should be in camelCase format, for example: "myCustomTask".
     *
     * TODO: figure out a way to force camelCase in types.
     * CamelCase from type-fest does not help with this.
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
     * Maximum number a step function can call the Lambda.
     */
    maxIterations: number;
    /**
     * Disable storing logs in database for this task.
     */
    disableDatabaseLogs?: boolean;
    /**
     * Task run method.
     */
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult>;
    /**
     * When a new task is about to be triggered, we will run this method.
     * For example, you can use this method to check if there is a task of the same type already running.
     */
    onBeforeTrigger?<T = ITaskDataInput>(params: ITaskBeforeTriggerParams<C, T>): Promise<void>;
    /**
     * When task successfully finishes, this method will be called.
     * This will be called during the run time of the task.
     */
    onDone?(params: ITaskOnSuccessParams<C, I, O>): Promise<void>;
    /**
     * When task fails, this method will be called.
     * This will be called during the run time of the task.
     */
    onError?(params: ITaskOnErrorParams<C, I>): Promise<void>;
    /**
     * When task is aborted, this method will be called.
     * This method will be called when user aborts the task.
     */
    onAbort?(params: ITaskOnAbortParams<C, I, O>): Promise<void>;
    /**
     * When task hits max iterations, this method will be called.
     * This will be called during the run time of the task.
     */
    onMaxIterations?(params: ITaskOnMaxIterationsParams<C>): Promise<void>;
    /**
     * Create a validation schema for the task input.
     * This will be used to validate the input before the task is triggered.
     *
     * By default, the input validation validates the input against the fields defined in the task definition.
     * But it also passes through any fields which might not be defined in the task validation.
     */
    createInputValidation?: (
        params: ITaskCreateInputValidationParams<C>
    ) => GenericRecord<keyof I, zod.Schema> | zod.Schema;
    /**
     * Custom input fields and layout for the task input.
     */
    fields?: ITaskDefinitionField[];
    /**
     * Is the task visible when listing?
     */
    isPrivate?: boolean;
}

export interface TaskPermission extends SecurityPermission {
    name: "task";
    rwd?: string;
}
