import {
    EventBridgeClient,
    PutEventsRequestEntry,
    PutEventsCommand
} from "@webiny/aws-sdk/client-eventbridge";
import WebinyError from "@webiny/error";
import { ClientContext } from "@webiny/handler-client/types";
import { ContextPlugin } from "@webiny/api";
import { PrerenderingServiceClientContext } from "@webiny/api-prerendering-service/client/types";
import { FlushJob, RenderJob } from "@webiny/api-prerendering-service/types";

export interface PrerenderingServiceClientArgs {
    eventBus: string;
}

export default (configuration: PrerenderingServiceClientArgs) => {
    return new ContextPlugin<ClientContext & PrerenderingServiceClientContext>(context => {
        const client = new EventBridgeClient();

        context.prerenderingServiceClient = {
            async render(tasks) {
                // In this package, rendering is always done through a queue, so this method is almost identical to `queue.add`.
                await sendEvents(renderEvents(tasks));
            },
            async flush(tasks) {
                await sendEvents(flushEvents(tasks));
            },
            queue: {
                async add(tasks) {
                    if (!Array.isArray(tasks)) {
                        tasks = [tasks];
                    }

                    const events: PutEventsRequestEntry[] = [];

                    for (const task of tasks) {
                        if (task.render) {
                            events.push(...renderEvents(task.render));
                        }

                        if (task.flush) {
                            events.push(...flushEvents(task.flush));
                        }
                    }

                    await sendEvents(events);
                },
                async process() {
                    // Nothing to do here
                    // Processing is done by the SQS queue.
                }
            }
        };

        function renderEvents(tasks: RenderJob | RenderJob[]): PutEventsRequestEntry[] {
            if (!Array.isArray(tasks)) {
                tasks = [tasks];
            }

            return tasks.map(task => ({
                Source: "webiny-api",
                EventBusName: configuration.eventBus,
                DetailType: "RenderPages",
                Detail: JSON.stringify(task)
            }));
        }

        function flushEvents(tasks: FlushJob | FlushJob[]): PutEventsRequestEntry[] {
            if (!Array.isArray(tasks)) {
                tasks = [tasks];
            }

            return tasks.map(task => ({
                Source: "webiny-api",
                EventBusName: configuration.eventBus,
                DetailType: "FlushPages",
                Detail: JSON.stringify(task)
            }));
        }

        async function sendEvents(events: PutEventsRequestEntry[]) {
            const result = await client.send(
                new PutEventsCommand({
                    Entries: events
                })
            );

            if (result.FailedEntryCount) {
                throw new WebinyError({
                    message: "Failed to send some events to the event bus",
                    data: {
                        entries: result.Entries
                    }
                });
            }
        }
    });
};
