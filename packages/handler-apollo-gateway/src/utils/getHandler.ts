import { ApolloGateway } from "@apollo/gateway";
import { GraphQLRequestContext } from "apollo-server-types";
import { boolean } from "boolean";
import { ApolloServerBase as ApolloServer } from "apollo-server-core";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerClientContext } from "@webiny/handler-client/types";
import buildHeaders from "./buildHeaders";
import { DataSource } from "./../DataSource";
import get from "lodash.get";
import { HandlerApolloGatewayHeadersPlugin, HandlerApolloGatewayServicePlugin } from "./../types";

function getError(error) {
    let err = get(error, "extensions.response");
    if (err) {
        const body = JSON.parse(err.body);
        return {
            error: body.error.message,
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

    if (error.error) {
        return { error: error.error };
    }

    return { error };
}

class ApolloGatewayError extends Error {
    errors: any[];

    constructor(errors) {
        super("");
        this.errors = errors;
    }
}

let cache = null;

type Context = HandlerContext & HandlerHttpContext & HandlerClientContext;

const createHeaders = (context: Context) => {
    const headers = buildHeaders(context.http);

    const headerPlugins = context.plugins.byType<HandlerApolloGatewayHeadersPlugin>(
        "handler-apollo-gateway-headers"
    );
    headerPlugins.forEach(pl => pl.buildHeaders({ headers, context }));

    return headers;
};

export default async (context: Context, options) => {
    if (cache) {
        return cache;
    }

    const servicePlugins = context.plugins.byType<HandlerApolloGatewayServicePlugin>(
        "handler-apollo-gateway-service"
    );

    if (!servicePlugins.length) {
        throw Error(`Missing "handler-apollo-gateway-service" plugins!`);
    }

    const { server = {} } = options;
    const dataSourceErrors = [];

    const services = servicePlugins.map(pl => {
        return { ...pl.service, url: pl.service.name };
    });

    const gateway = new ApolloGateway({
        debug: boolean(options.debug),
        serviceList: services,
        buildService({ name }) {
            return new DataSource({
                handlerClient: context.handlerClient,
                functionName: services.find(s => s.name === name).function,
                willSendRequest(params: Pick<GraphQLRequestContext, "request" | "context">) {
                    let headers = params.context.headers;

                    // If cold-start, `context.headers` will not be available.
                    if (!headers) {
                        headers = createHeaders(context);
                    }

                    Object.keys(headers).forEach(key => {
                        params.request.http.headers.set(key, headers[key]);
                    });
                },
                onServiceError(error) {
                    dataSourceErrors.push({
                        ...getError(error),
                        service: name,
                        functionName: services.find(s => s.name === name).function
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
            uploads: false,
            // @ts-ignore Not sure why it doesn't work, "boolean" function does return a boolean value.
            introspection: boolean(server.introspection),
            // @ts-ignore Not sure why it doesn't work, "boolean" function does return a boolean value.
            playground: boolean(server.playground),
            debug: boolean(process.env.DEBUG),
            ...server,
            schema,
            executor,
            context: async () => ({ headers: createHeaders(context) })
        });

        // Create handler.
        cache = async function(context) {
            const { http } = context;

            const result = await apollo.executeOperation(JSON.parse(http.body));
            if (result.errors) {
                throw new ApolloGatewayError(result.errors);
            }

            return http.response({
                headers: {
                    ...result.http.headers,
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({ data: result.data })
            });
        };
    } catch (e) {
        if (dataSourceErrors.length > 0) {
            throw new ApolloGatewayError(dataSourceErrors);
        }
        throw e;
    }

    return cache;
};
