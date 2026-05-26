import { registry } from "@webiny/handler-aws/registry.js";
import { createSourceHandler } from "@webiny/handler-aws";
import type { HandlerParams, IIncomingEvent, ITaskEvent } from "./types.js";

const handler = createSourceHandler<IIncomingEvent<ITaskEvent>, HandlerParams>({
    name: "handler-webiny-background-task",
    canUse: event => {
        return !!event.payload?.webinyTaskId;
    },
    handle: async ({ params, event, context }) => {
        const { createHandler } = await import(
            /* webpackChunkName: "tasks.handler.createHandler" */
            "./index.js"
        );
        return createHandler(params)(event.payload, context);
    }
});

registry.register(handler, {
    silent: true
});
