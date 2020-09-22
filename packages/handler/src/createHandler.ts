import { PluginsContainer } from "@webiny/plugins";
import { HandlerContextPlugin, HandlerPlugin, HandlerErrorPlugin } from "./types";
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
            throw Error(`No result was returned from registered handlers.`);
        }

        return result;
    } catch (error) {
        const handlers = context.plugins.byType<HandlerErrorPlugin>("handler-error");
        const handler = middleware(handlers.map(pl => pl.handle));
        return handler(context, error);
    }
};
