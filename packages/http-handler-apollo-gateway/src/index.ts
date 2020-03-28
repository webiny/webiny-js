import { HttpHandlerApolloGatewayOptions } from "./types";
import gatewayHandler from "./gatewayHandler";
import errorHandler from "./errorHandler";

export default (options: HttpHandlerApolloGatewayOptions) => [
    gatewayHandler(options),
    errorHandler()
];
