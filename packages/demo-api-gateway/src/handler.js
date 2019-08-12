const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
import { ApolloServer } from "apollo-server-lambda";
import createConfig from "demo-service-config";

const host = process.env.FUNCTIONS_HOST;

const gateway = new ApolloGateway({
    serviceList: [
        { name: "pageBuilder", url: host + "/function/page-builder" },
        { name: "security", url: host + "/function/security" },
        { name: "files", url: host + "/function/files" },
        { name: "i18n", url: host + "/function/i18n" },
        { name: "forms", url: host + "/function/forms" }
        //{ name: "headless", url: host + "/function/headless" }
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
