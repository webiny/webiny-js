import { PluginsContainer } from "./PluginsContainer";

export default (...plugins) => async (...args) => {
    const context = {
        plugins: new PluginsContainer(plugins)
    };

    let handlers = context.plugins.byType("before-run");
    for (let i = 0; i < handlers.length; i++) {
        let handler = handlers[i];
        await handler.handle({ context, args });
    }

    let result;
    handlers = context.plugins.byType("run");
    for (let i = 0; i < handlers.length; i++) {
        let handler = handlers[i];
        result = await handler.handle({ context, args });
        if (result !== undefined) {
            break;
        }
    }

    handlers = context.plugins.byType("after-run");
    for (let i = 0; i < handlers.length; i++) {
        let handler = handlers[i];
        await handler.handle({ context, args, result });
    }

    return result;
};
