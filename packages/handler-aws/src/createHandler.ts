import { AsyncPluginsContainer } from "@webiny/plugins";
import { HandlerFactory } from "~/types";
import { registry } from "./registry";

export const createHandler: HandlerFactory = ({ plugins, ...params }) => {
    const pluginsContainer = new AsyncPluginsContainer(plugins);

    return async (event, context) => {
        console.log("event", event);
        console.log("context", context);
        const plugins = await pluginsContainer.init();
        const handler = registry.getHandler(event, context);
        return handler.handle({
            params: {
                ...params,
                plugins
            },
            event,
            context
        });
    };
};
