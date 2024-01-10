import WebinyError from "@webiny/error";
import {
    Context,
    ITaskAbortParams,
    ITaskConfig,
    ITaskCreateData,
    ITaskData,
    ITaskDataInput,
    ITaskLog,
    ITaskLogItemType,
    ITasksContextTriggerObject,
    ITaskTriggerParams,
    TaskDataStatus
} from "~/types";
import { createEventBridgeEventFactory } from "~/crud/createEventBridgeEvent";
import { NotFoundError } from "@webiny/handler-graphql";

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
    const createEventBridgeEvent = createEventBridgeEventFactory({
        config,
        getTenant,
        getLocale
    });

    return {
        trigger: async <T = ITaskDataInput>(
            params: ITaskTriggerParams<T>
        ): Promise<ITaskData<T>> => {
            const { definition: id, input: inputValues, name } = params;
            const definition = context.tasks.getDefinition(id);
            if (!definition) {
                throw new WebinyError(`Task definition was not found!`, "TASK_DEFINITION_ERROR", {
                    id
                });
            }
            const input: ITaskCreateData<T> = {
                name: name || definition.title,
                definitionId: id,
                input: inputValues || ({} as T)
            };
            if (definition.onBeforeTrigger) {
                await definition.onBeforeTrigger<T>({
                    context,
                    input: input.input
                });
            }

            const task = await context.tasks.createTask<T>(input);

            let event: Record<string, any> | null = null;
            try {
                event = await createEventBridgeEvent(task);

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
        abort: async (params: ITaskAbortParams): Promise<ITaskData> => {
            const task = await context.tasks.getTask(params.id);
            if (!task) {
                throw new NotFoundError(`Task "${params.id}" was not found!`);
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
