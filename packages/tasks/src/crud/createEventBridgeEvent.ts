import WebinyError from "@webiny/error";
import {
    EventBridgeClient,
    PutEventsCommand,
    PutEventsCommandOutput
} from "@webiny/aws-sdk/client-eventbridge";
import { ITaskConfig, ITask } from "~/types";
import { ITaskEventInput } from "~/handler/types";

export { PutEventsCommandOutput };

interface CreateEventBridgeEventParams {
    client: EventBridgeClient;
    task: Pick<ITask, "id" | "definitionId">;
    tenant: string;
    locale: string;
    eventBusName: string;
}

const createEventBridgeEvent = async (params: CreateEventBridgeEventParams) => {
    const { client, task, tenant, locale, eventBusName } = params;
    /**
     * The ITaskEvent is what our handler expect to get.
     * Endpoint and stateMachineId are added by the step function.
     */
    const event: ITaskEventInput = {
        webinyTaskId: task.id,
        webinyTaskDefinitionId: task.definitionId,
        tenant,
        locale
    };

    const cmd = new PutEventsCommand({
        Entries: [
            {
                Source: "webiny-api-tasks",
                EventBusName: eventBusName,
                DetailType: "WebinyBackgroundTask",
                Detail: JSON.stringify(event)
            }
        ]
    });
    try {
        return await client.send(cmd);
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Could not trigger task via Event Bridge!",
            ex.code || "TRIGGER_TASK_ERROR",
            {
                event,
                ...(ex.data || {})
            }
        );
    }
};

export interface IFactoryParams {
    config: ITaskConfig;
    getTenant: () => string;
    getLocale: () => string;
}

export const createEventBridgeEventFactory = (params: IFactoryParams) => {
    const { config, getTenant, getLocale } = params;
    const client = new EventBridgeClient({
        region: process.env.AWS_REGION
    });
    const eventBusName = config.eventBusName;
    return (task: ITask) => {
        return createEventBridgeEvent({
            client,
            eventBusName,
            task,
            tenant: getTenant(),
            locale: getLocale()
        });
    };
};
