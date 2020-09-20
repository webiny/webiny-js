import { PluginsContainer } from "@webiny/plugins";
import createResponse from "./createResponse";
import { HandlerContextPlugin, HandlerPlugin, ErrorHandlerPlugin } from "./types";
import middleware from "./middleware";

export default (...plugins) => async (...args) => {
    const context = {
        plugins: new PluginsContainer(plugins),
        args
    };

    try {
        const contextPlugins = context.plugins.byType<HandlerContextPlugin>("context");
        for (let i = 0; i < contextPlugins.length; i++) {
            if (contextPlugins[i].apply) {
                await contextPlugins[i].apply(context);
            }
        }

        const handlers = context.plugins.byType<HandlerPlugin>("handler");
        const handler = middleware(handlers.map(pl => pl.handle));
        const result = await handler(context);
        if (!result) {
            throw Error(`Handlers did not produce a result!`);
        }

        return result;
    } catch (error) {
        const handlers = context.plugins.byType<ErrorHandlerPlugin>("error-handler");
        const handler = middleware(handlers.map(pl => pl.handle));
        const result = await handler({ args, context, error });

        if (result) {
            return result;
        }

        return createResponse({
            statusCode: 500,
            type: "application/json",
            body: JSON.stringify({
                error: {
                    name: error.constructor.name,
                    message: error.message,
                    stack: error.stack
                }
            }),
            headers: { "Cache-Control": "no-store" }
        });
    }
};
