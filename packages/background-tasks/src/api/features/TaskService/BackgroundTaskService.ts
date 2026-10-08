import WebinyError from "@webiny/error";
import { BaseError, Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type {
    IServiceInfo,
    ITaskAbortParams,
    ITaskTriggerParams
} from "@webiny/api-core/features/task/TaskService/abstractions.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { NotFoundError } from "@webiny/api-graphql";
import { TaskService as TaskTransport } from "~/api/domain/TaskService.js";
import { GetTaskUseCase } from "~/api/features/GetTask/index.js";
import { CreateTaskLogUseCase } from "~/api/features/CreateTaskLog/index.js";
import { GetLatestTaskLogUseCase } from "~/api/features/GetLatestTaskLog/index.js";
import { UpdateTaskLogUseCase } from "~/api/features/UpdateTaskLog/index.js";
import { CreateTaskUseCase } from "~/api/features/CreateTask/index.js";
import { UpdateTaskUseCase } from "~/api/features/UpdateTask/index.js";
import { DeleteTaskUseCase } from "~/api/features/DeleteTask/index.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/index.js";
import {
    TaskAbortError,
    TaskDefinitionNotFoundError,
    TaskNotFoundError,
    TaskServiceInfoError
} from "~/api/domain/errors.js";
import { TaskDataStatus, TaskLogItemType } from "~/api/types.js";
import type { ITaskLog } from "~/api/types.js";

type TaskInput = TaskService.TaskInput;
type TaskOutput = TaskService.GenericOutput;

const MAX_DELAY_DAYS = 355;
const MAX_DELAY_SECONDS = MAX_DELAY_DAYS * 24 * 60 * 60;

const validateDelay = (input: TaskDefinition.TaskCreateData<any>, delay: number): void => {
    if (!delay || delay < 0 || Number.isInteger(delay) === false) {
        return;
    } else if (delay < MAX_DELAY_SECONDS) {
        return;
    }
    throw new WebinyError(
        `The maximum delay for a task is ${MAX_DELAY_DAYS} days.`,
        "MAX_DELAY_ERROR",
        { ...input, delay }
    );
};

/**
 * The public TaskService: stores a task and hands it to the transport (Step Functions, the worker),
 * aborts a running task, and reads what the transport knows about one.
 */
class BackgroundTaskServiceImpl implements TaskService.Interface {
    constructor(
        private readonly getDefinition: GetRunnableTaskDefinitionUseCase.Interface,
        private readonly createTask: CreateTaskUseCase.Interface,
        private readonly updateTask: UpdateTaskUseCase.Interface,
        private readonly deleteTask: DeleteTaskUseCase.Interface,
        private readonly getTask: GetTaskUseCase.Interface,
        private readonly getLatestTaskLog: GetLatestTaskLogUseCase.Interface,
        private readonly createTaskLog: CreateTaskLogUseCase.Interface,
        private readonly updateTaskLog: UpdateTaskLogUseCase.Interface,
        private readonly transports: TaskTransport.Interface[],
        private readonly logger: Logger.Interface
    ) {}

    async trigger<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        params: ITaskTriggerParams<I>
    ): Promise<Result<TaskService.Task<I, O>, BaseError>> {
        const transport = this.getTransport();
        const { definition: id, input: inputValues, name, parent, delay = 0 } = params;
        const definitionResult = this.getDefinition.execute(id);
        if (definitionResult.isFail()) {
            throw new WebinyError(`Task definition was not found!`, "TASK_DEFINITION_ERROR", {
                id
            });
        }
        const definition = definitionResult.value;
        const input: TaskDefinition.TaskCreateData<I> = {
            name: name || definition.title,
            definitionId: id,
            input: inputValues || ({} as I),
            parentId: parent?.id
        };

        if (definition.onBeforeTrigger) {
            await definition.onBeforeTrigger({ data: input, definition });
        }
        validateDelay(input, delay);

        const created = await this.createTask.execute<I>(input);
        if (created.isFail()) {
            this.logger.error({ error: created.error }, "Could not create the task.");
            throw created.error;
        }
        const task = created.value;

        let response: unknown = null;
        try {
            response = await transport.send(task, delay);
            if (!response) {
                throw new WebinyError(
                    `Could not trigger the step function!`,
                    "TRIGGER_STEP_FUNCTION_ERROR",
                    { task }
                );
            }
        } catch (ex) {
            this.logger.error({ error: ex }, "Could not trigger the step function.");
            // The task can't run, so don't leave it behind as pending.
            await this.deleteTask.execute(task.id);
            throw ex;
        }

        const updated = await this.updateTask.execute<I, O>(task.id, {
            eventResponse: response as Record<string, any>
        });
        if (updated.isFail()) {
            throw updated.error;
        }

        return Result.ok(updated.value);
    }

    async fetchServiceInfo(
        input: TaskService.Task | string
    ): Promise<Result<IServiceInfo, BaseError>> {
        const transport = this.getTransport();
        const task = typeof input === "object" ? input : await this.getTask.execute(input);
        if (!task && typeof input === "string") {
            throw new NotFoundError(`Task "${input}" was not found!`);
        } else if (!task) {
            throw new WebinyError(`Task was not found!`, "TASK_FETCH_ERROR", { input });
        }

        try {
            const info = (await transport.fetch(task)) as IServiceInfo | null;
            if (info) {
                return Result.ok(info);
            }
            return Result.fail(new TaskServiceInfoError());
        } catch (ex) {
            this.logger.error({ error: ex }, "Service fetch error.");
            return Result.fail(new TaskServiceInfoError());
        }
    }

    async abort<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        params: ITaskAbortParams
    ): Promise<Result<TaskService.Task<I, O>, BaseError<any>>> {
        const task = await this.getTask.execute<I, O>(params.id);
        if (!task) {
            return Result.fail(new TaskNotFoundError());
        }

        const definitionResult = this.getDefinition.execute<I, O>(task.definitionId);
        if (definitionResult.isFail()) {
            return Result.fail(new TaskDefinitionNotFoundError(task.definitionId));
        }
        const definition = definitionResult.value;

        // Only a pending or running task can be aborted.
        if ([TaskDataStatus.PENDING, TaskDataStatus.RUNNING].includes(task.taskStatus) === false) {
            return Result.fail(new TaskAbortError({ id: params.id, status: task.taskStatus }));
        }

        const taskLog = await this.getOrCreateLog(task);
        try {
            const updated = await this.updateTask.execute<I, O>(task.id, {
                taskStatus: TaskDataStatus.ABORTED
            });
            if (updated.isFail()) {
                throw updated.error;
            }
            const logUpdate = await this.updateTaskLog.execute(taskLog.id, {
                items: taskLog.items.concat([
                    {
                        message: params.message || "Task aborted.",
                        type: TaskLogItemType.INFO,
                        createdOn: new Date().toISOString()
                    }
                ])
            });
            if (logUpdate.isFail()) {
                throw logUpdate.error;
            }
            // TODO: determine when to kick off the onAbort hook
            if (definition.onAbort) {
                await definition.onAbort({ task: updated.value, definition });
            }

            return Result.ok(updated.value);
        } catch (ex) {
            throw new WebinyError(`Could not abort the task!`, "TASK_ABORT_ERROR", {
                id: params.id,
                message: ex.message
            });
        }
    }

    private getTransport(): TaskTransport.Interface {
        // The last registration wins, so a test or a deployment can swap the transport.
        const transport = this.transports[this.transports.length - 1];
        if (!transport) {
            throw new WebinyError("Missing TaskService.", "TASK_SERVICE_ERROR");
        }
        return transport;
    }

    private async getOrCreateLog(task: TaskService.Task<any, any>): Promise<ITaskLog> {
        const latest = await this.getLatestTaskLog.execute(task.id);
        if (latest.isOk()) {
            return latest.value;
        }
        const created = await this.createTaskLog.execute(task, {
            iteration: 1,
            executionName: task.executionName
        });
        if (created.isFail()) {
            throw created.error;
        }
        return created.value;
    }
}

export const BackgroundTaskService = TaskService.createImplementation({
    implementation: BackgroundTaskServiceImpl,
    dependencies: [
        GetRunnableTaskDefinitionUseCase,
        CreateTaskUseCase,
        UpdateTaskUseCase,
        DeleteTaskUseCase,
        GetTaskUseCase,
        GetLatestTaskLogUseCase,
        CreateTaskLogUseCase,
        UpdateTaskLogUseCase,
        [TaskTransport, { multiple: true }],
        Logger
    ]
});
