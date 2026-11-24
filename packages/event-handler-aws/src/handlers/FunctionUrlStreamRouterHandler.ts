import { HttpRouter } from "@webiny/event-handler-core";
import type { EventContext, IHttpResponse, NextFunction } from "@webiny/event-handler-core";
import { FunctionUrlStreamEventHandler } from "~/abstractions/handlers/FunctionUrlStreamEventHandler.js";
import { LambdaResponseStream } from "~/abstractions/LambdaResponseStream.js";
import { functionUrlEventToHttpRequest } from "~/translators/functionUrlEventToHttpRequest.js";
import { writeHttpResponseToStream } from "~/streaming/writeHttpResponseToStream.js";

const INTERNAL_SERVER_ERROR: IHttpResponse = {
    statusCode: 500,
    headers: { "content-type": "application/json" },
    body: { message: "Internal server error" }
};

/**
 * Terminal handler for the Lambda Function URL response-streaming transport. Routes through the same
 * `HttpRouter` every other transport uses, then writes the result to the invocation's response stream
 * — incrementally when the route returned an {@link HttpStreamBody}, in one shot otherwise.
 *
 * Mirrors `ApiGatewayHttpRouterHandler`, except nothing is returned: the response leaves through the
 * stream, so once the prelude is written the status code can no longer change.
 */
class FunctionUrlStreamRouterHandlerImpl implements FunctionUrlStreamEventHandler.Interface {
    constructor(
        private router: HttpRouter.Interface,
        private responseStream: LambdaResponseStream.Interface
    ) {}

    async execute(ctx: EventContext<any>, _next: NextFunction): Promise<void> {
        const raw = this.responseStream.get();
        const request = functionUrlEventToHttpRequest(ctx.event);

        let response: IHttpResponse;
        try {
            response = await this.router.route(request);
        } catch (e) {
            // The router turns its own errors into responses (`HttpErrorDecorator`), so this is rare.
            console.error("HTTP handler error:", e);
            await writeHttpResponseToStream(raw, INTERNAL_SERVER_ERROR);
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

export const FunctionUrlStreamRouterHandler = FunctionUrlStreamEventHandler.createImplementation({
    implementation: FunctionUrlStreamRouterHandlerImpl,
    dependencies: [HttpRouter, LambdaResponseStream]
});
