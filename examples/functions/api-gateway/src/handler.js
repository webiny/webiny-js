import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import { ApolloServer } from "apollo-server-lambda";

const host = process.env.FUNCTIONS_HOST || "http://localhost:9000";

export const handler = async (event, context) => {
    const gateway = new ApolloGateway({
        serviceList: [
            { name: "files", url: host + "/function/files" },
            { name: "pageBuilder", url: host + "/function/page-builder" },
            { name: "security", url: host + "/function/security" },
            { name: "i18n", url: host + "/function/i18n" },
            { name: "forms", url: host + "/function/forms" }
            // { name: "headless", url: host + "/function/headless" }
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

    let apolloHandler = apollo.createHandler({
        cors: {
            origin: "*",
            methods: "GET,HEAD,POST,OPTIONS"
        }
    });

    return new Promise((resolve, reject) => {
        apolloHandler(event, context, (error, data) => {
            if (error) {
                return reject(error);
            }

            resolve(data);
        });
    });
};
