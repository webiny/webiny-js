import { HttpRouter } from "@webiny/api-kernel-core";
import { internalServerErrorResponse } from "@webiny/api-kernel-core";
import type { InputContext, IHttpResponse, NextFunction } from "@webiny/api-kernel-core";
import { FunctionUrlStreamInputHandler } from "~/abstractions/handlers/FunctionUrlStreamInputHandler.js";
import { LambdaResponseStream } from "~/abstractions/LambdaResponseStream.js";
import { functionUrlEventToHttpRequest } from "~/translators/functionUrlEventToHttpRequest.js";
import { writeHttpResponseToStream } from "~/streaming/writeHttpResponseToStream.js";

/**
 * Terminal handler for the Lambda Function URL response-streaming transport. Routes through the same
 * `HttpRouter` every other transport uses, then writes the result to the invocation's response stream
 * — incrementally when the route returned an {@link HttpStreamBody}, in one shot otherwise.
 *
 * Mirrors `ApiGatewayHttpRouterHandler`, except nothing is returned: the response leaves through the
 * stream, so once the prelude is written the status code can no longer change.
 */
class FunctionUrlStreamRouterHandlerImpl implements FunctionUrlStreamInputHandler.Interface {
    constructor(
        private router: HttpRouter.Interface,
        private responseStream: LambdaResponseStream.Interface
    ) {}

    async execute(ctx: InputContext<any>, _next: NextFunction): Promise<void> {
        const raw = this.responseStream.get();
        const request = functionUrlEventToHttpRequest(ctx.input);

        let response: IHttpResponse;
        try {
            response = await this.router.route(request);
        } catch (e) {
            // The router turns its own errors into responses (`ErrorResponseDecorator`), so this is rare.
            console.error("HTTP handler error:", e);
            const errorResponse = internalServerErrorResponse();
            await writeHttpResponseToStream(raw, errorResponse);
            return;
        }

        try {
            await writeHttpResponseToStream(raw, response);
        } catch (e) {
            // The prelude (and probably some body) is already out, so there is no way to turn this
            // into a 500. Destroy the stream so the client sees a truncated response instead of a
            // complete-looking one.
            console.error("Streaming HTTP handler failed mid-response:", e);
            if (raw.destroy) {
                raw.destroy(e instanceof Error ? e : new Error(String(e)));
            } else {
                raw.end();
            }
        }
    }
}

export const FunctionUrlStreamRouterHandler = FunctionUrlStreamInputHandler.createImplementation({
    implementation: FunctionUrlStreamRouterHandlerImpl,
    dependencies: [HttpRouter, LambdaResponseStream]
});
