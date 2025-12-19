import type {
    APIGatewayEvent,
    APIGatewayProxyResult
} from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";
import type { Abstraction } from "@webiny/di";

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

    /**
     * Detect if the event is an API Gateway event
     */
    export function canUse(event: any): event is APIGatewayEvent {
        return !!event.httpMethod && !!event.requestContext;
    }

    export function createImplementation<T extends IApiGatewayFunction>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: ApiGatewayFunction,
            implementation: config.implementation,
            dependencies: config.dependencies,
            canUse: ApiGatewayFunction.canUse
        };
    }
}

export type { APIGatewayEvent, APIGatewayProxyResult };

