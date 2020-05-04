import { createHandler } from "@webiny/handler";
import { HttpHandlerApolloGatewayOptions } from "@webiny/handler-apollo-gateway/types";
import apolloGatewayHandler from "@webiny/handler-apollo-gateway";

declare const HTTP_HANDLER_APOLLO_GATEWAY_OPTIONS: HttpHandlerApolloGatewayOptions;

export const handler = createHandler(apolloGatewayHandler(HTTP_HANDLER_APOLLO_GATEWAY_OPTIONS));
