import type {
    APIGatewayEvent,
    APIGatewayProxyResult
} from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";

/**
 * Abstraction for API Gateway Lambda functions
 */
export interface IApiGatewayFunction {
    /**
     * Handle the API Gateway event
     */
    execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult>;
}

export const ApiGatewayFunction = createAbstraction<IApiGatewayFunction>("ApiGatewayFunction");

export namespace ApiGatewayFunction {
    export type Interface = IApiGatewayFunction;
}

export type { APIGatewayEvent, APIGatewayProxyResult };

