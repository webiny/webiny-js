import WebinyError from "@webiny/error";
import {
    Context,
    ITaskConfig,
    ITaskCreateData,
    ITaskData,
    ITaskDataValues,
    ITasksContextTriggerObject,
    ITaskAbortParams,
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
        trigger: async <T = ITaskDataValues>(
            params: ITaskTriggerParams<T>
        ): Promise<ITaskData<T>> => {
            const { definition: id, values, name } = params;
            const definition = context.tasks.getDefinition(id);
            if (!definition) {
                throw new WebinyError(`Task definition was not found!`, "TASK_DEFINITION_ERROR", {
                    id
                });
            }
            const input: ITaskCreateData<T> = {
                name: name || definition.title,
                definitionId: id,
                values: values || ({} as T)
            };
            if (definition.onBeforeTrigger) {
                await definition.onBeforeTrigger<T>({
                    context,
                    values: input.values
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
                throw new NotFoundError();
            }
            try {
                return await context.tasks.updateTask(task.id, {
                    status: TaskDataStatus.ABORTED,
                    log: (task.log || []).concat([
                        {
                            message: params.message || "Task aborted.",
                            createdOn: new Date().toISOString()
                        }
                    ])
                });
            } catch (ex) {
                throw new WebinyError(`Could not abort the task!`, "TASK_ABORT_ERROR", {
                    id: params.id,
                    message: ex.message
                });
            }
        }
    };
};
