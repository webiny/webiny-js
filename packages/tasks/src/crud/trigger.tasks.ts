import WebinyError from "@webiny/error";
import {
    Context,
    ITaskConfig,
    ITaskData,
    ITasksContextTriggerObject,
    ITaskStopParams,
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
        trigger: async <T = any>(params: ITaskTriggerParams<T>): Promise<ITaskData<T>> => {
            const { definition: id, values, name } = params;
            const definition = context.tasks.getDefinition(id);
            if (!definition) {
                throw new WebinyError(`Task definition was not found!`, "TASK_DEFINITION_ERROR", {
                    id
                });
            }
            const task = await context.tasks.createTask<T>({
                name: name || definition.title,
                definitionId: id,
                values: values || ({} as T)
            });

            try {
                const event = await createEventBridgeEvent(task);
                console.log("EVENT: ", JSON.stringify(event));
            } catch (ex) {
                /**
                 * In case of failure to create the Event Bridge Event, we need to delete the task that was meant to be created.
                 * TODO maybe we can leave the task and update it as failed - with event bridge error?
                 */
                await context.tasks.deleteTask(task.id);
                throw ex;
            }
            return task;
        },
        stop: async (params: ITaskStopParams): Promise<ITaskData> => {
            const task = await context.tasks.getTask(params.id);
            if (!task) {
                throw new NotFoundError();
            }
            try {
                return await context.tasks.updateTask(task.id, {
                    status: TaskDataStatus.STOPPED,
                    log: (task.log || []).concat([
                        {
                            message: params.message || "Task stopped.",
                            createdOn: new Date().toISOString()
                        }
                    ])
                });
            } catch (ex) {
                throw new WebinyError(`Could not stop the task!`, "TASK_STOP_ERROR", {
                    id: params.id,
                    message: ex.message
                });
            }
        }
    };
};
