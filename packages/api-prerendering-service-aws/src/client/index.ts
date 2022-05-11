import EventBridgeClient, { PutEventsRequestEntry } from "aws-sdk/clients/eventbridge";

import WebinyError from "@webiny/error";
import { ClientContext } from "@webiny/handler-client/types";
import { ContextPlugin } from "@webiny/handler/types";
import { PrerenderingServiceClientContext } from "@webiny/api-prerendering-service/client/types";

import { Args as RenderArgs } from "@webiny/api-prerendering-service/render/types";
import { Args as FlushArgs } from "@webiny/api-prerendering-service/flush/types";

export interface PrerenderingServiceClientArgs {
    eventBus: string;
}

export default (configuration: PrerenderingServiceClientArgs) => {
    return [
        {
            type: "context",
            apply(context) {
                const client = new EventBridgeClient();

                context.prerenderingServiceClient = {
                    async render(args) {
                        // There is no more rendering directly without queue,
                        // so this method is almost identical to queue.add
                        await sendEvents(renderEvents(args));
                    },
                    async flush(args) {
                        await sendEvents(flushEvents(args));
                    },
                    queue: {
                        async add(args) {
                            if (!Array.isArray(args)) {
                                args = [args];
                            }

                            const events: PutEventsRequestEntry[] = [];

                            for (const arg of args) {
                                if (arg.render) {
                                    events.push(...renderEvents(arg.render));
                                }

                                if (arg.flush) {
                                    events.push(...flushEvents(arg.flush));
                                }
                            }

                            await sendEvents(events);
                        },
                        async process() {
                            // Nothing - processing is made by SQS queue.
                        }
                    }
                };

                function renderEvents(args: RenderArgs | RenderArgs[]): PutEventsRequestEntry[] {
                    if (!Array.isArray(args)) {
                        args = [args];
                    }

                    return args.map(arg => ({
                        Source: "webiny-api",
                        EventBusName: configuration.eventBus,
                        DetailType: "RenderPages",
                        Detail: JSON.stringify(arg)
                    }));
                }

                function flushEvents(args: FlushArgs | FlushArgs[]): PutEventsRequestEntry[] {
                    if (!Array.isArray(args)) {
                        args = [args];
                    }

                    return args.map(arg => ({
                        Source: "webiny-api",
                        EventBusName: configuration.eventBus,
                        DetailType: "FlushPages",
                        Detail: JSON.stringify(arg)
                    }));
                }

                async function sendEvents(events: PutEventsRequestEntry[]) {
                    const result = await client
                        .putEvents({
                            Entries: events
                        })
                        .promise();

                    if (result.FailedEntryCount) {
                        throw new WebinyError({
                            message: "Failed to send some events to the event bus",
                            data: {
                                entries: result.Entries
                            }
                        });
                    }
                }
            }
        } as ContextPlugin<ClientContext, PrerenderingServiceClientContext>
    ];
};
