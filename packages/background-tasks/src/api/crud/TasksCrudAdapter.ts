import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TasksCrud } from "~/api/TasksCrud.js";
import {
    TaskLogModelProvider,
    TaskLogsRepository,
    TaskModelProvider,
    TasksRepository
} from "~/api/domain/task/abstractions.js";
import { CreateTaskUseCase } from "~/api/features/CreateTask/index.js";
import { UpdateTaskUseCase } from "~/api/features/UpdateTask/index.js";
import { DeleteTaskUseCase } from "~/api/features/DeleteTask/index.js";
import { CleanupTaskSubtreeUseCase } from "~/api/features/CleanupTaskSubtree/index.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/index.js";
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/index.js";
import { NotFoundError } from "@webiny/api-graphql";
import { TaskLogNotFoundError } from "~/api/domain/errors.js";
import type {
    IListTaskLogParams,
    IListTaskParams,
    ITaskCreateData,
    ITaskLogCreateInput,
    ITaskLogUpdateInput,
    ITaskUpdateData
} from "~/api/types.js";

type TaskInput = TaskService.TaskInput;
type TaskOutput = TaskService.GenericOutput;

/*
 * The old TasksCrud API, kept for its remaining callers on top of the task use cases and
 * repositories. Every method behaves as before: reads that find nothing return null, everything
 * else throws instead of returning a Result.
 */
class TasksCrudAdapterImpl implements TasksCrud.Interface {
    constructor(
        private readonly taskModel: TaskModelProvider.Interface,
        private readonly logModel: TaskLogModelProvider.Interface,
        private readonly tasks: TasksRepository.Interface,
        private readonly logs: TaskLogsRepository.Interface,
        private readonly createTaskUseCase: CreateTaskUseCase.Interface,
        private readonly updateTaskUseCase: UpdateTaskUseCase.Interface,
        private readonly deleteTaskUseCase: DeleteTaskUseCase.Interface,
        private readonly cleanupTaskSubtreeUseCase: CleanupTaskSubtreeUseCase.Interface,
        private readonly getDefinitionUseCase: GetRunnableTaskDefinitionUseCase.Interface,
        private readonly listDefinitionsUseCase: ListTaskDefinitionsUseCase.Interface,
        private readonly taskService: TaskService.Interface
    ) {}

    getTaskModel(): Promise<CmsModel> {
        return this.taskModel.get();
    }

    getLogModel(): Promise<CmsModel> {
        return this.logModel.get();
    }

    async getTask<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(id: string) {
        const result = await this.tasks.get<I, O>(id);
        return result.isOk() ? result.value : null;
    }

    async listTasks<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        params?: IListTaskParams
    ) {
        const result = await this.tasks.list<I, O>(params);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }

    async createTask<I extends TaskInput = TaskInput>(data: ITaskCreateData<I>) {
        const result = await this.createTaskUseCase.execute<I>(data);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }

    async updateTask<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        id: string,
        data: Partial<ITaskUpdateData<I, O>>
    ) {
        const result = await this.updateTaskUseCase.execute<I, O>(id, data);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }

    async deleteTask(id: string) {
        const result = await this.deleteTaskUseCase.execute(id);
        if (result.isFail()) {
            throw result.error;
        }
        return true;
    }

    cleanupTaskSubtree(id: string): Promise<void> {
        return this.cleanupTaskSubtreeUseCase.execute(id);
    }

    async createLog(task: Pick<TaskService.Task, "id">, data: ITaskLogCreateInput) {
        const result = await this.logs.create(task, data);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }

    async updateLog(id: string, data: ITaskLogUpdateInput) {
        const result = await this.logs.update(id, data);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }

    async deleteLog(id: string) {
        const result = await this.logs.delete(id);
        if (result.isFail()) {
            throw result.error;
        }
        return true;
    }

    async getLog(id: string) {
        const result = await this.logs.get(id);
        if (result.isOk()) {
            return result.value;
        } else if (result.error instanceof TaskLogNotFoundError) {
            return null;
        }
        throw result.error;
    }

    async getLatestLog(taskId: string) {
        const result = await this.logs.getLatest(taskId);
        if (result.isOk()) {
            return result.value;
        } else if (result.error instanceof TaskLogNotFoundError) {
            // The runner checks for this code to tell "no log yet" from a real failure.
            throw new NotFoundError(`No existing latest log found for task "${taskId}".`);
        }
        throw result.error;
    }

    async listLogs(params: IListTaskLogParams) {
        const result = await this.logs.list(params);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }

    getDefinition<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    >(id: string) {
        const result = this.getDefinitionUseCase.execute<I, O>(id);
        return result.isOk() ? result.value : null;
    }

    listDefinitions() {
        return this.listDefinitionsUseCase.execute();
    }

    trigger: TaskService.Interface["trigger"] = params => this.taskService.trigger(params);

    abort: TaskService.Interface["abort"] = params => this.taskService.abort(params);

    fetchServiceInfo: TaskService.Interface["fetchServiceInfo"] = input =>
        this.taskService.fetchServiceInfo(input);
}

export const TasksCrudAdapter = TasksCrud.createImplementation({
    implementation: TasksCrudAdapterImpl,
    dependencies: [
        TaskModelProvider,
        TaskLogModelProvider,
        TasksRepository,
        TaskLogsRepository,
        CreateTaskUseCase,
        UpdateTaskUseCase,
        DeleteTaskUseCase,
        CleanupTaskSubtreeUseCase,
        GetRunnableTaskDefinitionUseCase,
        ListTaskDefinitionsUseCase,
        TaskService
    ]
});
