import { HttpRouter, RouteNotFoundError } from "~/index.js";
import type { EventContext, IHttpResponse, NextFunction } from "~/index.js";
import { NodeHttpEventHandler } from "~/nodeHttp/abstractions/NodeHttpEventHandler.js";
import { nodeHttpRequestFromIncomingMessage } from "~/nodeHttp/translators/NodeHttpTranslator.js";
import { RequestBodyTooLargeError } from "~/nodeHttp/translators/RequestBodyTooLargeError.js";

/**
 * Terminal handler for the Node HTTP server transport. Translates the raw `IncomingMessage` into an
 * IHttpRequest, dispatches it through the shared `HttpRouter`, and returns the IHttpResponse (which
 * `createServerHandler` writes to the Node response). Mirrors AWS's `ApiGatewayHttpRouterHandler`,
 * minus the transport-specific response translation (the server writes IHttpResponse directly).
 */
class NodeHttpRouterHandlerImpl implements NodeHttpEventHandler.Interface {
    constructor(private router: HttpRouter.Interface) {}

    async execute(ctx: EventContext<any>, _next: NextFunction): Promise<IHttpResponse> {
        try {
            const request = await nodeHttpRequestFromIncomingMessage(ctx.event);
            return await this.router.route(request);
        } catch (e) {
            if (e instanceof RequestBodyTooLargeError) {
                // Close the connection after answering, so Node doesn't read the rest of the body.
                return {
                    statusCode: 413,
                    headers: { connection: "close" },
                    body: { message: e.message }
                };
            }
            if (e instanceof RouteNotFoundError) {
                return { statusCode: 404, body: { message: e.message } };
            }
            if (e && typeof e === "object" && (e as any).code) {
                console.error("HTTP handler WebinyError:", (e as any).code, (e as any).message, e);
                return {
                    statusCode: 500,
                    body: {
                        message: (e as any).message,
                        code: (e as any).code,
                        data: (e as any).data ?? null
                    }
                };
            }
            console.error("HTTP handler error:", e);
            return { statusCode: 500, body: { message: "Internal server error" } };
        }
    }
}

export const NodeHttpRouterHandler = NodeHttpEventHandler.createImplementation({
    implementation: NodeHttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
