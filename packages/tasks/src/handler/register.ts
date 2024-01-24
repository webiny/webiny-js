import { registry } from "@webiny/handler-aws/registry";
import { createHandler, HandlerParams } from "./index";
import { createSourceHandler } from "@webiny/handler-aws";
import { IIncomingEvent, ITaskEvent } from "./types";

const handler = createSourceHandler<IIncomingEvent<ITaskEvent>, HandlerParams>({
    name: "handler-webiny-background-task",
    canUse: event => {
        return !!event.payload?.webinyTaskId;
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event.payload, context);
    }
});

registry.register(handler);
