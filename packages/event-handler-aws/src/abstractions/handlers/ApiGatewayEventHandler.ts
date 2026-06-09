import type { APIGatewayEvent, APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { IEventHandler } from "@webiny/event-handler-core";

// API Gateway handlers register under HttpEventHandler from @webiny/event-handler.
// This namespace provides the typed interface for type-safe implementations.
export namespace ApiGatewayEventHandler {
    export type Interface = IEventHandler<APIGatewayEvent, APIGatewayProxyResult>;
}

export type { APIGatewayEvent, APIGatewayProxyResult };
