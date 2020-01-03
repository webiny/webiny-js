import { PluginsContainer } from "./PluginsContainer";

export default (...plugins) => async event => {
    const pluginsContainer = new PluginsContainer(plugins);
    const context = {
        plugins: pluginsContainer
    };

    const handlers = context.plugins.byType("handler");
    for (let i = 0; i < handlers.length; i++) {
        let handler = handlers[i];
        const response = await handler.handle({ event, context });
        if (response) {
            return response;
        }
    }
};
