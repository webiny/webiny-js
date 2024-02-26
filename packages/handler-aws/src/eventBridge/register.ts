import type { EventBridgeEvent } from "aws-lambda";
import { registry } from "~/registry";
import { HandlerFactoryParams } from "~/types";
import { createSourceHandler } from "~/sourceHandler";
import { createHandler } from "~/eventBridge/index";

export interface HandlerParams extends HandlerFactoryParams {
    debug?: boolean;
}

const handler = createSourceHandler<EventBridgeEvent<string, string>, HandlerParams>({
    name: "handler-aws-event-bridge",
    canUse: event => {
        return !!event.source;
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
