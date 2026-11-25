import { HttpRouter } from "~/index.js";
import { corsHeaders } from "~/index.js";
import { getHeader } from "~/index.js";
import { internalServerErrorResponse } from "~/index.js";
import type { InputContext, IHttpResponse, NextFunction } from "~/index.js";
import { NodeHttpInputHandler } from "~/nodeHttp/abstractions/NodeHttpInputHandler.js";
import { nodeHttpRequestFromIncomingMessage } from "~/nodeHttp/translators/NodeHttpTranslator.js";
import { RequestBodyTooLargeError } from "~/nodeHttp/translators/RequestBodyTooLargeError.js";

/**
 * Terminal handler for the Node HTTP server transport. Translates the raw `IncomingMessage` into an
 * IHttpRequest, dispatches it through the shared `HttpRouter`, and returns the IHttpResponse (which
 * `createServerHandler` writes to the Node response). Mirrors AWS's `ApiGatewayHttpRouterHandler`,
 * minus the transport-specific response translation (the server writes IHttpResponse directly).
 *
 * The router turns its own errors into responses (`HttpErrorDecorator`), so only errors from reading
 * the request reach the catch below.
 */
class NodeHttpRouterHandlerImpl implements NodeHttpInputHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: InputContext<any>, _next: NextFunction): Promise<IHttpResponse> {
        try {
            const request = await nodeHttpRequestFromIncomingMessage(ctx.input);
            return await this.router.route(request);
        } catch (e) {
            if (e instanceof RequestBodyTooLargeError) {
                /*
                 * Close the connection after answering, so Node doesn't read the rest of the body.
                 * The router never saw this request, so the CORS headers are added here.
                 */
                const origin = getHeader(ctx.input?.headers, "origin");
                const cors = corsHeaders(origin);
                return {
                    statusCode: 413,
                    headers: { ...cors, "content-type": "application/json", connection: "close" },
                    body: { message: e.message }
                };
            }
            console.error("HTTP handler error:", e);
            return internalServerErrorResponse();
        }
    }
}

export const NodeHttpRouterHandler = NodeHttpInputHandler.createImplementation({
    implementation: NodeHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
