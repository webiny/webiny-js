import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import { ApolloServer } from "apollo-server-lambda";

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
    const { schema, executor } = await gateway.load();

    let apollo = new ApolloServer({
        schema,
        executor,
        introspection: true,
        playground: true,
        context: async ({ event }) => {
            return { headers: event.headers };
        }
    });

    let apolloHandler = apollo.createHandler();

    return new Promise((resolve, reject) => {
        apolloHandler(event, context, (error, data) => {
            if (error) {
                return reject(error);
            }

            resolve(data);
        });
    });
};
