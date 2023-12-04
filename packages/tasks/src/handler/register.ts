import { registry } from "@webiny/handler-aws/registry";
import { createHandler, HandlerParams } from "./index";
import { createSourceHandler } from "@webiny/handler-aws";
import { ITaskEvent } from "./types";

const handler = createSourceHandler<ITaskEvent, HandlerParams>({
    name: "handler-webiny-background-task",
    canUse: event => {
        return !!event.webinyTaskId;
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);
