import type {
    APIGatewayEvent,
    APIGatewayProxyResult
} from "@webiny/aws-sdk/types/index.js";
import type { Abstraction } from "@webiny/di";
import { Abstraction as AbstractionClass } from "@webiny/di";
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

export const ApiGatewayFunction = new AbstractionClass<IApiGatewayFunction>("ApiGatewayFunction");

export namespace ApiGatewayFunction {
    export type Interface = IApiGatewayFunction;

    export function createImplementation<T extends IApiGatewayFunction>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: ApiGatewayFunction,
            implementation: config.implementation,
            dependencies: config.dependencies
        };
    }
}

export type { APIGatewayEvent, APIGatewayProxyResult };

