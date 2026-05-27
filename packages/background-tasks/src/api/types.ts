import type {
    CmsContext as BaseContext,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { IResponseError } from "~/api/response/abstractions/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IStepFunctionServiceFetchResult } from "~/api/service/StepFunctionServicePlugin.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { BaseError, Result } from "@webiny/feature/api";
import type { IdInterfaceGenerator, NumericInterfaceGenerator } from "@webiny/api";
// TODO had to import for augmentation to work, but is there a better way to do this?
import "./features/TaskController/augmentation.js";

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
    displayName: string;
    type: string;
}

export type IGetTaskResponse<
    T extends TaskService.TaskInput = TaskService.TaskInput,
    O extends TaskService.GenericOutput = TaskService.GenericOutput
> = ITask<T, O> | null;

export interface IListTasksResponse<
    T extends TaskService.TaskInput = TaskService.TaskInput,
    O extends TaskService.GenericOutput = TaskService.GenericOutput
> {
    items: ITask<T, O>[];
    meta: CmsEntryMeta;
}

export interface IListTaskLogsResponse {
    items: ITaskLog[];
    meta: CmsEntryMeta;
}

export type ICreateTaskResponse<
    T extends TaskService.TaskInput = TaskService.TaskInput,
    O extends TaskService.GenericOutput = TaskService.GenericOutput
> = ITask<T, O>;
export type IUpdateTaskResponse<
    T extends TaskService.TaskInput = TaskService.TaskInput,
    O extends TaskService.GenericOutput = TaskService.GenericOutput
> = ITask<T, O>;
export type IDeleteTaskResponse = boolean;

export interface IListTaskParamsWhere
    extends
        IdInterfaceGenerator<"id">,
        IdInterfaceGenerator<"parentId">,
        IdInterfaceGenerator<"definitionId">,
        IdInterfaceGenerator<"taskStatus"> {
    //
}

export interface IListTaskParams extends Omit<CmsEntryListParams, "fields" | "search"> {
    where?: IListTaskParamsWhere;
}

export interface IListTaskLogParamsWhere
    extends
        IdInterfaceGenerator<"id">,
        IdInterfaceGenerator<"task">,
        NumericInterfaceGenerator<"iteration"> {}

export interface IListTaskLogParams extends Omit<
    CmsEntryListParams,
    "fields" | "search" | "where"
> {
    where?: IListTaskLogParamsWhere;
}

export interface ITaskCreateData<T extends TaskDefinition.TaskInput = TaskDefinition.TaskInput> {
    definitionId: string;
    name: string;
    input: T;
    parentId?: string;
}

export interface ITaskUpdateData<
    I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
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
    getTask<
        T extends TaskService.TaskInput = TaskService.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        id: string
    ): Promise<IGetTaskResponse<T, O> | null>;
    listTasks<
        T extends TaskService.TaskInput = TaskService.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params?: IListTaskParams
    ): Promise<IListTasksResponse<T, O>>;
    createTask<T extends TaskService.TaskInput = TaskService.TaskInput>(
        task: ITaskCreateData<T>
    ): Promise<ICreateTaskResponse<T>>;
    updateTask<
        T extends TaskService.TaskInput = TaskService.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        id: string,
        data: Partial<ITaskUpdateData<T, O>>
    ): Promise<IUpdateTaskResponse<T, O>>;
    deleteTask(id: string): Promise<IDeleteTaskResponse>;
    /**
     * Recursively delete a task, its logs (if any were written), and its entire
     * descendant subtree. Best-effort: per-record failures are logged and swallowed,
     * the method never throws.
     */
    cleanupTaskSubtree(id: string): Promise<void>;
    /**
     * Logs
     */
    createLog(task: Pick<ITask, "id">, data: ITaskLogCreateInput): Promise<ITaskLog>;
    updateLog(id: string, data: ITaskLogUpdateInput): Promise<ITaskLog>;
    deleteLog(id: string): Promise<boolean>;
    getLog(id: string): Promise<ITaskLog | null>;
    getLatestLog(taskId: string): Promise<ITaskLog>;
    listLogs(params: IListTaskLogParams): Promise<IListTaskLogsResponse>;
}

export interface ITasksContextDefinitionObject {
    getDefinition: <
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    >(
        id: string
    ) => TaskDefinition.Runnable<I, O> | null;
    listDefinitions: () => TaskDefinition.Interface[];
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
        T extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params: ITaskTriggerParams<T>
    ) => Promise<Result<ITask<T, O>, BaseError>>;
    abort: <
        T extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params: ITaskAbortParams
    ) => Promise<Result<ITask<T, O>, BaseError>>;
    fetchServiceInfo: (
        input: ITask<any, any> | string
    ) => Promise<Result<IStepFunctionServiceFetchResult, BaseError>>;
}

export interface ITasksContextObject
    extends ITasksContextCrudObject, ITasksContextDefinitionObject, ITasksContextServiceObject {}

export interface Context extends BaseContext {
    tasks: ITasksContextObject;
}

export interface TaskPermission extends SecurityPermission {
    name: "task";
    rwd?: string;
}

export type ITask<
    I extends TaskService.TaskInput = TaskService.TaskInput,
    O extends TaskService.GenericOutput = TaskService.GenericOutput
> = TaskService.Task<I, O>;

export type SelfCleanup = TaskDefinition.SelfCleanup;
export type SelfCleanupEvent = TaskDefinition.SelfCleanupEvent;
