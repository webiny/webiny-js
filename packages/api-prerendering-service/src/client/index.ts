import { ClientContext } from "@webiny/handler-client/types";
import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { PrerenderingServiceClientArgs, PrerenderingServiceClientContext } from "./types";
import { HandlerPayload as RenderHandlerEvent } from "../render/types";
import { HandlerArgs as FlushHandlerEvent } from "../flush/types";
import { QueueAddJobEvent } from "~/queue/add/types";

export default (configuration: PrerenderingServiceClientArgs) => {
    return new ContextPlugin<ClientContext & PrerenderingServiceClientContext>(context => {
        if (!context.handlerClient) {
            throw new WebinyError(
                `Prerendering service's client relies on the "context.handlerClient", defined by the "@webiny/handler-client" package. Please add it to your handler and try again.`
            );
        }
        if (context.prerenderingServiceClient) {
            return;
        }

        context.prerenderingServiceClient = {
            async render(args) {
                await context.handlerClient.invoke<RenderHandlerEvent>({
                    name: configuration.handlers.render,
                    await: false,
                    payload: args
                });
            },
            async flush(args) {
                await context.handlerClient.invoke<FlushHandlerEvent>({
                    name: configuration.handlers.flush,
                    await: false,
                    payload: args
                });
            },
            queue: {
                async add(args) {
                    await context.handlerClient.invoke<QueueAddJobEvent>({
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
    });
};
