import { PluginsContainer } from "@webiny/api";

export default plugins => event => {
    let pluginsArray;
    if (Array.isArray(plugins)) {
        pluginsArray = plugins;
    } else {
        pluginsArray = [plugins];
    }

    const pluginsContainer = new PluginsContainer(pluginsArray);
    const context = {
        plugins: pluginsContainer
    };

    const handlers = context.plugins.byType("handler");
    for (let i = 0; i < handlers.length; i++) {
        let handler = handlers[i];
        const response = handler.run({ event, context });
        if (response) {
            return response;
        }
    }
};
