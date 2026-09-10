import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler-core";

/**
 * Terminal-handler abstraction for the Lambda Function URL response-streaming transport.
 *
 * Separate from `ApiGatewayEventHandler` even though the event payloads look alike, because the
 * result contract is different: this handler writes to the response stream and returns nothing,
 * whereas an API Gateway handler returns a buffered `APIGatewayProxyResult`. Keeping them apart also
 * means the auth/tenant decorators for one transport can't silently apply to the other.
 */
export interface IFunctionUrlStreamEventHandler extends IEventHandler<any, void> {}

export const FunctionUrlStreamEventHandler = new Abstraction<IFunctionUrlStreamEventHandler>(
    "FunctionUrlStreamEventHandler"
);

export namespace FunctionUrlStreamEventHandler {
    export type Interface = IFunctionUrlStreamEventHandler;
}
