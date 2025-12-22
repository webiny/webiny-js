import { createAbstraction } from "./createAbstraction.js";

/**
 * Abstraction for API Gateway event qualifier
 * Determines if an event is an API Gateway event
 */
export interface IApiGatewayEventQualifier {
    /**
     * Check if the event is an API Gateway event
     */
    execute(event: any): boolean;
}

export const ApiGatewayEventQualifier = createAbstraction<IApiGatewayEventQualifier>("ApiGatewayEventQualifier");

export namespace ApiGatewayEventQualifier {
    export type Interface = IApiGatewayEventQualifier;
}

