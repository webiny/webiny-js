import WebinyError from "@webiny/error";
import type {
    Context,
    ITask,
    ITaskAbortParams,
    ITaskCreateData,
    ITaskDataInput,
    ITaskLog,
    ITaskResponseDoneResultOutput,
    ITasksContextTriggerObject,
    ITaskTriggerParams
} from "~/types";
import { TaskDataStatus, TaskLogItemType } from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { createTransport } from "~/transport/createTransport";

const MAX_DELAY_DAYS = 355;
const MAX_DELAY_SECONDS = MAX_DELAY_DAYS * 24 * 60 * 60;

interface ValidateDelayParams<T> {
    input: ITaskCreateData<T>;
    delay?: number;
}

const validateDelay = <T = ITaskDataInput>({ input, delay }: ValidateDelayParams<T>): void => {
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

export const createTriggerTasksCrud = (context: Context): ITasksContextTriggerObject => {
    const transport = createTransport({
        context
    });

    return {
        trigger: async <
            T = ITaskDataInput,
            O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
        >(
            params: ITaskTriggerParams<T>
        ): Promise<ITask<T, O>> => {
            const { definition: id, input: inputValues, name, parent, delay = 0 } = params;
            const definition = context.tasks.getDefinition(id);
            if (!definition) {
                throw new WebinyError(`Task definition was not found!`, "TASK_DEFINITION_ERROR", {
                    id
                });
            }
            const input: ITaskCreateData<T> = {
                name: name || definition.title,
                definitionId: id,
                input: inputValues || ({} as T),
                parentId: parent?.id
            };
            if (definition.onBeforeTrigger) {
                await definition.onBeforeTrigger<T>({
                    context,
                    data: input
                });
            }
            validateDelay<T>({
                input,
                delay
            });

            const task = await context.tasks.createTask<T>(input);

            let result: Awaited<ReturnType<typeof transport.send>> | null = null;
            try {
                result = await transport.send(task, delay);

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
                /**
                 * In case of failure to create the Event Bridge Event, we need to delete the task that was meant to be created.
                 * TODO maybe we can leave the task and update it as failed - with event bridge error?
                 */
                await context.tasks.deleteTask(task.id);
                throw ex;
            }
            return await context.tasks.updateTask(task.id, {
                eventResponse: result
            });
        },
        abort: async <
            T = ITaskDataInput,
            O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
        >(
            params: ITaskAbortParams
        ): Promise<ITask<T, O>> => {
            const task = await context.tasks.getTask<T, O>(params.id);
            if (!task) {
                throw new NotFoundError(`Task "${params.id}" was not found!`);
            }

            const definition = context.tasks.getDefinition<Context, T, O>(task.definitionId);
            if (!definition) {
                throw new WebinyError(`Task definition was not found!`, "TASK_DEFINITION_ERROR", {
                    id: task.id
                });
            }
            /**
             * We should only be able to abort a task which is pending or running
             */
            if (
                [TaskDataStatus.PENDING, TaskDataStatus.RUNNING].includes(task.taskStatus) === false
            ) {
                throw new WebinyError(
                    `Cannot abort a task that is not pending or running!`,
                    "TASK_ABORT_ERROR",
                    {
                        id: params.id,
                        status: task.taskStatus
                    }
                );
            }
            let taskLog: ITaskLog | null = null;
            try {
                taskLog = await context.tasks.getLatestLog(task.id);
            } catch (ex) {}
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
                        context,
                        task: updatedTask
                    });
                }

                return updatedTask;
            } catch (ex) {
                throw new WebinyError(`Could not abort the task!`, "TASK_ABORT_ERROR", {
                    id: params.id,
                    message: ex.message
                });
            }
        }
    };
};
