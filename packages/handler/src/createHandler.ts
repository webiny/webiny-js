import { HandlerResultPlugin, ContextPlugin, HandlerPlugin, HandlerErrorPlugin } from "./types";
import middleware from "./middleware";
import { BeforeHandlerPlugin } from "~/plugins/BeforeHandlerPlugin";
import { Context } from "~/plugins/Context";

export default (...plugins) =>
    async (...args) => {
        const context = new Context({
            plugins,
            args,
            /**
             * Inserted via webpack on build time.
             */
            WEBINY_VERSION: process.env.WEBINY_VERSION
        });

        const result = await handle(args, context);

        const handlerPlugins = context.plugins.byType<HandlerResultPlugin>("handler-result");
        for (let i = 0; i < handlerPlugins.length; i++) {
            if (handlerPlugins[i].handle) {
                await handlerPlugins[i].handle(result, context);
            }
        }

        return result;
    };

async function handle(_: any, context: Context) {
    try {
        const contextPlugins = context.plugins.byType<ContextPlugin>("context");
        for (let i = 0; i < contextPlugins.length; i++) {
            if (!contextPlugins[i].apply) {
                continue;
            }
            await contextPlugins[i].apply(context);
            if (context.hasResult()) {
                return context.getResult();
            }
        }

        const beforeHandlerPlugins = context.plugins.byType<BeforeHandlerPlugin>(
            BeforeHandlerPlugin.type
        );
        for (let i = 0; i < beforeHandlerPlugins.length; i++) {
            if (!beforeHandlerPlugins[i].apply) {
                continue;
            }
            await beforeHandlerPlugins[i].apply(context);
            if (context.hasResult()) {
                return context.getResult();
            }
        }

        const handlers = context.plugins.byType<HandlerPlugin>("handler");
        const handler = middleware(handlers.map(pl => pl.handle));
        const result = await handler(context);
        if (!result) {
            throw new Error(`No result was returned from registered handlers.`);
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
