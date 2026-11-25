import { Abstraction } from "@webiny/di";
import type { InputHandler } from "@webiny/api-kernel-core";

/**
 * Terminal-handler abstraction for the Lambda Function URL response-streaming transport.
 *
 * Separate from `ApiGatewayInputHandler` even though the event payloads look alike, because the
 * result contract is different: this handler writes to the response stream and returns nothing,
 * whereas an API Gateway handler returns a buffered `APIGatewayProxyResult`. Keeping them apart also
 * means the auth/tenant decorators for one transport can't silently apply to the other.
 */
export interface IFunctionUrlStreamInputHandler extends InputHandler.Interface<any, void> {}

export const FunctionUrlStreamInputHandler = new Abstraction<IFunctionUrlStreamInputHandler>(
    "FunctionUrlStreamInputHandler"
);

export namespace FunctionUrlStreamInputHandler {
    export type Interface = IFunctionUrlStreamInputHandler;
}
