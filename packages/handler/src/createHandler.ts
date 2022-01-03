import { PluginsContainer } from "@webiny/plugins";
import {
    HandlerResultPlugin,
    ContextPlugin,
    HandlerPlugin,
    HandlerErrorPlugin,
    ContextInterface
} from "./types";
import middleware from "./middleware";
import { BeforeHandlerPlugin } from "~/plugins/BeforeHandlerPlugin";

export default (...plugins) =>
    async (...args) => {
        const context: ContextInterface = {
            plugins: new PluginsContainer(plugins),
            args,
            // @ts-ignore
            // this is injected using webpack.DefinePlugin at build time
            WEBINY_VERSION: process.env.WEBINY_VERSION,
            hasResult: function (this: ContextInterface) {
                return !!this._result;
            },
            _result: null,
            getResult: function (this: ContextInterface) {
                return this._result;
            },
            setResult: function (this: ContextInterface, params: Record<string, any>) {
                this._result = params;
            }
        };

        const result = await handle(args, context);

        const handlerPlugins = context.plugins.byType<HandlerResultPlugin>("handler-result");
        for (let i = 0; i < handlerPlugins.length; i++) {
            if (handlerPlugins[i].handle) {
                await handlerPlugins[i].handle(result, context);
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
