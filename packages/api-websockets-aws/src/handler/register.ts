import { registry } from "@webiny/handler-aws/registry.js";
import { createSourceHandler } from "@webiny/handler-aws";
import type { HandlerParams, IAwsWebsocketsIncomingEvent } from "./types.js";

const handler = createSourceHandler<IAwsWebsocketsIncomingEvent, HandlerParams>({
    name: "handler-webiny-websockets",
    canUse: event => {
        const { routeKey, connectionId, eventType } = event.requestContext || {};
        return !!routeKey && !!connectionId && !!eventType;
    },
    handle: async ({ params, event, context }) => {
        const { createHandler } = await import(
            /* webpackChunkName: "SocketsHandler" */
            "./handler.js"
        );
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
