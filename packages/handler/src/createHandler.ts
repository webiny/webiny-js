import { PluginsContainer } from "@webiny/plugins";
import {
    Context,
    HandlerResultPlugin,
    ContextPlugin,
    HandlerPlugin,
    HandlerErrorPlugin,
    BeforeHandlerPlugin
} from "./types";
import middleware from "./middleware";

export default (...plugins) =>
    async (...args) => {
        const context: Context = {
            plugins: new PluginsContainer(plugins),
            args,
            // @ts-ignore
            // this is injected using webpack.DefinePlugin at build time
            WEBINY_VERSION: process.env.WEBINY_VERSION
        };

        const result = await handle(args, context);

        const handlerPlugins = context.plugins.byType<HandlerResultPlugin>("handler-result");
        for (let i = 0; i < handlerPlugins.length; i++) {
            if (handlerPlugins[i].apply) {
                await handlerPlugins[i].apply(result, context);
            }
        }

        return result;
    };

async function handle(_: any, context: Context) {
    try {
        const contextPlugins = context.plugins.byType<ContextPlugin>("context");
        for (let i = 0; i < contextPlugins.length; i++) {
            if (contextPlugins[i].apply) {
                await contextPlugins[i].apply(context);
            }
        }

        const beforeHandlerPlugins = context.plugins.byType<BeforeHandlerPlugin>("before-handler");
        for (let i = 0; i < beforeHandlerPlugins.length; i++) {
            if (beforeHandlerPlugins[i].apply) {
                await beforeHandlerPlugins[i].apply(context);
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
        // Log error to cloud, as these can be extremely annoying to debug!
        console.log(error);
        const handlers = context.plugins.byType<HandlerErrorPlugin>("handler-error");
        const handler = middleware(handlers.map(pl => pl.handle));
        return handler(context, error);
    }
}
