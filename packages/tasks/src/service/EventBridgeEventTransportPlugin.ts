import {
    ITaskService,
    ITaskServiceCreatePluginParams,
    ITaskServiceTask,
    TaskServicePlugin
} from "~/plugins";
import { Context, ITaskEventInput } from "~/types";
import type { PutEventsCommandOutput } from "@webiny/aws-sdk/client-eventbridge";
import { EventBridgeClient, PutEventsCommand } from "@webiny/aws-sdk/client-eventbridge";
import { WebinyError } from "@webiny/error";
import { GenericRecord } from "@webiny/api/types";

class EventBridgeService implements ITaskService {
    protected readonly context: Context;
    protected readonly getTenant: () => string;
    protected readonly getLocale: () => string;
    private readonly client: EventBridgeClient;

    public constructor(params: ITaskServiceCreatePluginParams) {
        this.client = new EventBridgeClient({
            region: process.env.AWS_REGION
        });
        this.context = params.context;
        this.getTenant = params.getTenant;
        this.getLocale = params.getLocale;
    }

    public async send(task: ITaskServiceTask, delay: number): Promise<PutEventsCommandOutput> {
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
                    EventBusName: String(process.env.EVENT_BUS),
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

    public async fetch(): Promise<GenericRecord> {
        throw new WebinyError("Not implemented!", "NOT_IMPLEMENTED");
    }
}

export class EventBridgeEventTransportPlugin extends TaskServicePlugin {
    public override name = "task.eventBridgeEventTransport";
    public createService(params: ITaskServiceCreatePluginParams) {
        return new EventBridgeService(params);
    }
}
