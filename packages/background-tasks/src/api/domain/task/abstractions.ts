import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type {
    IListTaskLogParams,
    IListTaskLogsResponse,
    IListTaskParams,
    IListTasksResponse,
    ITaskCreateData,
    ITaskLog,
    ITaskLogCreateInput,
    ITaskLogUpdateInput,
    ITaskUpdateData
} from "~/api/types.js";
import type {
    BackgroundTaskPersistenceError,
    TaskLogNotFoundError,
    TaskNotFoundError
} from "~/api/domain/errors.js";

// ============================================================================
// Model providers
// ============================================================================

export interface ITaskModelProvider {
    get(): Promise<CmsModel>;
}

/** The private CMS model that stores background tasks. */
export const TaskModelProvider = createAbstraction<ITaskModelProvider>("Tasks/TaskModelProvider");

export namespace TaskModelProvider {
    export type Interface = ITaskModelProvider;
}

export interface ITaskLogModelProvider {
    get(): Promise<CmsModel>;
}

/** The private CMS model that stores background task logs. */
export const TaskLogModelProvider = createAbstraction<ITaskLogModelProvider>(
    "Tasks/TaskLogModelProvider"
);

export namespace TaskLogModelProvider {
    export type Interface = ITaskLogModelProvider;
}

// ============================================================================
// Tasks repository
// ============================================================================

type TaskInput = TaskService.TaskInput;
type TaskOutput = TaskService.GenericOutput;

export interface ITasksRepository {
    get<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        id: string
    ): Promise<Result<TaskService.Task<I, O>, TaskNotFoundError | BackgroundTaskPersistenceError>>;
    list<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        params?: IListTaskParams
    ): Promise<Result<IListTasksResponse<I, O>, BackgroundTaskPersistenceError>>;
    create<I extends TaskInput = TaskInput>(
        data: ITaskCreateData<I>
    ): Promise<Result<TaskService.Task<I>, BackgroundTaskPersistenceError>>;
    update<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        id: string,
        data: Partial<ITaskUpdateData<I, O>>
    ): Promise<Result<TaskService.Task<I, O>, TaskNotFoundError | BackgroundTaskPersistenceError>>;
    delete(id: string): Promise<Result<void, TaskNotFoundError | BackgroundTaskPersistenceError>>;
}

/** Reads and writes background tasks. Publishes no events; the task use cases do that. */
export const TasksRepository = createAbstraction<ITasksRepository>("Tasks/TasksRepository");

export namespace TasksRepository {
    export type Interface = ITasksRepository;
}

// ============================================================================
// Task logs repository
// ============================================================================

type LogError = TaskLogNotFoundError | BackgroundTaskPersistenceError;

export interface ITaskLogsRepository {
    create(
        task: Pick<TaskService.Task, "id">,
        data: ITaskLogCreateInput
    ): Promise<Result<ITaskLog, BackgroundTaskPersistenceError>>;
    update(id: string, data: ITaskLogUpdateInput): Promise<Result<ITaskLog, LogError>>;
    delete(id: string): Promise<Result<void, LogError>>;
    get(id: string): Promise<Result<ITaskLog, LogError>>;
    getLatest(taskId: string): Promise<Result<ITaskLog, LogError>>;
    list(
        params: IListTaskLogParams
    ): Promise<Result<IListTaskLogsResponse, BackgroundTaskPersistenceError>>;
}

/** Reads and writes the logs of background tasks. */
export const TaskLogsRepository = createAbstraction<ITaskLogsRepository>(
    "Tasks/TaskLogsRepository"
);

export namespace TaskLogsRepository {
    export type Interface = ITaskLogsRepository;
}
