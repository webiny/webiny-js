import middleware from "./middleware";
import { HandlerPlugin, NextCallable } from "~/plugins/HandlerPlugin";
import { ContextPlugin } from "~/plugins/ContextPlugin";
import { BeforeHandlerPlugin } from "~/plugins/BeforeHandlerPlugin";
import { Context } from "~/plugins/Context";
import { HandlerErrorPlugin } from "~/plugins/HandlerErrorPlugin";
import { HandlerResultPlugin } from "~/plugins/HandlerResultPlugin";
import { PluginCollection } from "@webiny/plugins/types";

export default (...plugins: PluginCollection) =>
    async (...args: any[]) => {
        const context = new Context({
            plugins,
            args,
            /**
             * Inserted via webpack on build time.
             */
            WEBINY_VERSION: process.env.WEBINY_VERSION as string
        });

        const result = await handle(context);

        const handlerPlugins = context.plugins.byType<HandlerResultPlugin>(
            HandlerResultPlugin.type
        );
        for (let i = 0; i < handlerPlugins.length; i++) {
            if (!handlerPlugins[i].handle) {
                continue;
            }
            await handlerPlugins[i].handle(context, result);
        }

        return result;
    };

async function handle(context: Context) {
    try {
        const contextPlugins = context.plugins.byType<ContextPlugin>(ContextPlugin.type);
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

        const handlers = context.plugins.byType<HandlerPlugin>(HandlerPlugin.type);
        const handler = middleware(
            handlers.map(pl => {
                return (context: Context, next: NextCallable) => {
                    return pl.handle(context, next);
                };
            })
        );
        const result = await handler(context);
        if (!result) {
            throw new Error(`No result was returned from registered handlers.`);
        }

        return result;
    } catch (error) {
        // Log error to cloud, as these can be extremely annoying to debug!
        console.log("@webiny/handler");
        console.log(error);
        const handlers = context.plugins.byType<HandlerErrorPlugin>(HandlerErrorPlugin.type);
        const handler = middleware(
            handlers.map(pl => {
                return (context: Context, error: Error, next: Function) => {
                    return pl.handle(context, error, next);
                };
            })
        );
        return handler(context, error);
    }
}
