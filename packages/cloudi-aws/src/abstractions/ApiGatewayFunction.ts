import type {
    APIGatewayEvent,
    APIGatewayProxyResult
} from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";
import type { NextFunction } from "../types.js";

/**
 * Abstraction for API Gateway Lambda functions
 */
export interface IApiGatewayFunction {
    /**
     * Handle the API Gateway event
     * If this handler cannot process the event, it should call next() to pass to the next handler
     */
    execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult>;
}

export const ApiGatewayFunction = createAbstraction<IApiGatewayFunction>("ApiGatewayFunction");

export namespace ApiGatewayFunction {
    export type Interface = IApiGatewayFunction;
}

export type { APIGatewayEvent, APIGatewayProxyResult };

