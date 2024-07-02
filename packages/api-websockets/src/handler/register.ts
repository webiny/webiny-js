import { registry } from "@webiny/handler-aws/registry";
import { createSourceHandler } from "@webiny/handler-aws";
import { HandlerParams, IWebsocketsIncomingEvent } from "./types";

const handler = createSourceHandler<IWebsocketsIncomingEvent, HandlerParams>({
    name: "handler-webiny-websockets",
    canUse: event => {
        const { routeKey, connectionId, eventType } = event.requestContext || {};
        return !!routeKey && !!connectionId && !!eventType;
    },
    handle: async ({ params, event, context }) => {
        const { createHandler } = await import(
            /* webpackChunkName: "SocketsHandler" */
            "./handler"
        );
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
