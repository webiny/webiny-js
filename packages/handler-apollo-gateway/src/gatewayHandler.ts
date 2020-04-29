import { ApolloGateway } from "@apollo/gateway";
import { GraphQLRequestContext } from "apollo-server-types";
import { boolean } from "boolean";
import { ApolloServer } from "apollo-server-lambda";
import { HandlerArgs, HandlerContext, HandlerPlugin } from "@webiny/handler/types";
import get from "lodash.get";
import {
    HandlerApolloGatewayHeadersPlugin,
    HandlerApolloGatewayOptions,
    HandlerApolloGatewayServicePlugin
} from "./types";
import buildHeaders from "./buildHeaders";
import { DataSource } from "./DataSource";

function normalizeEvent(event) {
    // In AWS, when enabling binary support, received body gets base64 encoded. Did not find a way to solve this
    // correctly, so for now we "normalize" the event before passing it to the handler. It would be nice if
    // we could resolve this issue better / smarter in the future (configure integrations correctly?).
    if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, "base64").toString("utf-8");
    }
}

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

type GetHandlerOptions = {
    options: HandlerApolloGatewayOptions;
    args: HandlerArgs;
    context: HandlerContext;
};

let cache = null;

const createHeaders = (event, context: HandlerContext) => {
    const headers = buildHeaders(event);
    headers["x-webiny-apollo-gateway-url"] = [
        "https://",
        event.requestContext.domainName,
        event.requestContext.path
    ].join("");

    const headerPlugins = context.plugins.byType<HandlerApolloGatewayHeadersPlugin>(
        "handler-apollo-gateway-headers"
    );
    headerPlugins.forEach(pl => pl.buildHeaders({ headers, plugins: context.plugins }));

    return headers;
};

const getHandler = async ({ args, options, context }: GetHandlerOptions) => {
    if (cache) {
        return cache;
    }

    const servicePlugins = context.plugins.byType<HandlerApolloGatewayServicePlugin>(
        "handler-apollo-gateway-service"
    );

    if (!servicePlugins.length) {
        throw Error(`Missing "handler-apollo-gateway-service" plugins!`);
    }

    const { server = {}, handler = {} } = options;
    const dataSourceErrors = [];

    const services = servicePlugins.map(pl => {
        return { ...pl.service, url: pl.service.name };
    });

    const gateway = new ApolloGateway({
        debug: boolean(options.debug),
        serviceList: services,
        buildService({ name }) {
            return new DataSource({
                functionName: services.find(s => s.name === name).function,
                willSendRequest(params: Pick<GraphQLRequestContext, "request" | "context">) {
                    let headers = params.context.headers;

                    // If cold-start, `context.headers` will not be available.
                    if (!headers) {
                        headers = createHeaders(args[0], context);
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
            // @ts-ignore Not sure why it doesn't work, "boolean" function does return a boolean value.
            introspection: boolean(server.introspection),
            // @ts-ignore Not sure why it doesn't work, "boolean" function does return a boolean value.
            playground: boolean(server.playground),
            debug: boolean(process.env.DEBUG),
            ...server,
            schema,
            executor,
            context: async ({ event }) => {
                return { headers: createHeaders(event, context) };
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
            normalizeEvent(event);
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
            throw new ApolloGatewayError(dataSourceErrors);
        }
        throw e;
    }

    return cache;
};

const plugins = (options: HandlerApolloGatewayOptions): HandlerPlugin => ({
    name: "handler-apollo-gateway",
    type: "handler",
    async handle({ args, context }, next) {
        const [event, handlerContext] = args;

        if (!["POST", "GET", "OPTIONS"].includes(event.httpMethod)) {
            return next();
        }

        const handler = await getHandler({ options, args, context });

        return await handler(event, handlerContext);
    }
});

export default plugins;
