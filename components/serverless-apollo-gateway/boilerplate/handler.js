import { PluginsContainer } from "@webiny/plugins";

let apolloHandler;
export const handler = async (event, context) => {
    if (!apolloHandler) {
        const plugins = new PluginsContainer([]);
        const plugin = plugins.byName("create-apollo-gateway");
        apolloHandler = await plugin.createGateway({ plugins });

        const wrappers = plugins.byType("apollo-handler-wrapper");
        for (let i = 0; i < wrappers.length; i++) {
            apolloHandler = await wrappers[i].wrap({ handler: apolloHandler, plugins });
        }
    }

    return new Promise((resolve, reject) => {
        apolloHandler(event, context, (error, data) => {
            if (error) {
                return reject(error);
            }

            resolve(data);
        });
    });
};
