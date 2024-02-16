import { registry } from "@webiny/handler-aws/registry";
import { createHandler, HandlerParams } from "./index";
import { createSourceHandler } from "@webiny/handler-aws";
import { IIncomingEvent, ISocketsEvent } from "./types";

const handler = createSourceHandler<IIncomingEvent<ISocketsEvent>, HandlerParams>({
    name: "handler-webiny-websockets",
    canUse: event => {
        if (!event.payload) {
            return false;
        }
        const requestContext = event.payload.requestContext;
        if (!requestContext) {
            return false;
        } else if (!requestContext.routeKey || !requestContext.connectionId) {
            return false;
        }
        return true;
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event.payload, context);
    }
});

registry.register(handler, {
    silent: true
});
