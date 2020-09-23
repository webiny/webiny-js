import { ApolloGateway } from "@apollo/gateway";
import { GraphQLRequestContext } from "apollo-server-types";
import { boolean } from "boolean";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerClientContext } from "@webiny/handler-client/types";
import buildHeaders from "./buildHeaders";
import { DataSource } from "./../DataSource";
import get from "lodash.get";
import { HandlerApolloGatewayHeadersPlugin, HandlerApolloGatewayServicePlugin } from "./../types";
import { runHttpQuery } from "apollo-server-core/dist/runHttpQuery";
import { generateSchemaHash } from "apollo-server-core/dist/utils/schemaHash";
import { Headers } from "apollo-server-env";
import buildCorsHeaders from "./buildCorsHeaders";

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

    if (dataSourceErrors.length > 0) {
        throw new ApolloGatewayError(dataSourceErrors);
    }

    try {
        const { schema, executor } = await gateway.load();
        const schemaHash = generateSchemaHash(schema);

        // Create handler.
        cache = async function(context) {
            const { http } = context;

            try {
                const { graphqlResponse } = await runHttpQuery([], {
                    method: "POST",
                    query: JSON.parse(http.body),
                    options: { schema, schemaHash, context, executor },
                    request: {
                        url: "/graphql",
                        method: "POST",
                        headers: new Headers(http.headers)
                    }
                });

                return http.response({
                    body: graphqlResponse,
                    headers: buildCorsHeaders({
                        "Content-Type": "application/json"
                    })
                });
            } catch (e) {
                throw new ApolloGatewayError(e);
            }
        };
    } catch (e) {
        if (dataSourceErrors.length > 0) {
            throw new ApolloGatewayError(dataSourceErrors);
        }
        throw e;
    }

    return cache;
};
