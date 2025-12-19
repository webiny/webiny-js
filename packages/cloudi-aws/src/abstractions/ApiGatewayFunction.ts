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

