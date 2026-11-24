import { HttpRouter } from "~/index.js";
import { corsHeaders } from "~/index.js";
import type { EventContext, IHttpResponse, NextFunction } from "~/index.js";
import { NodeHttpEventHandler } from "~/nodeHttp/abstractions/NodeHttpEventHandler.js";
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
class NodeHttpRouterHandlerImpl implements NodeHttpEventHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: EventContext<any>, _next: NextFunction): Promise<IHttpResponse> {
        try {
            const request = await nodeHttpRequestFromIncomingMessage(ctx.event);
            return await this.router.route(request);
        } catch (e) {
            if (e instanceof RequestBodyTooLargeError) {
                /*
                 * Close the connection after answering, so Node doesn't read the rest of the body.
                 * The router never saw this request, so the CORS headers are added here.
                 */
                const cors = corsHeaders(ctx.event?.headers?.origin);
                return {
                    statusCode: 413,
                    headers: { ...cors, "content-type": "application/json", connection: "close" },
                    body: { message: e.message }
                };
            }
            console.error("HTTP handler error:", e);
            return {
                statusCode: 500,
                headers: { "content-type": "application/json" },
                body: { message: "Internal server error" }
            };
        }
    }
}

export const NodeHttpRouterHandler = NodeHttpEventHandler.createImplementation({
    implementation: NodeHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
