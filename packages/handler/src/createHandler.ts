import { PluginsContainer } from "@webiny/plugins";
import {
    HandlerResultPlugin,
    ContextPlugin,
    HandlerPlugin,
    HandlerErrorPlugin,
    BeforeHandlerPlugin,
    ContextInterface
} from "./types";
import middleware from "./middleware";

export default (...plugins) =>
    async (...args) => {
        const context: ContextInterface = {
            plugins: new PluginsContainer(plugins),
            args,
            // @ts-ignore
            // this is injected using webpack.DefinePlugin at build time
            WEBINY_VERSION: process.env.WEBINY_VERSION,
            hasAbort: function (this: ContextInterface) {
                return !!this._abort;
            },
            _abort: null,
            getAbort: function (this: ContextInterface) {
                return this._abort;
            },
            setAbort: function (this: ContextInterface, params: Record<string, any>) {
                this._abort = params;
            }
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

async function handle(_: any, context: ContextInterface) {
    try {
        const contextPlugins = context.plugins.byType<ContextPlugin>("context");
        for (let i = 0; i < contextPlugins.length; i++) {
            if (!contextPlugins[i].apply) {
                continue;
            }
            await contextPlugins[i].apply(context);
            if (context.hasAbort()) {
                return context.getAbort();
            }
        }

        const beforeHandlerPlugins = context.plugins.byType<BeforeHandlerPlugin>("before-handler");
        for (let i = 0; i < beforeHandlerPlugins.length; i++) {
            if (!beforeHandlerPlugins[i].apply) {
                continue;
            }
            await beforeHandlerPlugins[i].apply(context);
            if (context.hasAbort()) {
                return context.getAbort();
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
