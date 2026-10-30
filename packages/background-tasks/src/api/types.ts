import type {
    CmsContext as BaseContext,
    CmsEntryListParams,
    CmsEntryMeta
} from "@webiny/api-headless-cms/types/index.js";
import type { IResponseError } from "~/api/response/abstractions/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
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

export interface Context extends BaseContext {}

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
