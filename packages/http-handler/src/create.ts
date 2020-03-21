import { PluginsContainer } from "@webiny/plugins";
import createResponse from "./createResponse";
import {
    HttpAfterHandlerPlugin,
    HttpBeforeHandlerPlugin,
    HttpContextPlugin,
    HttpHandlerPlugin,
    HttpErrorHandlerPlugin
} from "./types";

export default (...plugins) => async (...args) => {
    const context = {
        plugins: new PluginsContainer(plugins)
    };

    try {
        const contextPlugins = context.plugins.byType<HttpContextPlugin>("context");
        for (let i = 0; i < contextPlugins.length; i++) {
            contextPlugins[i].apply({ context, args });
        }

        const beforeHandlers = context.plugins.byType<HttpBeforeHandlerPlugin>("before-handler");
        for (let i = 0; i < beforeHandlers.length; i++) {
            await beforeHandlers[i].handle({ context, args });
        }

        let result, handled;
        const handlers = context.plugins.byType<HttpHandlerPlugin>("handler");
        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            if (handler.canHandle({ context, args })) {
                result = await handler.handle({ context, args });
                handled = true;
                break;
            }
        }

        if (!handled) {
            throw new Error("Not a single handler could handle the request.");
        }

        const afterHandlers = context.plugins.byType<HttpAfterHandlerPlugin>("after-handler");
        for (let i = 0; i < afterHandlers.length; i++) {
            await afterHandlers[i].handle({ context, args, result });
        }

        return result;
    } catch (error) {
        const handlers = context.plugins.byType<HttpErrorHandlerPlugin>("error-handler");
        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            if (handler.canHandle({ context, args, error })) {
                return handler.handle({ context, args, error });
            }
        }

        return createResponse({
            statusCode: 404,
            type: "text/html",
            body: `<html><h1>An error occurred</h1><p>${error.stack}</p></html>`,
            headers: { "Cache-Control": "no-store" }
        });
    }
};
