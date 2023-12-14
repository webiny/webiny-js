import WebinyError from "@webiny/error";
import {
    Context,
    ITaskConfig,
    ITaskData,
    ITasksContextTriggerObject,
    ITaskTriggerParams
} from "~/types";
import { createEventBridgeEventFactory } from "~/crud/createEventBridgeEvent";

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

            let event: any;
            try {
                event = await createEventBridgeEvent(task);
                console.log("EVENT: ", JSON.stringify(event));
            } catch (ex) {
                /**
                 * In case of failure to create the Event Bridge Event, we need to delete the task that was meant to be created.
                 */
                await context.tasks.deleteTask(task.id);
                throw ex;
            }
            return task;
        }
    };
};
