const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
import { ApolloServer } from "apollo-server-lambda";

const gateway = new ApolloGateway({
    serviceList: [
        {
            name: "pageBuilder",
            url: process.env.FUNCTIONS_HOST + "/function/page-builder"
        },
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

export const createHandler = async (context) => {
    const { schema, executor } = await gateway.load();

    const apollo = new ApolloServer({
        schema,
        executor,
        introspection: context.devMode === true,
        playground: context.devMode === true,
        context: async ({ event }) => {
            return { headers: event.headers };
        },
        formatError: err => {
            if (err.extensions.code === "DOWNSTREAM_SERVICE_ERROR") {
                return err.extensions.downstreamErrors[0];
            }

            return err;
        }
    });

    const handler = apollo.createHandler();

    return (event: Object, context: Object): Promise<Object> => {
        return new Promise((resolve, reject) => {
            handler(event, context, (error, data) => {
                if (error) {
                    return reject(error);
                }

                resolve(data);
            });
        });
    };
};
