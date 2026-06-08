import type { APIGatewayEvent, APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { IEventHandler } from "@webiny/event-handler";

// API Gateway handlers register under HttpEventHandler from @cloudi/core.
// This namespace provides the typed interface for type-safe implementations.
export namespace ApiGatewayEventHandler {
    export type Interface = IEventHandler<APIGatewayEvent, APIGatewayProxyResult>;
}

export type { APIGatewayEvent, APIGatewayProxyResult };
