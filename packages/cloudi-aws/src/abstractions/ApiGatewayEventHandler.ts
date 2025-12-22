import type {
    APIGatewayEvent,
    APIGatewayProxyResult
} from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";

/**
 * Abstraction for API Gateway event handlers
 */
export interface IApiGatewayEventHandler {
    /**
     * Handle the API Gateway event
     */
    execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult>;
}

export const ApiGatewayEventHandler = createAbstraction<IApiGatewayEventHandler>("ApiGatewayEventHandler");

export namespace ApiGatewayEventHandler {
    export type Interface = IApiGatewayEventHandler;
}

export type { APIGatewayEvent, APIGatewayProxyResult };

