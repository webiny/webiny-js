import { HttpHandlerApolloGatewayOptions } from "./types";
import gatewayHandler from "./gatewayHandler";
import errorHandler from "./errorHandler";

export default (options: HttpHandlerApolloGatewayOptions) => [
    gatewayHandler(options),
    errorHandler(),
    options.services.map(service => ({
        type: "http-handler-apollo-gateway-service",
        name: "http-handler-apollo-gateway-service-" + service.name,
        service
    }))
];
