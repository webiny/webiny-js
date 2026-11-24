import http from "node:http";
import type { Container } from "@webiny/di";
import { HandlerPlatform } from "@webiny/kernel-core";

/**
 * The header Lambda sets on every request it forwards to a web function's HTTP server. Lambda
 * returns the same value to the caller in a response header of the same name.
 */
const REQUEST_ID_HEADER = "lambda-web-request-id";

/**
 * AWS Lambda web function: a plain Node HTTP server, so there is no Lambda event or context to bind.
 * The request id comes in a request header instead, and is used as the execution id, so a log line
 * or an error can be matched to the response the caller got.
 *
 * Events dispatched through `EventDispatcher` are executions too, and get a generated id: they are
 * not requests, so they have no header to read.
 */
class LambdaWebHandlerPlatformImpl implements HandlerPlatform.Interface {
    bind(_container: Container, _rawArgs: any[]): void {}

    getExecutionId(rawArgs: any[]): string | undefined {
        const [request] = rawArgs;
        if (!(request instanceof http.IncomingMessage)) {
            return undefined;
        }

        const requestId = request.headers[REQUEST_ID_HEADER];
        if (typeof requestId !== "string" || !requestId) {
            return undefined;
        }
        return requestId;
    }
}

export const LambdaWebHandlerPlatform = HandlerPlatform.createImplementation({
    implementation: LambdaWebHandlerPlatformImpl,
    dependencies: []
});
