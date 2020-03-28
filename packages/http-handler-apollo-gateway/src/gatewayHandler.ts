import { ApolloGateway } from "@apollo/gateway";
import { GraphQLRequestContext } from "apollo-server-types";
import { boolean } from "boolean";
import { ApolloServer } from "apollo-server-lambda";
import { HttpArgs, HttpHandlerContext, HttpHandlerPlugin } from "@webiny/http-handler/types";
import get from "lodash.get";
import {
    HttpHandlerApolloGatewayHeadersPlugin,
    HttpHandlerApolloGatewayOptions,
    HttpHandlerApolloGatewayServicePlugin
} from "./types";
import buildHeaders from "./buildHeaders";
import { DataSource } from "./DataSource";

function getError(error) {
    let err = get(error, "extensions.response.body.error");
    if (err) {
        return {
            error: err.message,
            stack: err.stack
        };
    }

    err = get(error, "extensions.exception");
    if (err) {
        return {
            error: error.message,
            stack: err.stacktrace
        };
    }

    return { error: error.message };
}

class ApolloGatewayError extends Error {
    errors: any[];

    constructor(errors) {
        super("");
        this.errors = errors;
    }
}

type GetHandlerOptions = {
    options: HttpHandlerApolloGatewayOptions;
    args: HttpArgs;
    context: HttpHandlerContext;
};

let cache = null;

const getHandler = async ({ options, context }: GetHandlerOptions) => {
    if (cache) {
        return cache;
    }

    const servicePlugins = context.plugins.byType<HttpHandlerApolloGatewayServicePlugin>(
        "http-handler-apollo-gateway-service"
    );

    if (!servicePlugins.length) {
        throw Error(`Missing "http-handler-apollo-gateway-service" plugins!`);
    }

    const { server = {}, handler = {} } = options;
    const dataSourceErrors = [];

    const gateway = new ApolloGateway({
        debug: boolean(options.debug),
        serviceList: servicePlugins.map(pl => pl.service),
        buildService({ name, url }) {
            return new DataSource({
                url,
                willSendRequest(params: Pick<GraphQLRequestContext, "request" | "context">) {
                    const { context, request } = params;
                    // TODO: process plugins
                    if (context.headers) {
                        Object.keys(context.headers).forEach(key => {
                            if (context.headers[key]) {
                                request.http.headers.set(key, context.headers[key]);
                            }
                        });
                    }
                },
                onServiceError(error) {
                    dataSourceErrors.push({
                        ...getError(error),
                        service: name,
                        url
                    });
                }
            });
        }
    });

    try {
        const { schema, executor } = await gateway.load();

        if (dataSourceErrors.length > 0) {
            throw new ApolloGatewayError(dataSourceErrors);
        }

        const apollo = new ApolloServer({
            // @ts-ignore Not sure why it doesn't work, "boolean" function does return a boolean value.
            introspection: boolean(server.introspection),
            // @ts-ignore Not sure why it doesn't work, "boolean" function does return a boolean value.
            playground: boolean(server.playground),
            debug: boolean(process.env.DEBUG),
            ...server,
            schema,
            executor,
            context: async ({ event }) => {
                const headers = buildHeaders(event);

                const headerPlugins = context.plugins.byType<HttpHandlerApolloGatewayHeadersPlugin>(
                    "http-handler-apollo-gateway-headers"
                );
                headerPlugins.forEach(pl => pl.buildHeaders({ headers, plugins: context.plugins }));

                return { headers };
            }
        });

        const apolloHandler = apollo.createHandler({
            cors: {
                origin: "*",
                methods: "GET,HEAD,POST",
                ...(handler.cors || {})
            }
        });

        cache = (event, context) => {
            return new Promise(resolve => {
                apolloHandler(event, context, (error, data) => {
                    if (error) {
                        return resolve({
                            statusCode: 500,
                            body: typeof error === "string" ? error : error.message
                        });
                    }

                    resolve(data);
                });
            });
        };
    } catch (e) {
        if (dataSourceErrors.length > 0) {
            console.log("dataSourceErrors", JSON.stringify({ dataSourceErrors }, null, 2));
            throw new ApolloGatewayError(dataSourceErrors);
        }
        throw e;
    }

    return cache;
};

const plugins = (options: HttpHandlerApolloGatewayOptions): HttpHandlerPlugin => ({
    name: "handler-apollo-gateway",
    type: "handler",
    canHandle({ args }) {
        const [event] = args;
        return (
            event.httpMethod === "POST" ||
            event.httpMethod === "GET" ||
            event.httpMethod === "OPTIONS"
        );
    },
    async handle({ args, context }) {
        const handler = await getHandler({ options, args, context });
        const [event, handlerContext] = args;
        return await handler(event, handlerContext);
    }
});

export default plugins;
