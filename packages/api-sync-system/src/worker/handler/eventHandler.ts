import { convertException } from "@webiny/utils";
import { ActionHandler } from "./ActionHandler.js";
import { createEventHandler } from "@webiny/handler-aws/raw/index.js";
import { WorkerActionPlugin } from "../plugins/WorkerActionPlugin.js";

export const createEventHandlerPlugin = () => {
    const plugin = createEventHandler<unknown>(async ({ payload, context }) => {
        const actionHandler = new ActionHandler({
            plugins: context.plugins.byType<WorkerActionPlugin>(WorkerActionPlugin.type)
        });

        try {
            await actionHandler.handle(payload);
        } catch (ex) {
            console.error("Error while handling action.");
            console.log(convertException(ex));
        }
    });

    plugin.name = `sync.worker.eventHandler`;

    return plugin;
};
