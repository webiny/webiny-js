import { ApolloGateway, RemoteGraphQLDataSource, ServiceEndpointDefinition } from "@apollo/gateway";
import { GraphQLRequestContext, GraphQLResponse } from "apollo-server-types";
import { ApolloServer } from "apollo-server-lambda";
import { CreateApolloGatewayPlugin } from "@webiny/api/types";
import get from "lodash.get";
import { ApolloGatewayHeaders } from "./types";
import buildHeaders from "./buildHeaders";

function toBool(value) {
    if (typeof value === "string") {
        return value === "true";
    }

    return Boolean(value);
}

type ApolloGatewayPluginParams = {
    server?: {
        introspection?: boolean;
        playground?: boolean;
    };
    services: ServiceEndpointDefinition[];
    handler?: {
        cors?: { [key: string]: any };
    };
};

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

class WebinyDataSource extends RemoteGraphQLDataSource {
    constructor({ onServiceError, ...config }: Partial<WebinyDataSource>) {
        super(config);
        this.onServiceError = onServiceError;
    }

    onServiceError?(error): void;

    async process<TContext>({
        request,
        context
    }: Pick<GraphQLRequestContext<TContext>, "request" | "context">): Promise<GraphQLResponse> {
        try {
            return await super.process({ request, context }).then(res => {
                if (res.errors) {
                    res.errors.map(error => this.onServiceError(error));
                }
                return res;
            });
        } catch (error) {
            this.onServiceError(error);
            return Promise.reject(error);
        }
    }
}

class ApolloGatewayError extends Error {
    errors: any[];

    constructor(errors) {
        super("");
        this.errors = errors;
    }
}

export default (params: ApolloGatewayPluginParams): CreateApolloGatewayPlugin => ({
    name: "create-apollo-gateway",
    type: "create-apollo-gateway",
    async createGateway({ plugins }) {
        const { server = {}, services, handler = {} } = params;
        const dataSourceErrors = [];
        const gateway = new ApolloGateway({
            debug: toBool(process.env.DEBUG),
            serviceList: services,
            buildService({ name, url }) {
                return new WebinyDataSource({
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
                schema,
                executor,
                introspection: toBool(server.introspection),
                playground: toBool(server.playground),
                context: async ({ event }) => {
                    const headers = buildHeaders(event);

                    const headerPlugins = plugins.byType<ApolloGatewayHeaders>(
                        "apollo-gateway-headers"
                    );
                    headerPlugins.forEach(pl => pl.buildHeaders({ headers, plugins }));

                    return { headers };
                }
            });

            return apollo.createHandler({
                cors: {
                    origin: "*",
                    methods: "GET,HEAD,POST,OPTIONS",
                    ...handler.cors
                }
            });
        } catch (e) {
            if (dataSourceErrors.length > 0) {
                console.log("dataSourceErrors", JSON.stringify({ dataSourceErrors }, null, 2));
                throw new ApolloGatewayError(dataSourceErrors);
            }
            throw e;
        }
    }
});
