import { PluginsContainer } from "@webiny/plugins";

let apolloHandler;
export const handler = async (event, context) => {
    try {
        if (!apolloHandler) {
            const plugins = new PluginsContainer([]);
            const plugin = plugins.byName("create-apollo-gateway");
            apolloHandler = await plugin.createGateway({ plugins });
        }

        return await new Promise(resolve => {
            apolloHandler(event, context, (error, data) => {
                if (error) {
                    return resolve({
                        statusCode: 500,
                        body: error.message
                    });
                }

                resolve(data);
            });
        });
    } catch (e) {
        console.log("APOLLO GW ERROR", e);
        if (process.env.ERROR_REPORTING === "true") {
            return {
                statusCode: 500,
                body: e.message
            };
        }

        throw e;
    }
};
