import { PluginsContainer } from "@webiny/plugins";
import createResponse from "./createResponse";
import {
    HttpAfterHandlePlugin,
    HttpBeforeHandlePlugin,
    HttpContextPlugin,
    HttpHandlerPlugin
} from "./types";

export default (...plugins) => async (...args) => {
    const context = {
        plugins: new PluginsContainer(plugins)
    };

    const contextPlugins = context.plugins.byType<HttpContextPlugin>("context");
    for (let i = 0; i < contextPlugins.length; i++) {
        contextPlugins[i].apply({ context, args });
    }

    const beforeHandle = context.plugins.byType<HttpBeforeHandlePlugin>("before-handle");
    for (let i = 0; i < beforeHandle.length; i++) {
        await beforeHandle[i].handle({ context, args });
    }

    let result;
    const handlers = context.plugins.byType<HttpHandlerPlugin>("handler");
    for (let i = 0; i < handlers.length; i++) {
        const handler = handlers[i];
        if (handler.canHandle({ context, args })) {
            result = await handler.handle({ context, args });
        }
    }

    const afterHandle = context.plugins.byType<HttpAfterHandlePlugin>("after-handle");
    for (let i = 0; i < afterHandle.length; i++) {
        await afterHandle[i].handle({ context, args, result });
    }

    if (!result) {
        return createResponse({
            body: "Request not handled. Please check registered handlers."
        });
    }

    return result;
};
