import { PluginsContainer } from "@webiny/plugins";
import createResponse from "./createResponse";
import {
    HttpAfterHandlerPlugin,
    HttpBeforeHandlerPlugin,
    HttpContextPlugin,
    HttpHandlerPlugin
} from "./types";

export default (...plugins) => async (...args) => {
    try {
        const context = {
            plugins: new PluginsContainer(plugins)
        };

        const contextPlugins = context.plugins.byType<HttpContextPlugin>("context");
        for (let i = 0; i < contextPlugins.length; i++) {
            contextPlugins[i].apply({ context, args });
        }

        const beforeHandlers = context.plugins.byType<HttpBeforeHandlerPlugin>("before-handler");
        for (let i = 0; i < beforeHandlers.length; i++) {
            await beforeHandlers[i].handle({ context, args });
        }

        let result;
        const handlers = context.plugins.byType<HttpHandlerPlugin>("handler");
        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            if (handler.canHandle({ context, args })) {
                result = await handler.handle({ context, args });
            }
        }

        const afterHandlers = context.plugins.byType<HttpAfterHandlerPlugin>("after-handler");
        for (let i = 0; i < afterHandlers.length; i++) {
            await afterHandlers[i].handle({ context, args, result });
        }

        if (!result) {
            return createResponse({
                body: "Request not handled. Please check registered handlers."
            });
        }

        return result;
    } catch (e) {
        // TODO: Make optional and pluginable.
        return createResponse({
            statusCode: 404,
            type: "text/html",
            body: `<html><h1>An error occurred</h1><p>${e.stack}</p></html>`,
            headers: { "Cache-Control": "no-store" }
        });
    }
};
