import { createHandler } from "@webiny/http-handler";
import { HttpHandlerApolloGatewayOptions } from "@webiny/http-handler-apollo-gateway/types";
import apolloGatewayHandler from "@webiny/http-handler-apollo-gateway";

declare const HTTP_HANDLER_APOLLO_GATEWAY_OPTIONS: HttpHandlerApolloGatewayOptions;

export const handler = createHandler(apolloGatewayHandler(HTTP_HANDLER_APOLLO_GATEWAY_OPTIONS));
