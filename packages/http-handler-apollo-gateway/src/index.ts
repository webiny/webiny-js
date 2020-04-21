import { HttpHandlerApolloGatewayOptions } from "./types";
import gatewayHandler from "./gatewayHandler";
import errorHandler from "./errorHandler";
import { Plugin } from "@webiny/plugins/types";

export default (options: HttpHandlerApolloGatewayOptions) => {
    const plugins = [gatewayHandler(options), errorHandler()] as Plugin[];

    if (Array.isArray(options.services)) {
        plugins.push(
            ...options.services.map(service => ({
                type: "http-handler-apollo-gateway-service",
                name: "http-handler-apollo-gateway-service-" + service.name,
                service
            }))
        );
    }

    return plugins;
};
