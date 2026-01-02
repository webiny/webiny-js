import { AsyncPluginsContainer } from "@webiny/plugins";
import type { HandlerFactory } from "~/types.js";
import { registry } from "./registry.js";

// TODO: Once we have a better infrastructure for handling such cases, we should refactor this.
//       Ideally, the DI container should already be ready to be used in these `handler` packages.
//       At the moment, that is not the case, so we have to hardcode `pino-lambda` here.
import { lambdaRequestTracker } from "pino-lambda";

const withRequest = lambdaRequestTracker();

export const createHandler: HandlerFactory = ({ plugins, ...params }) => {
    const pluginsContainer = new AsyncPluginsContainer(plugins);

    return async (event, context) => {
        withRequest(event, context);

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
