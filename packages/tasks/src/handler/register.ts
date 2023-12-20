import { registry } from "@webiny/handler-aws/registry";
import { createHandler, HandlerParams } from "./index";
import { createSourceHandler } from "@webiny/handler-aws";
import { IIncomingEvent, ITaskEvent } from "./types";

const handler = createSourceHandler<IIncomingEvent<ITaskEvent>, HandlerParams>({
    name: "handler-webiny-background-task",
    canUse: event => {
        return !!event.Payload?.webinyTaskId;
    },
    handle: async ({ params, event, context }) => {
        /**
         * We can safely cast because we know that the event is of type ITaskEvent.
         * Check is done in the canUse() method.
         */
        return createHandler(params)(event.Payload, context);
    }
});

registry.register(handler);
