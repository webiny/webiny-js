import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import { ApolloServer } from "apollo-server-lambda";
import buildHeaders from "./buildHeaders";

const createHandler = async () => {
    const gateway = new ApolloGateway({
        serviceList: [],
        buildService({ url }) {
            return new RemoteGraphQLDataSource({
                url,
                willSendRequest({ request, context }) {
                    if (context.headers) {
                        Object.keys(context.headers).forEach(key => {
                            if (context.headers[key]) {
                                request.http.headers.set(key, context.headers[key]);
                            }
                        });
                    }
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
            return { headers: buildHeaders(event) };
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
