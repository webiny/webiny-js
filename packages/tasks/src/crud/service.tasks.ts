import WebinyError from "@webiny/error";
import type {
    Context,
    ITaskAbortParams,
    ITaskCreateData,
    ITaskLog,
    ITasksContextServiceObject,
    ITaskTriggerParams
} from "~/types.js";
import { TaskDataStatus, TaskLogItemType } from "~/types.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { createService } from "~/service/index.js";
import type { IStepFunctionServiceFetchResult } from "~/service/StepFunctionServicePlugin.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { BaseError, Result } from "@webiny/feature/api";
import { TaskAbortError, TaskDefinitionNotFoundError, TaskNotFoundError, TaskServiceInfoError } from "~/domain/errors.js";

const MAX_DELAY_DAYS = 355;
const MAX_DELAY_SECONDS = MAX_DELAY_DAYS * 24 * 60 * 60;

interface ValidateDelayParams<T extends TaskService.TaskInput> {
    input: ITaskCreateData<T>;
    delay?: number;
}

const validateDelay = <T extends TaskService.TaskInput = TaskService.TaskInput>({
    input,
    delay
}: ValidateDelayParams<T>): void => {
    if (!delay || delay < 0 || typeof delay !== "number" || Number.isInteger(delay) === false) {
        return;
    } else if (delay < MAX_DELAY_SECONDS) {
        return;
    }
    throw new WebinyError(
        `The maximum delay for a task is ${MAX_DELAY_DAYS} days.`,
        "MAX_DELAY_ERROR",
        {
            ...input,
            delay
        }
    );
};

export const createServiceCrud = (context: Context): ITasksContextServiceObject => {
    const service = createService({
        context
    });

    return {
        trigger: async <
            T extends TaskService.TaskInput = TaskService.TaskInput,
            O extends TaskService.GenericOutput = TaskService.GenericOutput
        >(
            params: ITaskTriggerParams<T>
        ): Promise<Result<TaskService.Task<T, O>, BaseError>> => {
            const { definition: id, input: inputValues, name, parent, delay = 0 } = params;
            const definition = context.tasks.getDefinition(id);
            if (!definition) {
                throw new WebinyError(`Task definition was not found!`, "TASK_DEFINITION_ERROR", {
                    id
                });
            }
            const input: TaskDefinition.TaskCreateData<T> = {
                name: name || definition.title,
                definitionId: id,
                input: inputValues || ({} as T),
                parentId: parent?.id
            };

            if (definition.onBeforeTrigger) {
                await definition.onBeforeTrigger({ data: input });
            }
            validateDelay<T>({
                input,
                delay
            });

            let task: TaskService.Task<T>;
            try {
                task = await context.tasks.createTask<T>(input);
            } catch (ex) {
                console.log("Could not create the task.", ex);
                throw ex;
            }

            let result: Awaited<ReturnType<typeof service.send>> | null = null;
            try {
                result = await service.send(task, delay);

                if (!result) {
                    throw new WebinyError(
                        `Could not trigger the step function!`,
                        "TRIGGER_STEP_FUNCTION_ERROR",
                        {
                            task
                        }
                    );
                }
            } catch (ex) {
                console.log("Could not trigger the step function.");
                console.error(ex);
                /**
                 * In case of failure to create the Event Bridge Event, we need to delete the task that was meant to be created.
                 * TODO maybe we can leave the task and update it as failed - with event bridge error?
                 */
                await context.tasks.deleteTask(task.id);
                throw ex;
            }

            const updatedTask = await context.tasks.updateTask<T, O>(task.id, {
                eventResponse: result
            });

            return Result.ok(updatedTask);
        },
        fetchServiceInfo: async (
            input: TaskService.Task | string
        ): Promise<Result<IStepFunctionServiceFetchResult, BaseError<any>>> => {
            const task = typeof input === "object" ? input : await context.tasks.getTask(input);
            if (!task && typeof input === "string") {
                throw new NotFoundError(`Task "${input}" was not found!`);
            } else if (!task) {
                throw new WebinyError(`Task was not found!`, "TASK_FETCH_ERROR", {
                    input
                });
            }

            try {
                const info = (await service.fetch(task)) as IStepFunctionServiceFetchResult | null;
                if(info) {
                    return Result.ok(info);
                }

                return Result.fail(new TaskServiceInfoError());
            } catch (ex) {
                console.log("Service fetch error.");
                console.error(ex);
                return Result.fail(new TaskServiceInfoError());
            }
        },
        abort: async <
            T extends TaskService.TaskInput = TaskService.TaskInput,
            O extends TaskService.GenericOutput = TaskService.GenericOutput
        >(
            params: ITaskAbortParams
        ): Promise<Result<TaskService.Task<T, O>, BaseError<any>>> => {
            const task = await context.tasks.getTask<T, O>(params.id);
            if (!task) {
                return Result.fail(new TaskNotFoundError());
            }

            const definition = context.tasks.getDefinition<T, O>(task.definitionId);
            if (!definition) {
                return Result.fail(new TaskDefinitionNotFoundError(task.definitionId));
            }
            /**
             * We should only be able to abort a task which is pending or running
             */
            if (
                [TaskDataStatus.PENDING, TaskDataStatus.RUNNING].includes(task.taskStatus) === false
            ) {
                return Result.fail(
                    new TaskAbortError({
                        id: params.id,
                        status: task.taskStatus
                    })
                );
            }
            let taskLog: ITaskLog | null = null;
            try {
                taskLog = await context.tasks.getLatestLog(task.id);
            } catch {}
            if (!taskLog) {
                taskLog = await context.tasks.createLog(task, {
                    iteration: 1,
                    executionName: task.executionName
                });
            }
            try {
                const updatedTask = await context.tasks.updateTask<T, O>(task.id, {
                    taskStatus: TaskDataStatus.ABORTED
                });
                await context.tasks.updateLog(taskLog.id, {
                    items: taskLog.items.concat([
                        {
                            message: params.message || "Task aborted.",
                            type: TaskLogItemType.INFO,
                            createdOn: new Date().toISOString()
                        }
                    ])
                });
                /**
                 * TODO: determine when to kick off the onAbort hook
                 */
                if (definition.onAbort) {
                    await definition.onAbort({
                        task: updatedTask
                    });
                }

                return Result.ok(updatedTask);
            } catch (ex) {
                throw new WebinyError(`Could not abort the task!`, "TASK_ABORT_ERROR", {
                    id: params.id,
                    message: ex.message
                });
            }
        }
    };
};
