import { BaseError, Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type {
    IServiceInfo,
    ITaskAbortParams,
    ITaskTriggerParams
} from "@webiny/api-core/features/task/TaskService/abstractions.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
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
    TaskServiceInfoError
} from "~/api/domain/errors.js";
import { TaskTriggerError } from "~/api/domain/errors.js";
import { TaskDataStatus, TaskLogItemType } from "~/api/types.js";
import type { ITaskLog } from "~/api/types.js";

type TaskInput = TaskService.TaskInput;
type TaskOutput = TaskService.GenericOutput;

const MAX_DELAY_DAYS = 355;
const MAX_DELAY_SECONDS = MAX_DELAY_DAYS * 24 * 60 * 60;

// A delay that isn't a positive whole number is ignored, so only a too long one is rejected.
const isDelayTooLong = (delay: number): boolean => {
    if (!delay || delay < 0 || Number.isInteger(delay) === false) {
        return false;
    }
    return delay >= MAX_DELAY_SECONDS;
};

/**
 * The public TaskService: stores a task and hands it to the transport (Step Functions, the worker),
 * aborts a running task, and reads what the transport knows about one. Every failure is returned,
 * never thrown, so a caller that checks `isFail()` sees all of them.
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
    ): Promise<Result<TaskService.Task<I, O>, BaseError<any>>> {
        const { definition: id, input: inputValues, name, parent, delay = 0 } = params;
        const transport = this.findTransport();
        if (!transport) {
            return Result.fail(
                new TaskTriggerError({ message: "Missing TaskService.", definitionId: id })
            );
        }
        const definitionResult = this.getDefinition.execute(id);
        if (definitionResult.isFail()) {
            return Result.fail(new TaskDefinitionNotFoundError(id));
        }
        const definition = definitionResult.value;
        const input: TaskDefinition.TaskCreateData<I> = {
            name: name || definition.title,
            definitionId: id,
            input: inputValues || ({} as I),
            parentId: parent?.id
        };

        if (definition.onBeforeTrigger) {
            try {
                await definition.onBeforeTrigger({ data: input, definition });
            } catch (ex) {
                const error = TaskTriggerError.from(ex, id);
                return Result.fail(error);
            }
        }
        if (isDelayTooLong(delay)) {
            return Result.fail(
                new TaskTriggerError({
                    message: `The maximum delay for a task is ${MAX_DELAY_DAYS} days.`,
                    definitionId: id
                })
            );
        }

        // A task event handler can throw. That would reject the trigger, so it becomes a failure.
        const created = await this.createTask
            .execute<I>(input)
            .catch((ex: unknown) => Result.fail(TaskTriggerError.from(ex, id)));
        if (created.isFail()) {
            this.logger.error({ error: created.error }, "Could not create the task.");
            return Result.fail(created.error);
        }
        const task = created.value;

        let response: unknown = null;
        try {
            response = await transport.send(task, delay);
        } catch (ex) {
            this.logger.error({ error: ex }, "Could not trigger the step function.");
            // The task can't run, so don't leave it behind as pending.
            await this.deleteTask.execute(task.id);
            const error = TaskTriggerError.from(ex, id);
            return Result.fail(error);
        }
        if (!response) {
            this.logger.error({ task }, "Could not trigger the step function.");
            await this.deleteTask.execute(task.id);
            return Result.fail(
                new TaskTriggerError({
                    message: "Could not trigger the step function!",
                    definitionId: id
                })
            );
        }

        const eventResponse = response as Record<string, any>;
        const updated = await this.updateTask.execute<I, O>(task.id, { eventResponse });
        if (updated.isFail()) {
            // The transport has the task and will run it, so this is not a failed trigger. Only the
            // stored event response is missing.
            this.logger.error(
                { error: updated.error, id: task.id },
                "Could not store the task's event response."
            );
            // A task that was just created has no output yet, so it fits any output type.
            const queued = { ...task, eventResponse } as TaskService.Task<I, O>;
            return Result.ok(queued);
        }

        return updated;
    }

    async fetchServiceInfo(
        input: TaskService.Task | string
    ): Promise<Result<IServiceInfo, BaseError<any>>> {
        const transport = this.findTransport();
        if (!transport) {
            return Result.fail(new TaskServiceInfoError());
        }
        let task: TaskService.Task;
        if (typeof input === "object") {
            task = input;
        } else {
            const taskResult = await this.getTask.execute(input);
            if (taskResult.isFail()) {
                return Result.fail(taskResult.error);
            }
            task = taskResult.value;
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
        const taskResult = await this.getTask.execute<I, O>(params.id);
        if (taskResult.isFail()) {
            return Result.fail(taskResult.error);
        }
        const task = taskResult.value;

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
        if (taskLog.isFail()) {
            return Result.fail(taskLog.error);
        }
        const updated = await this.updateTask.execute<I, O>(task.id, {
            taskStatus: TaskDataStatus.ABORTED
        });
        if (updated.isFail()) {
            return Result.fail(updated.error);
        }
        const items = taskLog.value.items.concat([
            {
                message: params.message || "Task aborted.",
                type: TaskLogItemType.INFO,
                createdOn: new Date().toISOString()
            }
        ]);
        const logUpdate = await this.updateTaskLog.execute(taskLog.value.id, { items });
        if (logUpdate.isFail()) {
            // The task is aborted by now, so a missing log entry must not skip the onAbort hook.
            this.logger.error(
                { error: logUpdate.error, id: task.id },
                "Could not write the abort to the task log."
            );
        }
        // TODO: determine when to kick off the onAbort hook
        if (definition.onAbort) {
            // The task is aborted by now, so a failing hook is logged and doesn't undo that.
            try {
                await definition.onAbort({ task: updated.value, definition });
            } catch (ex) {
                this.logger.error({ error: ex, id: task.id }, "The task's onAbort hook failed.");
            }
        }

        return Result.ok(updated.value);
    }

    private findTransport(): TaskTransport.Interface | undefined {
        // The last registration wins, so a test or a deployment can swap the transport.
        return this.transports[this.transports.length - 1];
    }

    private async getOrCreateLog(
        task: TaskService.Task<any, any>
    ): Promise<Result<ITaskLog, BaseError<any>>> {
        const latest = await this.getLatestTaskLog.execute(task.id);
        if (latest.isOk()) {
            return latest;
        }
        return await this.createTaskLog.execute(task, {
            iteration: 1,
            executionName: task.executionName
        });
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
