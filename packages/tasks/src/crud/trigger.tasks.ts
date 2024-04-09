import WebinyError from "@webiny/error";
import {
    Context,
    ITask,
    ITaskAbortParams,
    ITaskConfig,
    ITaskCreateData,
    ITaskDataInput,
    ITaskLog,
    ITaskLogItemType,
    ITasksContextTriggerObject,
    ITaskTriggerParams,
    TaskDataStatus
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { EventBridgeEventTransport, PutEventsCommandOutput } from "./EventBridgeEventTransport";

const MAX_DELAY_DAYS = 355;
const MAX_DELAY_SECONDS = MAX_DELAY_DAYS * 24 * 60 * 60;

interface ValidateDelayParams {
    input: ITaskCreateData;
    delay?: number;
}

const validateDelay = ({ input, delay }: ValidateDelayParams): void => {
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

export const createTriggerTasksCrud = (
    context: Context,
    config: ITaskConfig
): ITasksContextTriggerObject => {
    const getTenant = (): string => {
        return context.tenancy.getCurrentTenant().id;
    };
    const getLocale = (): string => {
        return context.cms.getLocale().code;
    };
    const eventBridgeEventTransport = new EventBridgeEventTransport({
        config,
        getTenant,
        getLocale
    });

    return {
        trigger: async <T = ITaskDataInput>(params: ITaskTriggerParams<T>): Promise<ITask<T>> => {
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
            validateDelay({
                input,
                delay
            });

            const task = await context.tasks.createTask<T>(input);

            let event: PutEventsCommandOutput | null = null;
            try {
                event = await eventBridgeEventTransport.send(task, delay);

                if (!event) {
                    throw new WebinyError(
                        `Could not create the Event Bridge Event!`,
                        "CREATE_EVENT_BRIDGE_EVENT_ERROR",
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
                eventResponse: event
            });
        },
        abort: async (params: ITaskAbortParams): Promise<ITask> => {
            const task = await context.tasks.getTask(params.id);
            if (!task) {
                throw new NotFoundError(`Task "${params.id}" was not found!`);
            }

            const definition = context.tasks.getDefinition(task.definitionId);
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
                const updatedTask = await context.tasks.updateTask(task.id, {
                    taskStatus: TaskDataStatus.ABORTED
                });
                await context.tasks.updateLog(taskLog.id, {
                    items: taskLog.items.concat([
                        {
                            message: params.message || "Task aborted.",
                            type: ITaskLogItemType.INFO,
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
