import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import { ApolloServer } from "apollo-server-lambda";

export const handler = async (event, context) => {
    const gateway = new ApolloGateway({
        serviceList: [
            { name: "files", url: "http://localhost:9000/function/files" },
            { name: "pageBuilder", url: "http://localhost:9000/function/page-builder" },
            { name: "security", url: "http://localhost:9000/function/security" },
            { name: "i18n", url: "http://localhost:9000/function/i18n" },
            { name: "forms", url: "http://localhost:9000/function/forms" }
            // { name: "headless", url: "http://localhost:9000/function/headless" }
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
