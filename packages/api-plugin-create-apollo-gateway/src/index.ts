import { ApolloGateway, RemoteGraphQLDataSource, ServiceEndpointDefinition } from "@apollo/gateway";
import { GraphQLRequestContext } from "apollo-server-types";
import { ApolloServer } from "apollo-server-lambda";
import { CreateApolloGatewayPlugin } from "@webiny/api/types";
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

export default (params: ApolloGatewayPluginParams): CreateApolloGatewayPlugin => ({
    name: "create-apollo-gateway",
    type: "create-apollo-gateway",
    async createGateway({ plugins }) {
        const { server, services, handler } = params;
        const gateway = new ApolloGateway({
            serviceList: services,

            buildService({ url }) {
                return new RemoteGraphQLDataSource({
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
                    }
                });
            }
        });

        const { schema, executor } = await gateway.load();

        const apollo = new ApolloServer({
            schema,
            executor,
            introspection: toBool(server.introspection),
            playground: toBool(server.playground),
            context: async ({ event }) => {
                const headers = buildHeaders(event);

                const headerPlugins = plugins.byType("apollo-gateway-headers") as ApolloGatewayHeaders[];
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
    }
});
