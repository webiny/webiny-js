import type { APIGatewayEvent, APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { InputHandler } from "@webiny/kernel-core";

export interface IApiGatewayInputHandler extends InputHandler.Interface<
    APIGatewayEvent,
    APIGatewayProxyResult
> {}

export const ApiGatewayInputHandler = new Abstraction<IApiGatewayInputHandler>(
    "ApiGatewayInputHandler"
);

export namespace ApiGatewayInputHandler {
    export type Interface = IApiGatewayInputHandler;
}

export type { APIGatewayEvent, APIGatewayProxyResult };
