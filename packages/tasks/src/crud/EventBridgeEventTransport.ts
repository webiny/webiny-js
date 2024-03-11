import WebinyError from "@webiny/error";
import {
    EventBridgeClient,
    PutEventsCommand,
    PutEventsCommandOutput
} from "@webiny/aws-sdk/client-eventbridge";
import { ITask, ITaskConfig } from "~/types";
import { ITaskEventInput } from "~/handler/types";

export { PutEventsCommandOutput };

export interface IEventBridgeEventTransportParams {
    config: ITaskConfig;
    getTenant: () => string;
    getLocale: () => string;
}

export class EventBridgeEventTransport {
    private readonly client: EventBridgeClient;
    private readonly eventBusName: string;
    private readonly getTenant: () => string;
    private readonly getLocale: () => string;

    public constructor(params: IEventBridgeEventTransportParams) {
        this.client = new EventBridgeClient({
            region: process.env.AWS_REGION
        });
        this.eventBusName = params.config.eventBusName;
        this.getTenant = params.getTenant;
        this.getLocale = params.getLocale;
    }

    public async send(
        task: Pick<ITask, "id" | "definitionId">,
        delay: number
    ): Promise<PutEventsCommandOutput> {
        /**
         * The ITaskEvent is what our handler expect to get.
         * Endpoint and stateMachineId are added by the step function.
         */
        const event: ITaskEventInput = {
            webinyTaskId: task.id,
            webinyTaskDefinitionId: task.definitionId,
            tenant: this.getTenant(),
            locale: this.getLocale(),
            delay
        };

        const cmd = new PutEventsCommand({
            Entries: [
                {
                    Source: "webiny-api-tasks",
                    EventBusName: this.eventBusName,
                    DetailType: "WebinyBackgroundTask",
                    Detail: JSON.stringify(event)
                }
            ]
        });
        try {
            return await this.client.send(cmd);
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
    }
}
