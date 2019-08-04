const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
import { ApolloServer } from "apollo-server-lambda";
import createConfig from "demo-service-config";

const gateway = new ApolloGateway({
    serviceList: [
        /*        {
            name: "pageBuilder",
            url: process.env.FUNCTIONS_HOST + "/function/page-builder"
        },*/
        { name: "security", url: process.env.FUNCTIONS_HOST + "/function/security" },
        { name: "files", url: process.env.FUNCTIONS_HOST + "/function/files" }
        //{ name: "headless", url: process.env.FUNCTIONS_HOST + "/function/headless" }
    ],
    buildService({ url }) {
        return new RemoteGraphQLDataSource({
            url,
            willSendRequest({ request, context }) {
                Object.keys(context.headers).forEach(key => {
                    request.http.headers.set(key, context.headers[key]);
                });
            }
        });
    }
});

export const handler = async (event, context) => {
    const config = await createConfig();
    const { schema, executor } = await gateway.load();

    const apollo = new ApolloServer({
        ...(config.apollo || {}),
        schema,
        executor,
        introspection: true,
        playground: true,
        context: async ({ event }) => {
            return { headers: event.headers };
        }
    });

    const handler = apollo.createHandler();

    return new Promise((resolve, reject) => {
        handler(event, context, (error, data) => {
            if (error) {
                return reject(error);
            }

            resolve(data);
        });
    });
};
