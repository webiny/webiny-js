import type { APIGatewayEvent, APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler-core";

export interface IApiGatewayEventHandler extends IEventHandler<
    APIGatewayEvent,
    APIGatewayProxyResult
> {}

export const ApiGatewayEventHandler = new Abstraction<IApiGatewayEventHandler>(
    "ApiGatewayEventHandler"
);

export namespace ApiGatewayEventHandler {
    export type Interface = IApiGatewayEventHandler;
}

export type { APIGatewayEvent, APIGatewayProxyResult };
