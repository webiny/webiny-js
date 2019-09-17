import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import { ApolloServer } from "apollo-server-lambda";

const buildHeaders = ({ headers }) => {
    return {
        "Content-Type": headers["content-type"] || headers["Content-Type"],
        Accept: headers["Accept"],
        "Accept-Encoding": headers["Accept-Encoding"],
        "Accept-Language": headers["Accept-Language"],
        Authorization: headers["Authorization"]
    };
};

const createHandler = async () => {
    const services = [];
    Object.keys(process.env).forEach(key => {
        if (key.startsWith("SERVICE_")) {
            services.push({
                name: key.replace("SERVICE_", ""),
                url: process.env[key]
            });
        }
    });

    const gateway = new ApolloGateway({
        serviceList: services,
        buildService({ url }) {
            return new RemoteGraphQLDataSource({
                url,
                willSendRequest({ request, context }) {
                    Object.keys(context.headers).forEach(key => {
                        if (context.headers[key]) {
                            request.http.headers.set(key, context.headers[key]);
                        }
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
