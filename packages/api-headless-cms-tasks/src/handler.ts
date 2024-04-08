import { createEventBridgeEventHandler } from "@webiny/handler-aws";
import { HeadlessCmsTasksContext } from "~/types";
//import { EntriesTask, HeadlessCmsTasksContext } from "~/types";

export const createEventHandler = () => {
    return createEventBridgeEventHandler(async ({ request, context: ctx, payload }) => {
        const context = ctx as unknown as HeadlessCmsTasksContext;

        console.log("EventBridgeRequest", JSON.stringify(request));
        console.log("EventBridgeContext", JSON.stringify(context));
        console.log("EventBridgePayload", JSON.stringify(payload));

        if (!context.tasks) {
            console.error("Missing tasks definition on context.");
            return null;
        }

        // await context.tasks.trigger({
        //     definition: EntriesTask.EmptyTrashBins
        // });

        return;
    });
};
