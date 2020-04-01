import { Plugin, PluginsContainer } from "@webiny/graphql/types";
import { ServiceEndpointDefinition } from "@apollo/gateway";

export type HttpHandlerApolloGatewayHeadersPlugin = Plugin & {
    type: "http-handler-apollo-gateway-headers";
    buildHeaders(params: { headers: { [key: string]: string }; plugins: PluginsContainer }): void;
};

export interface HttpHandlerApolloGatewayOptions {
    debug?: boolean | string;
    server?: {
        introspection?: boolean | string;
        playground?: boolean | string;
    };
    handler?: {
        cors?: { [key: string]: any };
    };
    services: [ApolloGatewayServiceDefinition];
}

export type ApolloGatewayServiceDefinition = ServiceEndpointDefinition;

export type HttpHandlerApolloGatewayServicePlugin = Plugin & {
    type: "http-handler-apollo-gateway-service";
    service: ApolloGatewayServiceDefinition;
};
