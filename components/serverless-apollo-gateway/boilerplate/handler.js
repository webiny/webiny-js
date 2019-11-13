import { PluginsContainer } from "@webiny/api";

let apolloHandler;
export const handler = async (event, context) => {
    if (!apolloHandler) {
        const plugins = new PluginsContainer([]);
        const plugin = plugins.byName("create-apollo-gateway");
        apolloHandler = await plugin.createGateway({ plugins });
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
