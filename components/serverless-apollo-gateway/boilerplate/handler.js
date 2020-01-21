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
            console.log("Execute apolloHandler");
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
        console.log("CAUGHT ERROR", JSON.stringify(e, null, 2));
        const { identity, ...requestContext } = event.requestContext;

        const report = {
            requestContext,
            context,
            errors: []
        };

        if (e.constructor.name === "ApolloGatewayError") {
            e.errors.forEach(error => report.errors.push(error));
        } else {
            report.errors.push({ name: e.constructor.name, message: e.message });
        }

        if (process.env.DEBUG === "true") {
            return {
                statusCode: 500,
                body: JSON.stringify(report, null, 2)
            };
        }

        throw e;
    }
};
