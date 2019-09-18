import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import { ApolloServer } from "apollo-server-lambda";

const host = process.env.API_HOST || "http://localhost:9000";

const createHandler = async () => {
    const gateway = new ApolloGateway({
        serviceList: [
            { name: "files", url: host + "/graphql/files" },
            { name: "pageBuilder", url: host + "/graphql/page-builder" },
            { name: "security", url: host + "/graphql/security" },
            { name: "i18n", url: host + "/graphql/i18n" },
            { name: "forms", url: host + "/graphql/forms" },
            { name: "cms", url: host + "/graphql/cms" }
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

    return apollo.createHandler({
        cors: {
            origin: "*",
            methods: "GET,HEAD,POST,OPTIONS"
        }
    });
};

let apolloHandler;

export const handler = async (event, context) => {
    if (!apolloHandler) {
        apolloHandler = await createHandler();
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
