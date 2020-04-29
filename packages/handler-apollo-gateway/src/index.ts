import { HandlerApolloGatewayOptions } from "./types";
import gatewayHandler from "./gatewayHandler";
import errorHandler from "./errorHandler";
import { Plugin } from "@webiny/plugins/types";

export default (options: HandlerApolloGatewayOptions) => {
    const plugins = [gatewayHandler(options), errorHandler()] as Plugin[];

    if (Array.isArray(options.services)) {
        plugins.push(
            ...options.services.map(service => ({
                type: "handler-apollo-gateway-service",
                name: "handler-apollo-gateway-service-" + service.name,
                service
            }))
        );
    }

    return plugins;
};
