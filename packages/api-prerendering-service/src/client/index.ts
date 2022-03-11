import { ClientContext } from "@webiny/handler-client/types";
import { ContextPlugin } from "@webiny/handler/types";
import { PrerenderingServiceClientArgs, PrerenderingServiceClientContext } from "./types";

import { HandlerArgs as RenderHandlerArgs } from "../render/types";
import { HandlerArgs as FlushHandlerArgs } from "../flush/types";
import { HandlerArgs as QueueHandlerArgs } from "../queue/add/types";

import Error from "@webiny/error";

export default (configuration: PrerenderingServiceClientArgs) => {
    return [
        {
            type: "context",
            apply(context) {
                if (!context.handlerClient) {
                    throw new Error(
                        `Prerendering service's client relies on the "context.handlerClient", defined by the "@webiny/handler-client" package. Please add it to your handler and try again.`
                    );
                }
                if (context.prerenderingServiceClient) {
                    return;
                }

                context.prerenderingServiceClient = {
                    async render(args) {
                        await context.handlerClient.invoke<RenderHandlerArgs>({
                            name: configuration.handlers.render,
                            await: false,
                            payload: args
                        });
                    },
                    async flush(args) {
                        await context.handlerClient.invoke<FlushHandlerArgs>({
                            name: configuration.handlers.flush,
                            await: false,
                            payload: args
                        });
                    },
                    queue: {
                        async add(args) {
                            await context.handlerClient.invoke<QueueHandlerArgs>({
                                name: configuration.handlers.queue.add,
                                await: false,
                                payload: args
                            });
                        },
                        async process() {
                            return context.handlerClient.invoke({
                                name: configuration.handlers.queue.process,
                                await: false
                            });
                        }
                    }
                };
            }
        } as ContextPlugin<ClientContext, PrerenderingServiceClientContext>
    ];
};
