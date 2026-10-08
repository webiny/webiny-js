import type {
    IListTaskParamsWhere,
    ITask,
    ITaskDataInput,
    ITaskLog,
    ITaskManagerStoreInfoLog,
    ITaskManagerStorePrivate,
    ITaskManagerStoreSetOutputOptions,
    ITaskManagerStoreUpdateTaskInputOptions,
    ITaskManagerStoreUpdateTaskOptions,
    TaskDataStatus
} from "~/api/types.js";
import type { TaskLogsRepository, TasksRepository } from "~/api/domain/task/abstractions.js";
import type { UpdateTaskUseCase } from "~/api/features/UpdateTask/index.js";
import type { Container } from "@webiny/feature/api";
import { TaskLogItemType } from "~/api/types.js";
import type {
    ITaskManagerStoreAddLogOptions,
    ITaskManagerStoreErrorLog,
    ITaskManagerStoreUpdateTaskInputParam,
    ITaskManagerStoreUpdateTaskParams
} from "./abstractions/index.js";
/**
 * Package deep-equal does not have types.
 */
import deepEqual from "deep-equal";
import { getObjectProperties } from "~/api/utils/getObjectProperties.js";
import { ObjectUpdater } from "~/api/utils/ObjectUpdater.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

const getInput = <T extends ITaskDataInput = ITaskDataInput>(
    originalInput: T,
    input: ITaskManagerStoreUpdateTaskInputParam<T>
): T => {
    if (typeof input === "function") {
        return input(originalInput);
    }
    return {
        ...originalInput,
        ...input
    };
};

export interface TaskManagerStoreContext {
    container: Container;
}

export interface ITaskManagerStoreParams {
    context: TaskManagerStoreContext;
    task: ITask;
    log: ITaskLog;
    databaseLogs: boolean;
    /**
     * Supplied by the caller rather than pulled from `context.container`, so the store's
     * collaborators are visible in its signature and a test can substitute them.
     */
    tasks: TasksRepository.Interface;
    logs: TaskLogsRepository.Interface;
    updateTask: UpdateTaskUseCase.Interface;
}

export class TaskManagerStore<
    T extends ITaskDataInput = ITaskDataInput,
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
> implements ITaskManagerStorePrivate<T, O> {
    private readonly context: TaskManagerStoreContext;
    private readonly tasks: TasksRepository.Interface;
    private readonly logs: TaskLogsRepository.Interface;
    private readonly updateTaskUseCase: UpdateTaskUseCase.Interface;
    private task: ITask<T, O>;
    private taskLog: ITaskLog;
    private readonly databaseLogs: boolean;

    private readonly taskUpdater = new ObjectUpdater<ITask<T, O>>();
    private readonly taskLogUpdater = new ObjectUpdater<ITaskLog>();

    public constructor(params: ITaskManagerStoreParams) {
        this.context = params.context;
        this.tasks = params.tasks;
        this.logs = params.logs;
        this.updateTaskUseCase = params.updateTask;
        this.task = params.task as ITask<T, O>;
        this.taskLog = params.log;
        this.databaseLogs = params.databaseLogs === true;
    }

    public getStatus(): TaskDataStatus {
        return this.task.taskStatus;
    }

    public getTask(): ITask<T, O> {
        return this.task as ITask<T, O>;
    }

    public async listChildTasks<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    >(definitionId?: string): Promise<ITask<I, O>[]> {
        const where: IListTaskParamsWhere = {
            parentId: this.task.id
        };
        if (definitionId) {
            where.definitionId = definitionId;
        }
        const result = await this.tasks.list<I, O>({
            where,
            sort: ["createdOn_ASC"],
            limit: 1000000
        });
        if (result.isFail()) {
            throw result.error;
        }
        return result.value.items;
    }

    public async updateTask(
        param: ITaskManagerStoreUpdateTaskParams<T, O>,
        options?: ITaskManagerStoreUpdateTaskOptions
    ): Promise<void> {
        const data = typeof param === "function" ? param(this.task) : param;

        /**
         * No need to update if nothing changed.
         */
        if (deepEqual(data, this.task)) {
            return;
        }

        this.taskUpdater.update(data);

        if (options?.save === false) {
            return;
        }
        await this.save();
    }

    public async updateInput(
        param: ITaskManagerStoreUpdateTaskInputParam<T>,
        options?: ITaskManagerStoreUpdateTaskInputOptions
    ): Promise<void> {
        const input = getInput<T>(this.task.input, param);

        /**
         * No need to update if nothing changed.
         */
        if (deepEqual(input, this.task.input)) {
            return;
        }
        this.taskUpdater.update({
            input: input as T
        });
        if (options?.save === false) {
            return;
        }
        await this.save();
    }

    public getInput(): T {
        return this.task.input as T;
    }

    public async updateOutput(
        values: Partial<O>,
        options: ITaskManagerStoreSetOutputOptions = {}
    ): Promise<void> {
        this.taskUpdater.update({
            output: values as O
        });
        if (options?.save === false) {
            return;
        }
        await this.save();
    }

    public getOutput(): O {
        return this.task.output as O;
    }
    /**
     * Currently the methods throws an error if something goes wrong during the database update.
     * TODO: Maybe we should wrap it into try/catch and return error if any?
     */
    public async addInfoLog(
        log: ITaskManagerStoreInfoLog,
        options?: ITaskManagerStoreAddLogOptions
    ): Promise<void> {
        if (!this.databaseLogs) {
            return;
        }
        this.taskLogUpdater.update({
            items: [
                {
                    message: log.message,
                    data: log.data,
                    type: TaskLogItemType.INFO,
                    createdOn: new Date().toISOString()
                }
            ]
        });
        if (options?.save === false) {
            return;
        }

        await this.save();
    }
    /**
     * Currently the methods throws an error if something goes wrong during the database update.
     * TODO: Maybe we should wrap it into try/catch and return error if any?
     */
    public async addErrorLog(
        log: ITaskManagerStoreErrorLog,
        options?: ITaskManagerStoreAddLogOptions
    ): Promise<void> {
        if (!this.databaseLogs) {
            return;
        }
        /**
         * Let's log the error to the console as well.
         */
        console.error(log.error);
        /**
         * Then update the log object.
         */
        this.taskLogUpdater.update({
            items: [
                {
                    message: log.message,
                    error: log.error instanceof Error ? getObjectProperties(log.error) : log.error,
                    type: TaskLogItemType.ERROR,
                    createdOn: new Date().toISOString()
                }
            ]
        });
        if (options?.save === false) {
            return;
        }
        await this.save();
    }

    public async save(): Promise<void> {
        /**
         * Update both task and the log, if anything to update.
         */
        if (this.taskUpdater.isDirty()) {
            const result = await this.updateTaskUseCase.execute<T, O>(
                this.task.id,
                this.taskUpdater.fetch()
            );
            if (result.isFail()) {
                throw result.error;
            }
            this.task = result.value;
        }
        if (!this.databaseLogs) {
            return;
        }
        if (this.taskLogUpdater.isDirty()) {
            const result = await this.logs.update(this.taskLog.id, this.taskLogUpdater.fetch());
            if (result.isFail()) {
                throw result.error;
            }
            this.taskLog = result.value;
        }
    }
}
